import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { ChatMessage } from "../types/chat";

export interface ChatRequestBody {
  message: string;
}

export interface ChatApiResponse {
  reply: string;
}

// Chat-specific toggle; falls back to global USE_MOCK if not set
const CHAT_USE_MOCK =
  import.meta.env.VITE_CHAT_USE_MOCK !== undefined
    ? import.meta.env.VITE_CHAT_USE_MOCK === "true"
    : USE_MOCK;

/**
 * Send the current conversation to the backend and get the next assistant message.
 */
export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<ChatMessage> {
  // 1️⃣ MOCK MODE – just echo back inline, no backend
  if (CHAT_USE_MOCK) {
    return simulateRequest<ChatMessage>(() => {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const content = lastUser?.content ?? "How can I help you today?";

      return {
        id: `mock-${Date.now()}`,
        role: "assistant",
        content: `Mock assistant: I received "${content}".`,
        createdAt: new Date().toISOString(),
      };
    });
  }

  // 2️⃣ LIVE MODE – call your FastAPI /chat
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const content = lastUser?.content ?? "";

  const res = await apiClient.post<ChatApiResponse>("/chat", {
    message: content,
  } satisfies ChatRequestBody);

  // Map backend { reply } → ChatMessage for the UI
  return {
    id: `api-${Date.now()}`,
    role: "assistant",
    content: res.data.reply,
    createdAt: new Date().toISOString(),
  };
}