"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { PageHeader } from "@/components/app-frame";
import {
  Avatar,
  Button,
  Field,
  Notice,
  SectionTitle,
  inputClass,
} from "@/components/ui";
import { buildRecord } from "@/lib/stats";

export default function ProfilePage() {
  const { profile, changeUsername, changePassword, signOut } = useAuth();
  const { players, matches } = useData();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [nameMsg, setNameMsg] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passMsg, setPassMsg] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );
  const [passBusy, setPassBusy] = useState(false);

  useEffect(() => {
    if (profile) setUsername(profile.username);
  }, [profile]);

  const played = matches.length;
  const won = profile
    ? players.reduce((sum, p) => sum + buildRecord(matches, profile.id, p.id).won, 0)
    : 0;

  async function saveUsername() {
    setNameBusy(true);
    setNameMsg(null);
    const err = await changeUsername(username);
    setNameBusy(false);
    setNameMsg(
      err ? { tone: "error", text: err } : { tone: "success", text: "Username updated." },
    );
  }

  async function savePassword() {
    if (password !== confirm) {
      setPassMsg({ tone: "error", text: "The two passwords don't match." });
      return;
    }
    setPassBusy(true);
    setPassMsg(null);
    const err = await changePassword(currentPassword, password);
    setPassBusy(false);
    if (err) {
      setPassMsg({ tone: "error", text: err });
    } else {
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setPassMsg({
        tone: "success",
        text: "Password changed. Other devices have been signed out.",
      });
    }
  }

  async function leave() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader title="Profile" />

      <section className="panel mb-6 flex items-center gap-4 p-5">
        <Avatar profile={profile} size={56} />
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{profile?.username}</p>
          <p className="text-sm text-muted">
            {played} {played === 1 ? "match" : "matches"} · {won} won
          </p>
        </div>
      </section>

      <section className="mb-6">
        <SectionTitle title="Username" />
        <div className="panel space-y-3 p-5">
          <Field label="Your username" hint="Friends add you with this, so tell them if it changes.">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </Field>
          {nameMsg ? <Notice tone={nameMsg.tone}>{nameMsg.text}</Notice> : null}
          <Button
            full
            onClick={saveUsername}
            disabled={nameBusy || !username.trim() || username === profile?.username}
          >
            Save username
          </Button>
        </div>
      </section>

      <section className="mb-6">
        <SectionTitle title="Password" />
        <div className="panel space-y-3 p-5">
          <Field label="Current password">
            <input
              className={inputClass}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••"
            />
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••"
            />
          </Field>
          <Field label="Repeat it">
            <input
              className={inputClass}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••"
            />
          </Field>
          {passMsg ? <Notice tone={passMsg.tone}>{passMsg.text}</Notice> : null}
          <Button
            full
            onClick={savePassword}
            disabled={passBusy || password.length < 6 || currentPassword.length === 0}
          >
            Change password
          </Button>
        </div>
      </section>

      <Button variant="danger" full size="lg" onClick={leave}>
        <LogOut size={18} />
        Sign out
      </Button>
    </>
  );
}
