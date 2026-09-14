"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Pencil, Plus, UserMinus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { MatchSheet } from "@/components/match-sheet";
import { GoalsChart, WinsChart } from "@/components/charts";
import {
  Avatar,
  Button,
  Empty,
  FormRun,
  MirrorMetric,
  Notice,
  SectionTitle,
  Sheet,
  Skeleton,
  SplitBar,
  Stat,
  WinRateDial,
} from "@/components/ui";
import { buildRecord } from "@/lib/stats";
import type { Match, OrientedMatch } from "@/lib/types";
import { cn, colorFor, formatDate } from "@/lib/utils";

export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { players, matches, loading, removePlayer } = useData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opponent = players.find((p) => p.id === params.id);

  const record = useMemo(
    () => (profile && opponent ? buildRecord(matches, profile.id, opponent.id) : null),
    [matches, profile, opponent],
  );

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (!opponent || !profile || !record) {
    return (
      <Empty
        title="Player not found"
        body="They may have been removed from your list."
        action={
          <Link href="/">
            <Button>Back to players</Button>
          </Link>
        }
      />
    );
  }

  const myColor = colorFor(profile.id);
  const theirColor = colorFor(opponent.id);

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (match: Match) => {
    setEditing(match);
    setSheetOpen(true);
  };

  async function remove() {
    if (!opponent) return;
    const err = await removePlayer(opponent.id);
    if (err) setError(err);
    else window.location.href = "/";
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted">
          <ChevronLeft size={18} />
          Players
        </Link>
        <button
          onClick={() => setConfirmRemove(true)}
          className="flex items-center gap-1.5 text-sm text-muted active:text-loss"
        >
          <UserMinus size={16} />
          Remove
        </button>
      </div>

      {/* Record header ------------------------------------------------ */}
      <section className="floodlight mb-5 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <Avatar profile={profile} size={48} />
            <span className="text-xs text-muted">You</span>
          </div>
          <div className="text-center">
            <div className="score-type flex items-baseline gap-2 text-5xl font-semibold tabular">
              <span style={{ color: myColor }}>{record.won}</span>
              <span className="text-2xl text-faint">–</span>
              <span className="text-2xl text-draw">{record.drawn}</span>
              <span className="text-2xl text-faint">–</span>
              <span style={{ color: theirColor }}>{record.lost}</span>
            </div>
            <p className="mt-1 text-xs text-muted">win · draw · loss</p>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <Avatar profile={opponent} size={48} />
            <span className="max-w-[6rem] truncate text-xs text-muted">
              {opponent.username}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <SplitBar won={record.won} drawn={record.drawn} lost={record.lost} height={12} />
          <p className="mt-2 text-center text-sm text-muted">
            {record.played === 0
              ? "No matches yet"
              : `${record.played} ${record.played === 1 ? "match" : "matches"} played`}
          </p>
        </div>

        <Button variant="primary" full className="mt-5" onClick={openAdd}>
          <Plus size={18} />
          Add match
        </Button>
      </section>

      {record.played === 0 ? (
        <Empty
          title="Nothing recorded"
          body={`Add your first match against ${opponent.username} and the statistics build themselves. ${opponent.username} sees it too.`}
          action={
            <Button variant="primary" onClick={openAdd}>
              Add match
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Win rate --------------------------------------------- */}
          <section className="panel flex items-center justify-around gap-4 p-5">
            <WinRateDial value={record.winRate} color={myColor} caption="Your win rate" />
            <WinRateDial
              value={record.lossRate}
              color={theirColor}
              caption={`${opponent.username}'s`}
              size={110}
            />
          </section>

          {/* Goals ------------------------------------------------ */}
          <section>
            <SectionTitle title="Goals" />
            <div className="panel space-y-4 p-5">
              <MirrorMetric
                label="scored"
                mine={record.goalsScored}
                theirs={record.goalsConceded}
                myColor={myColor}
                theirColor={theirColor}
              />
              <MirrorMetric
                label="per match"
                mine={record.avgScored}
                theirs={record.avgConceded}
                myColor={myColor}
                theirColor={theirColor}
                format={(n) => n.toFixed(1)}
              />
              <MirrorMetric
                label="clean sheets"
                mine={record.cleanSheets}
                theirs={record.history.filter((o) => o.scored === 0).length}
                myColor={myColor}
                theirColor={theirColor}
              />
              <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                <Stat
                  label="Goal difference"
                  value={record.goalDiff > 0 ? `+${record.goalDiff}` : record.goalDiff}
                  accent={
                    record.goalDiff === 0
                      ? undefined
                      : record.goalDiff > 0
                        ? myColor
                        : theirColor
                  }
                />
                <Stat
                  label="Goals in the fixture"
                  value={record.goalsScored + record.goalsConceded}
                  sub={`${(
                    (record.goalsScored + record.goalsConceded) /
                    record.played
                  ).toFixed(1)} per match`}
                />
              </div>
            </div>
          </section>

          {/* Form and streaks ------------------------------------- */}
          <section>
            <SectionTitle title="Form" />
            <div className="panel space-y-5 p-5">
              <div>
                <p className="mb-2 text-sm text-muted">Your last results, newest first</p>
                <FormRun form={record.form} size={30} />
              </div>
              {record.currentStreak && record.currentStreak.count > 1 ? (
                <p
                  className={cn(
                    "score-type rounded-full border px-3 py-1 text-center text-base",
                    record.currentStreak.type === "W" && "border-win/40 bg-win/10 text-win",
                    record.currentStreak.type === "D" && "border-draw/40 bg-draw/10 text-draw",
                    record.currentStreak.type === "L" && "border-loss/40 bg-loss/10 text-loss",
                  )}
                >
                  {record.currentStreak.count}{" "}
                  {record.currentStreak.type === "W"
                    ? "wins"
                    : record.currentStreak.type === "D"
                      ? "draws"
                      : "losses"}{" "}
                  in a row
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Winning streak now" value={record.currentWinStreak} />
                <Stat label="Longest winning streak" value={record.longestWinStreak} />
                <Stat label="Unbeaten run now" value={record.currentUnbeaten} />
                <Stat label="Longest unbeaten run" value={record.longestUnbeaten} />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                <Highlight label="Your biggest win" oriented={record.biggestWin} />
                <Highlight label="Heaviest defeat" oriented={record.biggestLoss} />
              </div>
            </div>
          </section>

          {/* Charts ----------------------------------------------- */}
          <section>
            <SectionTitle title="Over time" />
            <div className="space-y-4">
              <div className="panel p-4">
                <p className="mb-3 text-sm text-muted">Goals in each match</p>
                <GoalsChart
                  data={record.timeline}
                  theirName={opponent.username}
                  myColor={myColor}
                  theirColor={theirColor}
                />
              </div>
              <div className="panel p-4">
                <p className="mb-3 text-sm text-muted">Wins, match by match</p>
                <WinsChart
                  data={record.timeline}
                  theirName={opponent.username}
                  myColor={myColor}
                  theirColor={theirColor}
                />
              </div>
            </div>
          </section>

          {/* History ---------------------------------------------- */}
          <section>
            <SectionTitle title="Every match" />
            <div className="panel overflow-hidden">
              {record.history.map((o) => (
                <button
                  key={o.match.id}
                  onClick={() => openEdit(o.match)}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 active:bg-raised"
                >
                  <span
                    className={cn(
                      "score-type flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base font-semibold",
                      o.result === "W" && "border-win/35 bg-win/15 text-win",
                      o.result === "D" && "border-draw/35 bg-draw/15 text-draw",
                      o.result === "L" && "border-loss/35 bg-loss/15 text-loss",
                    )}
                  >
                    {o.result}
                  </span>
                  <span className="score-type text-2xl font-semibold tabular">
                    {o.scored}
                    <span className="mx-1 text-faint">:</span>
                    {o.conceded}
                  </span>
                  <span className="ml-auto text-xs text-faint">{formatDate(o.date)}</span>
                  <Pencil size={14} className="shrink-0 text-faint" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <Notice>{error}</Notice>

      <MatchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        opponent={opponent}
        editing={editing}
      />

      <Sheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Remove ${opponent.username}?`}
        footer={
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setConfirmRemove(false)}>
              Keep
            </Button>
            <Button variant="danger" className="flex-1" onClick={remove}>
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          They come off both lists, yours and theirs. The matches you played stay recorded, and
          they come back if either of you adds the other again.
        </p>
      </Sheet>
    </>
  );
}

function Highlight({
  label,
  oriented,
}: {
  label: string;
  oriented: OrientedMatch | null;
}) {
  return (
    <div>
      <p className="text-[13px] text-muted">{label}</p>
      {oriented ? (
        <>
          <p className="score-type text-2xl font-semibold leading-tight tabular">
            {oriented.scored}–{oriented.conceded}
          </p>
          <p className="text-xs text-faint">{formatDate(oriented.date)}</p>
        </>
      ) : (
        <p className="score-type text-2xl leading-tight text-faint">—</p>
      )}
    </div>
  );
}
