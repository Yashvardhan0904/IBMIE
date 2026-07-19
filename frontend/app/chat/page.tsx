"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { TopBar, Card } from "@/components/UI";
import { T } from "@/lib/tokens";
import { askHealthChat, HealthChatMessage, HealthProfile } from "@/lib/api";

const STARTER_PROMPTS = [
  "Based on my routine, what should I improve first?",
  "Explain my latest report in simple language.",
  "What habits should I track this week?",
  "What should I ask my doctor?",
];

export default function ChatPage() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [messages, setMessages] = useState<HealthChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I am Vitalis. Upload reports and add your health details, then ask me to explain what is going on in simple language.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("vitalis_health_profile");
    if (raw) setProfile(JSON.parse(raw));
  }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: HealthChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await askHealthChat({
        message: trimmed,
        profile,
        history: messages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  return (
    <div>
      <TopBar title="Ask Vitalis" subtitle="Chat about your reports, routine, sleep, eating habits, and next practical steps" />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <Card className="overflow-hidden">
          <div className="p-5 flex flex-col gap-3 min-h-[480px] max-h-[62vh] overflow-y-auto">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
                  style={{
                    background: message.role === "user" ? T.primary : T.canvasAlt,
                    color: message.role === "user" ? "#fff" : T.ink,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold opacity-80">
                    {message.role === "user" ? <UserRound size={12} /> : <Bot size={12} />}
                    {message.role === "user" ? "YOU" : "Vitalis"}
                  </div>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-[12.5px]" style={{ color: T.muted }}>
                Vitalis is thinking...
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 mb-3 rounded-lg p-3 text-[12.5px]" style={{ background: T.criticalTint, color: T.critical }}>
              {error}
            </div>
          )}

          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="rounded-full px-3 py-1.5 text-[11.5px] font-medium flex items-center gap-1.5"
                style={{ background: T.primaryTint, color: T.primaryDeep }}
              >
                <Sparkles size={11} /> {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 p-5" style={{ borderTop: `1px solid ${T.border}` }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your reports or routine..."
              className="flex-1 rounded-lg px-3.5 py-3 outline-none text-[13px]"
              style={{ border: `1px solid ${T.border}`, color: T.ink }}
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-11 rounded-lg flex items-center justify-center disabled:opacity-60"
              style={{ background: T.primary }}
            >
              <Send size={16} color="#fff" />
            </button>
          </form>
        </Card>

        <Card className="p-5 h-fit">
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>
            Context used
          </h2>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: T.inkSoft }}>
            Vitalis uses your saved health details in this chat. Report retrieval for chat context is the next backend step.
          </p>
          {profile ? (
            <div className="flex flex-col gap-2 text-[12.5px]" style={{ color: T.inkSoft }}>
              <div><strong>Conditions:</strong> {profile.diseases || "Not provided"}</div>
              <div><strong>Sleep:</strong> {profile.sleep_schedule || "Not provided"}</div>
              <div><strong>Routine:</strong> {profile.daily_routine || "Not provided"}</div>
              <div><strong>Eating:</strong> {profile.eating_habits || "Not provided"}</div>
            </div>
          ) : (
            <Link href="/profile" className="rounded-lg px-3.5 py-3 text-[13px] font-semibold block" style={{ background: T.primaryTint, color: T.primaryDeep }}>
              Add health details
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
