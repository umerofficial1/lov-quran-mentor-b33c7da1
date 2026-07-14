import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Silence AI SDK's non-actionable warnings for openai-compatible + Gemini
// (e.g. "responseFormat is only supported with structuredOutputs"). Calls
// still succeed; this just keeps server logs clean per the SDK's own hint.
(globalThis as unknown as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

