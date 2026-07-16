import { jsonrepair } from "jsonrepair";

/**
 * Thrown when tool-call arguments can't be parsed even after recovery.
 * Carries the raw string so callers can craft a model-facing error.
 */
export class ToolArgumentsParseError extends Error {
  /** The raw (un-recoverable) arguments string, retained for logging. */
  readonly raw: string;

  constructor(raw: string, reason: unknown) {
    super(reason instanceof Error ? reason.message : String(reason));
    this.name = "ToolArgumentsParseError";
    this.raw = raw;
  }
}

/**
 * Hints derived from a tool's JSON-Schema that let the recovery path slice a
 * mis-escaped argument string. `payloadKey` is the field most likely to hold a
 * large free-text blob (source code, a shell command); `otherKeys` are the
 * remaining declared properties, used as structural boundaries.
 */
export interface ToolArgumentHints {
  payloadKey?: string;
  otherKeys?: string[];
}

// String fields whose name implies a code/command/text payload. When a tool has
// several string properties we only enable recovery if one of them matches —
// otherwise we can't tell which holds the blob and leave it to jsonrepair.
const PAYLOAD_NAME = /^(code|command|script|source|sql|query|content|body|text|input|instructions|prompt|patch|diff)$/i;

function asObject(value: unknown): Record<string, unknown> {
  // Tool arguments are always a JSON object. A bare array/number/string means
  // the model emitted something malformed enough that repair "succeeded" on the
  // wrong shape — treat that as a non-object and let callers see empty args.
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isStringType(schema: unknown): boolean {
  const typed = schema as { type?: unknown; anyOf?: unknown; oneOf?: unknown };
  const type = typed?.type;
  const alternatives = Array.isArray(typed?.anyOf) ? typed.anyOf : Array.isArray(typed?.oneOf) ? typed.oneOf : [];
  return type === "string" || (Array.isArray(type) && type.includes("string")) || alternatives.some(isStringType);
}

/**
 * Inspect a tool's JSON-Schema `parameters` and pick the field recovery should
 * target. Returns an empty object when no single payload field can be
 * identified, which keeps recovery off for tools where it might mis-target.
 */
export function toolArgumentHints(parameters: unknown): ToolArgumentHints {
  const properties = (parameters as { properties?: Record<string, unknown> })?.properties;
  if (!properties || typeof properties !== "object") return {};

  const names = Object.keys(properties);
  const stringNames = names.filter((n) => isStringType(properties[n]));
  if (stringNames.length === 0) return {};

  // Only recover fields whose name identifies them as a free-text payload.
  // A lone top-level string is not necessarily the payload: edit_file, for
  // example, has a string `path` plus quote-heavy strings nested in `edits`.
  // Treating `path` as dominant would discard the edits on malformed input.
  const payloadKey = stringNames.find((n) => PAYLOAD_NAME.test(n));
  if (!payloadKey) return {};

  return { payloadKey, otherKeys: names.filter((n) => n !== payloadKey) };
}

/**
 * Decode a JSON string body leniently. Standard escapes (`\n \t \r \" \\ \/ \b
 * \f \uXXXX`) are interpreted; any other backslash sequence (`\d`, `\w`, `\U`,
 * …) is kept verbatim so regexes and paths survive. Only used on the recovery
 * path — well-formed arguments are parsed strictly and never reach this.
 */
function lenientUnescape(raw: string, quote: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\" || i + 1 >= raw.length) {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    if (next === quote || (quote === "\u201c" && next === "\u201d") || (quote === "\u2018" && next === "\u2019")) {
      out += next;
      i++;
      continue;
    }
    switch (next) {
      case '"':
        out += '"';
        i++;
        break;
      case "\\":
        out += "\\";
        i++;
        break;
      case "/":
        out += "/";
        i++;
        break;
      case "n":
        out += "\n";
        i++;
        break;
      case "t":
        out += "\t";
        i++;
        break;
      case "r":
        out += "\r";
        i++;
        break;
      case "b":
        out += "\b";
        i++;
        break;
      case "f":
        out += "\f";
        i++;
        break;
      case "u": {
        const hex = raw.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else {
          out += ch; // invalid \u — keep the backslash literally
        }
        break;
      }
      default:
        out += ch; // unknown escape (\d, \w, \U, …) — keep the backslash literally
    }
  }
  return out;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match JSON, JavaScript/Python, and typographic spellings of a property key. */
