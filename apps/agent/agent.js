import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

// Define the tools for the agent to use
const weatherTool = tool(
    async ({ query }) => {
        // This is a placeholder, but don't tell the LLM that...
        if (query.toLowerCase().includes("san francisco")) {
            return "It's 60 degrees and foggy.";
        }
        return "It's 90 degrees and sunny.";
    },
    {
        name: "weather",
        description: "Get Weather in a specific city",
        schema: z.object({
            query: z.string().describe("The query to use in your search."),
        }),
    }
);

const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
});

// Initialize memory to persist state between graph runs
const checkpointSaver = new MemorySaver();

const agent = createReactAgent({
    llm: model,
    tools: [weatherTool],
    checkpointSaver,
});

export { agent };