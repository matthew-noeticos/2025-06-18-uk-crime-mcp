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

		// Get all police forces
		this.server.tool(
			"get_all_police_forces",
			{},
			async () => {
				const policeForces = await fetch(`https://data.police.uk/api/forces`)
				const policeForcesJson = await policeForces.json()

				return {
					content: [
						{
							type: "text",
							text: `Here is a JSON object of all police forces. Find the id of the police force that is most relevant to the users query using general logic: ${JSON.stringify(policeForcesJson)}`
						}
					]
				};
			}
		)

		// Convert date to correct format
		this.server.tool(
			"convert_date_to_correct_format",
			{ date: z.string() },
			async ({ date }) => {
				return {
					content: [
						{
							type: "text",
							text: `Ensure that the date is in the format YYYY-MM`
						}
					]
				};
			}
		)

		// Get crimes for a specific date
		this.server.tool(
			"get_crimes_for_specific_date_and_police_force_id",
			{ date: z.string(), force_id: z.string() },
			async ({ date, force_id }) => {
				const crimes = await fetch(`https://data.police.uk/api/crimes-no-location?category=all-crime&date=${date}&force=${force_id}`)
				const crimesJson = await crimes.json()

				return {
					content: [
						{
							type: "text",
							text: `Here is a JSON object of all crimes committed on ${date} for the police force with id ${force_id}: ${JSON.stringify(crimesJson)}`
						}
					]
				};
			}
		)


		// // Turn address into longitude and latitude
		// this.server.tool(
		// 	"address_to_lat_and_lon",
		// 	{ address: z.string() },
		// 	async ({ address }) => {
		// 		const latitude = 51.500370;
		// 		const longitude = -0.126862;
		// 		return {
		// 			content: [{ type: "text", text: `The latitude for ${address} is ${latitude} and the longitude is ${longitude}` }],
		// 		};
		// 	}
		// )


		// // Get crime at specific latitude and longitude
		// this.server.tool(
		// 	"get_crime_at_lat_and_lon",
		// 	{ latitude: z.number(), longitude: z.number() },
		// 	async ({ latitude, longitude }) => {
		// 		return {
		// 			content: [
		// 				{
		// 					type: "text",
		// 					text: `The crime committed at ${latitude} and ${longitude} is theft`
		// 				}
		// 			]
		// 		};
		// 	}
		// )
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
