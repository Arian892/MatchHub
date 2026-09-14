"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { PageHeader } from "@/components/app-frame";
import {
  Avatar,
  Button,
  Empty,
  Field,
  FormRun,
  Notice,
  Sheet,
  Skeleton,
  inputClass,
} from "@/components/ui";
import { buildRecord } from "@/lib/stats";
import { relativeDay } from "@/lib/utils";

export default function PlayersPage() {
  const { profile } = useAuth();
  const { players, matches, loading, addPlayer } = useData();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    if (!profile) return [];
    return players
      .map((p) => ({ player: p, record: buildRecord(matches, profile.id, p.id, 5) }))
      .sort((a, b) => b.record.played - a.record.played);
  }, [players, matches, profile]);

  async function add() {
    setBusy(true);
    setError(null);
    const err = await addPlayer(username);
    setBusy(false);
    if (err) {
      setError(err.includes("No account") ? "No account with that username." : err);
      return;
    }
    setUsername("");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Players"
        sub={profile ? `Signed in as ${profile.username}` : undefined}
        action={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Add
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[86px]" />
          <Skeleton className="h-[86px]" />
        </div>
      ) : rows.length === 0 ? (
        <Empty
          title="No players yet"
          body="Add a friend by their MatchHub username. They have to have an account, and they get you on their list at the same time."
          action={
            <Button variant="primary" onClick={() => setOpen(true)}>
              Add a player
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ player, record }) => (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="panel flex items-center gap-3 px-4 py-3.5 active:bg-raised"
            >
              <Avatar profile={player} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{player.username}</p>
                {record.played === 0 ? (
                  <p className="text-xs text-faint">No matches yet</p>
                ) : (
                  <>
                    <p className="score-type text-lg leading-tight tabular">
                      <span className="text-win">{record.won}</span>
                      <span className="text-faint"> · </span>
                      <span className="text-draw">{record.drawn}</span>
                      <span className="text-faint"> · </span>
                      <span className="text-loss">{record.lost}</span>
                      <span className="ml-2 text-sm font-normal text-muted">
                        in {record.played}
                      </span>
                    </p>
                    <p className="text-xs text-faint">
                      Last played {relativeDay(record.lastMeeting?.date ?? "").toLowerCase()}
                    </p>
                  </>
                )}
              </div>
              <div className="hidden xs:block">
                <FormRun form={record.form.slice(0, 3)} size={22} empty="" />
              </div>
              <ChevronRight size={18} className="shrink-0 text-faint" />
            </Link>
          ))}
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add a player"
        footer={
          <Button variant="primary" full onClick={add} disabled={busy || !username.trim()}>
            Add player
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Their username" hint="Exactly as they typed it when signing up.">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="nabil_7"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </Field>
          <Notice>{error}</Notice>
          <p className="text-xs text-faint">
            Adding works both ways: you appear on their list too, and any match either of you
            records shows up for both.
          </p>
        </div>
      </Sheet>
    </>
  );
}