function propertyKeyPattern(key: string): string {
  const escaped = escapeRegExp(key);
  return `(?:"${escaped}"|'${escaped}'|\`${escaped}\`|\u201c${escaped}\u201d|\u2018${escaped}\u2019|${escaped})`;
}

function parseObjectFragment(fragment: string, declaredKeys: readonly string[]): Record<string, unknown> | null {
  let normalized = fragment;
  for (const key of declaredKeys) {
    const canonical = JSON.stringify(key);
    normalized = normalized.replace(
      new RegExp(
        `(?:'${escapeRegExp(key)}'|\`${escapeRegExp(key)}\`|\u201c${escapeRegExp(key)}\u201d|\u2018${escapeRegExp(key)}\u2019|${escapeRegExp(key)})\\s*:`,
        "g",
      ),
      `${canonical}:`,
    );
  }
  // Smart quotes are sometimes applied to the whole function call by a rich
  // text boundary. At this point the fragment contains sibling arguments only,
  // so converting paired smart strings cannot alter the recovered payload.
  normalized = normalized
    .replace(/\u201c([^\u201d]*)\u201d/g, (_match, value: string) => JSON.stringify(value))
    .replace(/\u2018([^\u2019]*)\u2019/g, (_match, value: string) => JSON.stringify(value));

  try {
    return asObject(JSON.parse(normalized));
  } catch {
    try {
      return asObject(JSON.parse(jsonrepair(normalized)));
    } catch {
      return null;
    }
  }
}

function parseLeadingSiblings(
  text: string,
  propertyStart: number,
  declaredKeys: readonly string[],
): Record<string, unknown> | null {
  const objectStart = text.indexOf("{");
  if (objectStart < 0 || objectStart >= propertyStart) return {};
  const body = text
    .slice(objectStart + 1, propertyStart)
    .trim()
    .replace(/,$/, "");
  return body ? parseObjectFragment(`{${body}}`, declaredKeys) : {};
}

