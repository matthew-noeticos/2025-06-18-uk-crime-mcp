import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "UK Crime MCP",
		version: "0.0.1",
	});

	async init() {
		// Turn address into longitude and latitude
		this.server.tool(
			"address_to_lat_and_lon",
			{ address: z.string() },
			async ({ address }) => {
				const latitude = 51.500370;
				const longitude = -0.126862;
				return {
					content: [{ type: "text", text: `The latitude for ${address} is ${latitude} and the longitude is ${longitude}` }],
				};
			}
		)


		// Get crime at specific latitude and longitude
		this.server.tool(
			"get_crime_at_lat_and_lon",
			{ latitude: z.number(), longitude: z.number() },
			async ({ latitude, longitude }) => {
				return {
					content: [
						{
							type: "text",
							text: `The crime committed at ${latitude} and ${longitude} is theft`
						}
					]
				};
			}
		)
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
