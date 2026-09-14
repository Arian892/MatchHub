"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useData } from "./data-provider";
import { useAuth } from "./auth-provider";
import { Avatar, Button, Notice, Sheet, inputClass } from "./ui";
import type { Match, Profile } from "@/lib/types";
import { colorFor, todayISO } from "@/lib/utils";

function Stepper({
  value,
  onChange,
  color,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  label: string;
}) {
  const set = (v: number) => onChange(Math.min(99, Math.max(0, v)));
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => set(value + 1)}
        aria-label={`Add a goal for ${label}`}
        className="flex h-11 w-full items-center justify-center rounded-t-xl border border-line bg-raised text-muted active:scale-95"
      >
        <Plus size={20} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value) || 0)}
        aria-label={`Goals for ${label}`}
        className="score-type w-full rounded-xl border border-line bg-surface py-2 text-center text-5xl font-semibold tabular outline-none focus:border-amber/70"
        style={{ color }}
      />
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value === 0}
        aria-label={`Remove a goal from ${label}`}
        className="flex h-11 w-full items-center justify-center rounded-b-xl border border-line bg-raised text-muted active:scale-95 disabled:opacity-40"
      >
        <Minus size={20} />
      </button>
    </div>
  );
}

export function MatchSheet({
  open,
  onClose,
  opponent,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  opponent: Profile;
  editing?: Match | null;
}) {
  const { profile } = useAuth();
  const { addMatch, updateMatch, deleteMatch } = useData();
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const primed = useRef(false);

  useEffect(() => {
    if (!open) {
      primed.current = false;
      return;
    }
    if (primed.current) return;
    primed.current = true;
    setError(null);
    if (editing && profile) {
      const iAmHome = editing.player1_id === profile.id;
      setMyScore(iAmHome ? editing.player1_score : editing.player2_score);
      setTheirScore(iAmHome ? editing.player2_score : editing.player1_score);
      setDate(editing.played_on);
    } else {
      setMyScore(0);
      setTheirScore(0);
      setDate(todayISO());
    }
  }, [open, editing, profile]);

  const verdict =
    myScore === theirScore
      ? `Draw, ${myScore}–${theirScore}`
      : myScore > theirScore
        ? `You win ${myScore}–${theirScore}`
        : `${opponent.username} wins ${theirScore}–${myScore}`;

  async function save() {
    setBusy(true);
    setError(null);
    const err = editing
      ? await updateMatch(editing.id, myScore, theirScore, date)
      : await addMatch(opponent.id, myScore, theirScore, date);
    setBusy(false);
    if (err) setError(err);
    else onClose();
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    const err = await deleteMatch(editing.id);
    setBusy(false);
    if (err) setError(err);
    else onClose();
  }

  const myColor = profile ? colorFor(profile.id) : "rgb(var(--amber))";
  const theirColor = colorFor(opponent.id);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit match" : "Add match"}
      footer={
        <div className="flex items-center gap-2">
          {editing ? (
            <Button variant="danger" onClick={remove} disabled={busy} aria-label="Delete match">
              <Trash2 size={16} />
              Delete
            </Button>
          ) : null}
          <Button variant="primary" className="flex-1" onClick={save} disabled={busy}>
            {editing ? "Save changes" : "Save match"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Avatar profile={profile} size={28} />
              <span className="truncate text-sm font-medium">You</span>
            </div>
            <Stepper value={myScore} onChange={setMyScore} color={myColor} label="you" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              <span className="truncate text-sm font-medium">{opponent.username}</span>
              <Avatar profile={opponent} size={28} />
            </div>
            <Stepper
              value={theirScore}
              onChange={setTheirScore}
              color={theirColor}
              label={opponent.username}
            />
          </div>
        </div>

        <p
          className="rounded-xl border border-line bg-raised px-3 py-2.5 text-center text-sm"
          aria-live="polite"
        >
          {verdict}
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Date</span>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <Notice>{error}</Notice>
      </div>
    </Sheet>
  );
}
