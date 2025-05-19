import { Tool } from "../models/chat";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface BridgeConfig {
  name: string;
}

interface ToolTextResult {
    type: string;
    text?: string;
}

export class Bridge {
    private mcp: Client | undefined;

    private constructor() {
    }

    public static async create(baseUrl: string = "http://localhost:4200"): Promise<Bridge> {
        const bridge = new Bridge();

        try {
            const response = await fetch(new URL("/.well-known/wingman", baseUrl))

            if (!response.ok) {
                console.info("Bridge not available");
                bridge.mcp = undefined;
                return bridge
            }

            const config: BridgeConfig = await response.json();
            console.info("Bridge config", config);

        } catch {
            bridge.mcp = undefined;
            return bridge
        }        

        let client: Client | undefined = undefined;
        let transport: Transport | undefined = undefined;

        try {
            transport = new SSEClientTransport(
                new URL("/sse", baseUrl),
            );

            client = new Client({
                name: 'wingman-chat',
                version: '1.0.0'
            });

            await client.connect(transport);

            bridge.mcp = client;
            console.info("Bridge connected");
        } catch (error) {
            if (client) {
                client.close();
            }

            if (transport) {
                transport.close();
            }

            bridge.mcp = undefined;
        }

        return bridge;
    }

    public async listTools(): Promise<Tool[]> {
        console.log("list tools");
        console.log(this.mcp);

        if (!this.mcp) {
            return [];
        }

        const result = await this.mcp.listTools();
        console.log("tools", result);

        return result.tools.map((tool) => {
            return {
                name: tool.name,
                description: tool.description ?? "",

                parameters: tool.inputSchema,

                function: async (args: any) => {
                    if (!this.mcp) {
                        return "tool currently unavailable";
                    }

                    try {
                        console.log("call local tool", tool.name, args);

                        const callResult = await this.mcp.callTool({
                            name: tool.name,
                            arguments: args,
                        });

                        const results = callResult?.content as ToolTextResult[] | undefined;
                        const texts: string[] = [];

                        if (results) {
                            for (const res of results) {
                                if (res.type === "text" && res.text) {
                                    texts.push(res.text);
                                }
                            }
                        }

                        return texts.join("\n\n");
                    }
                    catch (error) {
                        console.error(`Error calling tool ${tool.name}:`, error);
                        return "tool failed";
                    }
                },
            };
        });
    }
}