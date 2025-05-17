import { Tool } from "../models/chat";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
//import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
//import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

let client: Client|undefined;

(async () => {
    client = await initializeClient();
})();

export async function listTools(): Promise<Tool[]> {
    if (!client) {
        return [];
    }

    const result = await client.listTools();

    return result.tools.map((tool) => {
        return {
            name: tool.name,
            description: tool.description ?? "",

            parameters: tool.inputSchema,
        };
    });
}

interface ToolTextResult {
    type: string;
    text?: string;
}

export async function callTool(name: string, args: any): Promise<string> {
    if (!client) {
        return "";
    }

    console.log("Calling tool:", name, args);

    const result = await client.callTool({
      name: name,
      arguments: args,
    });

    if (result && result.content) {
        try {
            const results = result.content as ToolTextResult[];
            const texts: string[] = [];

            for (const result of results) {
                if (result.type === "text" && result.text) {
                    texts.push(result.text);
                }
            }

            return texts.join("\n\n");

        } catch (error) {
            console.error("Error parsing tool result content:", error);
            return "";
        }
    }

    return "";
}

async function initializeClient(): Promise<Client | undefined> {
    return undefined;
    
    // let client: Client | undefined = undefined;
    // let transport: Transport | undefined = undefined;
    
    // try {
    //     transport = new SSEClientTransport(
    //         new URL("http://localhost:4200/sse"),
    //     );

    //     client = new Client({
    //         name: 'wingman-client',
    //         version: '1.0.0'
    //     });

    //     await client.connect(transport);
    //     console.log("Local MCP Server connected");

    //     return client;
    // } catch (error) {
    //     console.error("Error initializing MCP client:", error);
        
    //     if (client) {
    //         client.close();
    //     }
        
    //     if (transport) {
    //        transport.close();
    //     }

    //     return undefined;
    // }
}