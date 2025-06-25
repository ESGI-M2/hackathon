import { openai } from "@ai-sdk/openai";
import { mistral } from "@ai-sdk/mistral";

const PROVIDER = process.env.AI_PROVIDER || "mistral";

export function getAIModel() {
    if (PROVIDER === "mistral") {
        return mistral("mistral-small-latest", {
          safePrompt: true,
        });
    }

    return openai("gpt-4o-mini");
}
