"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { BrandMark } from "@/components/app-frame";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = mode === "in" ? await signIn(username, password) : await signUp(username, password);
    setBusy(false);
    if (err) setError(err);
    else router.replace("/");
  }

  return (
    <div className="pt-12">
      <BrandMark />

      <div className="mb-5 flex rounded-full border border-line bg-surface p-1">
        {(
          [
            ["in", "Sign in"],
            ["up", "Create account"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm transition",
              mode === key ? "bg-amber text-[#12142A] font-medium" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Username"
          hint={mode === "up" ? "3–20 characters: letters, numbers, underscores." : undefined}
        >
          <input
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="rafi_10"
            required
          />
        </Field>

        <Field label="Password" hint={mode === "up" ? "At least 6 characters." : undefined}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder="••••••"
            required
          />
        </Field>

        <Notice>{error}</Notice>

        <Button type="submit" variant="primary" size="lg" full disabled={busy}>
          {busy
            ? "Just a moment…"
            : mode === "in"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-faint">
        Your friends find you by username.
      </p>
    </div>
  );
}
