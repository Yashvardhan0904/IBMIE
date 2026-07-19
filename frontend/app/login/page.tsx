"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, UserPlus } from "lucide-react";
import { TopBar, Card } from "@/components/UI";
import { T } from "@/lib/tokens";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/firebase";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistUser = (user: { displayName: string | null; email: string | null; uid: string }) => {
    localStorage.setItem(
      "vitalis_user",
      JSON.stringify({
        uid: user.uid,
        name: user.displayName || fullName,
        email: user.email,
        provider: "firebase",
      }),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user =
        mode === "register"
          ? await registerWithEmail(fullName, email, password)
          : await loginWithEmail(email, password);
      persistUser(user);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await loginWithGoogle();
      persistUser(user);
      const rawProfile = localStorage.getItem("vitalis_health_profile");
      const profile = rawProfile ? JSON.parse(rawProfile) : {};
      localStorage.setItem(
        "vitalis_health_profile",
        JSON.stringify({
          ...profile,
          full_name: profile.full_name || user.displayName || "",
        }),
      );
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <TopBar title="User login" subtitle="Sign in before building your personal health context" />
      <Card className="p-6">
        <div className="flex items-center gap-2 rounded-lg p-1 w-fit mb-5" style={{ background: T.canvasAlt }}>
          {[
            { key: "login", label: "Login" },
            { key: "register", label: "Create account" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key as Mode)}
              className="rounded-md px-3.5 py-2 text-[12.5px] font-semibold"
              style={{
                background: mode === item.key ? T.card : "transparent",
                color: mode === item.key ? T.primary : T.muted,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: T.muted }}>FULL NAME</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
                style={{ border: `1px solid ${T.border}`, color: T.ink }}
                placeholder="Your full name"
                required
              />
            </label>
          )}

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

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: T.muted }}>PASSWORD</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg px-3.5 py-3 outline-none text-[13px]"
              style={{ border: `1px solid ${T.border}`, color: T.ink }}
              placeholder="Minimum 6 characters"
              type="password"
              required
            />
          </label>

          {error && (
            <div className="rounded-lg p-3 text-[12.5px]" style={{ background: T.criticalTint, color: T.critical }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg py-3 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: T.primary, color: "#fff" }}
          >
            {mode === "register" ? <UserPlus size={16} /> : <LogIn size={16} />}
            {mode === "register" ? "Create account" : "Login"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={signInGoogle}
            className="rounded-lg py-3 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: T.canvasAlt, color: T.ink }}
          >
            <Mail size={16} /> Continue with Google
          </button>
        </form>
      </Card>
    </div>
  );
}
