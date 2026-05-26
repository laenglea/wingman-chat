import { metrics, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("wingman");
const meter = metrics.getMeter("wingman");

const PROVIDER_NAME = "wingman";

// https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-metrics/
const operationDuration = meter.createHistogram("gen_ai.client.operation.duration", {
  description: "GenAI operation duration",
  unit: "s",
});

const tokenUsage = meter.createHistogram("gen_ai.client.token.usage", {
  description: "GenAI token usage",
  unit: "{token}",
});

// --- Chat / inference spans ---
// https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/

export interface GenAIResponseInfo {
  id?: string;
  model?: string;
  finishReasons?: string[];
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
}

/**
 * Wraps a chat-style GenAI call in a span per the GenAI spans spec.
 * Span name: `{operation} {model}` (e.g. "chat gpt-4o"). The `operation`
 * argument is only used as a label for the span name — the spec-defined
 * `gen_ai.operation.name` attribute is fixed to "chat" since every caller
 * today is a chat completion (including structured-output variants).
 */
export async function traceGenAI<T>(
  operation: string,
  model: string,
  fn: () => Promise<{ result: T; response?: GenAIResponseInfo }>,
): Promise<T> {
  return tracer.startActiveSpan(`${operation} ${model}`, { kind: SpanKind.CLIENT }, async (span) => {
    span.setAttribute("gen_ai.operation.name", "chat");
    span.setAttribute("gen_ai.provider.name", PROVIDER_NAME);
    span.setAttribute("gen_ai.request.model", model);

    const start = performance.now();
    let responseModel: string | undefined;
    let errorType: string | undefined;

    try {
      const { result, response } = await fn();

      if (response) {
        responseModel = response.model;

        if (response.id) span.setAttribute("gen_ai.response.id", response.id);
        if (response.model) span.setAttribute("gen_ai.response.model", response.model);
        if (response.finishReasons) span.setAttribute("gen_ai.response.finish_reasons", response.finishReasons);

        const tokenAttrs = {
          "gen_ai.operation.name": "chat",
          "gen_ai.provider.name": PROVIDER_NAME,
          "gen_ai.request.model": model,
          ...(responseModel ? { "gen_ai.response.model": responseModel } : {}),
        };

        if (response.inputTokens != null) {
          span.setAttribute("gen_ai.usage.input_tokens", response.inputTokens);
          tokenUsage.record(response.inputTokens, { ...tokenAttrs, "gen_ai.token.type": "input" });
        }
        if (response.outputTokens != null) {
          span.setAttribute("gen_ai.usage.output_tokens", response.outputTokens);
          tokenUsage.record(response.outputTokens, { ...tokenAttrs, "gen_ai.token.type": "output" });
        }
        if (response.cachedInputTokens != null) {
          // Subset of input tokens served from the prompt cache.
          span.setAttribute("gen_ai.usage.cache_read.input_tokens", response.cachedInputTokens);
        }
        if (response.reasoningTokens != null) {
          // Subset of output tokens classified as reasoning by the provider.
          span.setAttribute("gen_ai.usage.reasoning.output_tokens", response.reasoningTokens);
        }
      }

      return result;
    } catch (error) {
      errorType = error instanceof Error ? error.constructor.name : "Error";
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.setAttribute("error.type", errorType);
      throw error;
    } finally {
      const durationS = (performance.now() - start) / 1000;
      operationDuration.record(durationS, {
        "gen_ai.operation.name": "chat",
        "gen_ai.provider.name": PROVIDER_NAME,
        "gen_ai.request.model": model,
        ...(responseModel ? { "gen_ai.response.model": responseModel } : {}),
        ...(errorType ? { "error.type": errorType } : {}),
      });
      span.end();
    }
  });
}

// --- Tool execution ---
// https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/#execute-tool-span

export interface ExecuteToolOptions {
  toolCallId?: string;
  toolDescription?: string;
  toolType?: string;
}

/**
 * Wraps a tool invocation in an `execute_tool` span per the GenAI agent-spans spec.
 * Use this around every tool dispatch (MCP, local, anything else) so the trace
 * tree shows the agent → tool relationship uniformly.
 */
export async function traceExecuteTool<T>(
  toolName: string,
  opts: ExecuteToolOptions,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(`execute_tool ${toolName}`, { kind: SpanKind.INTERNAL }, async (span) => {
    span.setAttribute("gen_ai.operation.name", "execute_tool");
    span.setAttribute("gen_ai.provider.name", PROVIDER_NAME);
    span.setAttribute("gen_ai.tool.name", toolName);
    span.setAttribute("gen_ai.tool.type", opts.toolType ?? "function");
    if (opts.toolCallId) span.setAttribute("gen_ai.tool.call.id", opts.toolCallId);
    if (opts.toolDescription) span.setAttribute("gen_ai.tool.description", opts.toolDescription);

    const start = performance.now();
    let errorType: string | undefined;

    try {
      return await fn();
    } catch (error) {
      errorType = error instanceof Error ? error.constructor.name : "Error";
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.setAttribute("error.type", errorType);
      throw error;
    } finally {
      const durationS = (performance.now() - start) / 1000;
      operationDuration.record(durationS, {
        "gen_ai.operation.name": "execute_tool",
        "gen_ai.provider.name": PROVIDER_NAME,
        "gen_ai.tool.name": toolName,
        ...(errorType ? { "error.type": errorType } : {}),
      });
      span.end();
    }
  });
}
