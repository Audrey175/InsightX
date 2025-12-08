import { USE_MOCK, simulateRequest, apiClient } from "./api";
import type { ChatMessage } from "../types/chat";

export interface ChatRequestBody {
  messages: ChatMessage[];
}

export interface ChatApiResponse {
  message: ChatMessage;
}

const CHAT_USE_MOCK =
  import.meta.env.VITE_CHAT_USE_MOCK !== undefined
    ? import.meta.env.VITE_CHAT_USE_MOCK === "true"
    : USE_MOCK;

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<ChatMessage> {
  if (CHAT_USE_MOCK) {
    return simulateRequest<ChatMessage>(() => {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const content = lastUser?.content ?? "How can I help you today?";

      return {
        id: `mock-${Date.now()}`,
        role: "assistant",
        content: `Mock assistant: I received "${content}". When the backend is connected, this will be replaced with a real clinical AI response.`,
        createdAt: new Date().toISOString(),
      };
    });
  }

  const res = await apiClient.post<ChatApiResponse>("/chat", {
    messages,
  } satisfies ChatRequestBody);

  return res.data.message;
}
