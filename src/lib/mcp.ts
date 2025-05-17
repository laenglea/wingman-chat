import { Tool } from "../models/chat";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

let client: Client|undefined;

(async () => {
    client = await initializeClient();
})();

export async function listTools(): Promise<Tool[]> {
    if (!client) {
        return [];
    }

    console.log("list local tools");

    const result = await client.listTools();

    return result.tools.map((tool) => {
        return {
            name: tool.name,
            description: tool.description ?? "",

            parameters: tool.inputSchema,

            function: async (args: any) => {
                try {
                    console.log("call local tool", tool.name, args);

                    const result = await client?.callTool({
                        name: tool.name,
                        arguments: args,
                    });
                    
                    const results = result?.content as ToolTextResult[];
                    const texts: string[] = [];

                    for (const result of results) {
                        if (result.type === "text" && result.text) {
                            texts.push(result.text);
                        }
                    }

                    return texts.join("\n\n");
                }
                catch (error) {
                    return "tool failed";
                }               
            },
        };
    });
}

interface ToolTextResult {
    type: string;
    text?: string;
}


async function initializeClient(): Promise<Client | undefined> {
    let client: Client | undefined = undefined;
    let transport: Transport | undefined = undefined;
    
    try {
        transport = new SSEClientTransport(
            new URL("http://localhost:4200/sse"),
        );

        client = new Client({
            name: 'wingman-chat',
            version: '1.0.0'
        });

        await client.connect(transport);
        console.log("local tools connected");

        return client;
    } catch (error) {
        console.error("Error initializing MCP client:", error);
        
        if (client) {
            client.close();
        }
        
        if (transport) {
           transport.close();
        }

        return undefined;
    }
}