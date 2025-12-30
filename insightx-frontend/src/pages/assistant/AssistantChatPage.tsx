import React, { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button } from "../../components/ui/button";
import { sendChatMessage } from "../../services/chatService";
import type { ChatMessage } from "../../types/chat";
import { useAuth } from "../../context/AuthContext";

const AssistantChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const now = new Date().toISOString();
    return [
      {
        id: "welcome-1",
        role: "assistant",
        content:
          "Hi! I'm your InsightX assistant. You can ask about brain/heart scans, patient summaries, or how to use the platform.",
        createdAt: now,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);

    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: now,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const assistantMsg = await sendChatMessage(nextMessages);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Something went wrong while contacting the assistant."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              InsightX Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Ask questions about patient scans, dashboards, or how to use the
              platform. This UI is wired to a real /chat backend when
              VITE_CHAT_USE_MOCK is set to false.
            </p>
          </div>
          {user && (
            <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {user.fullName}
              </span>
              <span className="uppercase">{user.role}</span>
            </div>
          )}
        </div>

        {/* Chat card */}
        <div className="flex-1 min-h-0">
          <div className="h-full bg-white border rounded-2xl shadow-sm flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? "bg-sky-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-3 py-2 text-xs">
                    Typing…
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 pb-2 text-[11px] text-red-500">{error}</div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="border-t px-3 py-2 flex items-center gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Ask something about a scan, patient, or feature..."
                className="flex-1 resize-none text-xs bg-transparent outline-none border-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
              />
              <Button
                type="submit"
                disabled={isSending || !input.trim()}
                className="text-xs px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isSending ? "Sending…" : "Send"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssistantChatPage;