function parseTrailingSiblings(
  text: string,
  separator: number,
  declaredKeys: readonly string[],
): Record<string, unknown> | null {
  const outerEnd = text.lastIndexOf("}");
  let body = text.slice(separator + 1, outerEnd > separator ? outerEnd : text.length).trim();
  body = body.replace(/```(?:json)?\s*$/i, "").trim();
  return body ? parseObjectFragment(`{${body}}`, declaredKeys) : {};
}

/**
 * Recover the value of a single dominant string field from arguments that
 * `JSON.parse` rejected. Models routinely leave inner quotes, newlines, tabs,
 * and backslashes unescaped when packing source into `code`/`command`. Rather
 * than guess like `jsonrepair` — which can silently truncate the payload and
 * invent keys — this anchors on the field's structural boundaries: the value
 * runs from its opening quote to the last `,"<otherKey>":` separator (or the
 * closing brace), then is leniently un-escaped.
 */
function recoverDominantStringField(
  text: string,
  payloadKey: string,
  otherKeys: string[],
): Record<string, unknown> | null {
  const open = new RegExp(`(?:^|[,{])\\s*${propertyKeyPattern(payloadKey)}\\s*:\\s*(["'\u201c\u2018\x60])`).exec(text);
  if (!open) return null;
  const start = open.index + open[0].length;
  const quote = open[1];
  const closingQuote = quote === "\u201c" ? "\u201d" : quote === "\u2018" ? "\u2019" : quote;

  // Parse the structurally complete part before the payload. Besides recovering
  // leading values, this is more precise than merely looking for key-shaped text
  // that may itself occur inside a path or another string.
  const leading = parseLeadingSiblings(text, open.index, otherKeys);
  if (!leading) return null;
  const leadingKeys = new Set(Object.keys(leading).filter((key) => otherKeys.includes(key)));

  // A key-looking sequence inside source code is only accepted as an outer
  // boundary when everything after it parses as a sibling-object fragment.
  // This prevents `const x = {"method":"GET","path":"/api"}` from truncating
  // `code` when the actual outer `path` argument was omitted.
  const possibleOuterEnd = text.lastIndexOf("}");
  const afterOuterEnd =
    possibleOuterEnd >= 0
      ? text
          .slice(possibleOuterEnd + 1)
          .replace(/```(?:json)?/gi, "")
          .trim()
      : "";
  const beforeOuterEnd = possibleOuterEnd >= 0 ? text.slice(0, possibleOuterEnd).trimEnd() : "";
  let boundary =
    possibleOuterEnd >= start && afterOuterEnd === "" && beforeOuterEnd.endsWith(closingQuote)
      ? possibleOuterEnd
      : text.length;
  let trailing: Record<string, unknown> = {};
  for (const key of otherKeys) {
    if (leadingKeys.has(key)) continue;
    const separator = new RegExp(`,\\s*${propertyKeyPattern(key)}\\s*:`, "g");
    const candidates = [...text.slice(start).matchAll(separator)].map((match) => start + match.index).reverse();
    for (const candidate of candidates) {
      const parsed = parseTrailingSiblings(text, candidate, otherKeys);
      if (
        parsed &&
        Object.prototype.hasOwnProperty.call(parsed, key) &&
        Object.keys(parsed).every((parsedKey) => otherKeys.includes(parsedKey))
      ) {
        if (candidate < boundary) {
          boundary = candidate;
          trailing = parsed;
        }
        break;
      }
    }
  }

  // Trim trailing whitespace, then the single closing quote of the value.
  let end = boundary;
  while (end > start && /\s/.test(text[end - 1])) end--;
  if (text[end - 1] === closingQuote) end--;

  const result: Record<string, unknown> = {
    ...leading,
    ...trailing,
    [payloadKey]: lenientUnescape(text.slice(start, end), quote),
  };

  return result;
}

/**
 * Parse LLM tool-call arguments. Models frequently mis-escape quotes, newlines,
 * tabs, and backslashes when packing source code into a JSON string field,
 * producing arguments that `JSON.parse` rejects (e.g. `{"code":"print("hi")"}`).
 *
 * Order of attempts:
 *  1. Strict `JSON.parse` — well-formed args always win and are never touched.
 *  2. Schema-aware recovery of the dominant string field (when `hints.payloadKey`
 *     is known) — precise and boundary-anchored.
 *  3. `jsonrepair` — generic last resort for tools without a payload field.
 *
 * Recovery runs *before* `jsonrepair` because `jsonrepair` can silently truncate
 * a code payload (e.g. `python3 -c "print('hi')"` → `python3 -c `); for the code
 * tools we'd rather reconstruct the field than execute a corrupted command.
 *
 * @throws {ToolArgumentsParseError} when nothing recovers the string.
 */
export function parseToolArguments(raw: string | undefined | null, hints?: ToolArgumentHints): Record<string, unknown> {
  const text = (raw ?? "").trim();
  if (!text) return {};

  try {
    return asObject(JSON.parse(text));
  } catch {
    // Fall through to recovery.
  }

  if (hints?.payloadKey) {
    const recovered = recoverDominantStringField(text, hints.payloadKey, hints.otherKeys ?? []);
    if (recovered) return recovered;
  }

  try {
    return asObject(JSON.parse(jsonrepair(text)));
  } catch (reason) {
    throw new ToolArgumentsParseError(text, reason);
  }
}

/**
 * Lenient variant for UI/render paths that should never throw — returns `null`
 * instead of raising. Use this when parsing partial (mid-stream) arguments or
 * when a parse failure should just hide a preview rather than surface an error.
 */
export function tryParseToolArguments(
  raw: string | undefined | null,
  hints?: ToolArgumentHints,
): Record<string, unknown> | null {
  try {
    return parseToolArguments(raw, hints);
  } catch {
    return null;
  }
}
