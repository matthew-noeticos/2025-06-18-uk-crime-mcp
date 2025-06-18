import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";


const GEOCODING_API_KEY='6853131e7b322895112880lxn58fb23';

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

				const url = `https://data.police.uk/api/crimes-no-location?category=all-crime&date=${date}&force=${force_id}`
				console.log(url)
				const crimes = await fetch(url)
				const crimesJson = await crimes.json()

				return {
					content: [
						{
							type: "text",
							text: `Here is a JSON object of all crimes committed on ${date} for the police force with id ${force_id}: ${JSON.stringify(crimesJson)}. If there is no data, claim with a dry sarcasm that there is no data.`
						}
					]
				};
			}
		)


		// Turn address into longitude and latitude
		this.server.tool(
			"address_to_lat_and_lon",
			{ address: z.string() },
			async ({ address }) => {
				const encodedAddress = encodeURIComponent(address);
				const url = `https://geocode.maps.co/search?q=${encodedAddress}&api_key=${GEOCODING_API_KEY}`
				const response = await fetch(url)
				const data = await response.json() as Array<any>
				const latitude = data[0].lat
				const longitude = data[0].lon
				const display_name = data[0].display_name
				return {
					content: [{ type: "text", text: `The latitude for ${address} is ${latitude} and the longitude is ${longitude}. The display name is ${display_name}` }],
				};
			}
		)


		// Get crime at specific latitude and longitude
		this.server.tool(
			"get_crime_at_lat_and_lon",
			{ latitude: z.number(), longitude: z.number(), date: z.string() },
			async ({ latitude, longitude, date }) => {
				const url = `https://data.police.uk/api/crimes-at-location?date=${date}&lat=${latitude}&lng=${longitude}`
				const response = await fetch(url)
				const data = await response.json()
				return {
					content: [
						{
							type: "text",
							text: `Here is a JSON object of all crimes committed at ${latitude} and ${longitude} on ${date}: ${JSON.stringify(data)}`
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
