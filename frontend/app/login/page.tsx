"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserRound } from "lucide-react";
import { TopBar, Card } from "@/components/UI";
import { T } from "@/lib/tokens";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem("ibmie_user", JSON.stringify({ name, email }));
    router.push("/profile");
  };

  return (
    <div className="max-w-2xl">
      <TopBar title="User login" subtitle="Start a personal health companion session" />
      <Card className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: T.primaryTint }}>
              <UserRound size={18} color={T.primary} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>
                Tell IBMIE who is using this dashboard
              </h2>
              <p className="text-[12.5px]" style={{ color: T.muted }}>
                This is a local demo login until backend auth is added.
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: T.muted }}>NAME</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
              style={{ border: `1px solid ${T.border}`, color: T.ink }}
              placeholder="Patient name"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: T.muted }}>EMAIL</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
              style={{ border: `1px solid ${T.border}`, color: T.ink }}
              placeholder="name@example.com"
              type="email"
              required
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg py-3 text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{ background: T.primary, color: "#fff" }}
          >
            <LogIn size={16} /> Continue to health details
          </button>
        </form>
      </Card>
    </div>
  );
}
