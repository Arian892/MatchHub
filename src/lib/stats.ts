import type { Match, OrientedMatch, Result } from "./types";

/* Oldest first. played_on is a date only, so created_at breaks ties. */
function byOldest(a: Match, b: Match) {
  if (a.played_on !== b.played_on) return a.played_on < b.played_on ? -1 : 1;
  return a.created_at < b.created_at ? -1 : 1;
}

export function sortOldestFirst(matches: Match[]) {
  return [...matches].sort(byOldest);
}

export function sortNewestFirst(matches: Match[]) {
  return [...matches].sort((a, b) => -byOldest(a, b));
}

export function orient(match: Match, playerId: string): OrientedMatch {
  const home = match.player1_id === playerId;
  const scored = home ? match.player1_score : match.player2_score;
  const conceded = home ? match.player2_score : match.player1_score;
  return {
    match,
    scored,
    conceded,
    margin: scored - conceded,
    result: scored > conceded ? "W" : scored < conceded ? "L" : "D",
    date: match.played_on,
  };
}

export function matchesBetween(matches: Match[], aId: string, bId: string) {
  return matches.filter(
    (m) =>
      (m.player1_id === aId && m.player2_id === bId) ||
      (m.player1_id === bId && m.player2_id === aId),
  );
}

/** Run of matching results at the end of the timeline (pass results oldest first). */
function currentRun(results: Result[], counts: Result[]) {
  let run = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (!counts.includes(results[i])) break;
    run++;
  }
  return run;
}

function longestRun(results: Result[], counts: Result[]) {
  let best = 0;
  let run = 0;
  for (const r of results) {
    run = counts.includes(r) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

export interface TimelinePoint {
  index: number;
  label: string;
  date: string;
  scored: number;
  conceded: number;
  myWins: number;
  theirWins: number;
  diff: number;
}

export interface HeadToHead {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
  goalsScored: number;
  goalsConceded: number;
  goalDiff: number;
  avgScored: number;
  avgConceded: number;
  cleanSheets: number;
  biggestWin: OrientedMatch | null;
  biggestLoss: OrientedMatch | null;
  currentStreak: { type: Result; count: number } | null;
  currentWinStreak: number;
  longestWinStreak: number;
  currentUnbeaten: number;
  longestUnbeaten: number;
  /** Newest first. */
  form: Result[];
  /** Oldest first, for charts. */
  timeline: TimelinePoint[];
  /** Newest first. */
  history: OrientedMatch[];
  lastMeeting: OrientedMatch | null;
}

/** Everything about how `meId` has done against `themId`. */
export function buildRecord(
  matches: Match[],
  meId: string,
  themId: string,
  formLength = 10,
): HeadToHead {
  const between = sortOldestFirst(matchesBetween(matches, meId, themId));
  const mine = between.map((m) => orient(m, meId));
  const results = mine.map((o) => o.result);

  const won = results.filter((r) => r === "W").length;
  const drawn = results.filter((r) => r === "D").length;
  const lost = results.filter((r) => r === "L").length;
  const played = mine.length;

  const goalsScored = mine.reduce((s, o) => s + o.scored, 0);
  const goalsConceded = mine.reduce((s, o) => s + o.conceded, 0);

  let biggestWin: OrientedMatch | null = null;
  let biggestLoss: OrientedMatch | null = null;
  for (const o of mine) {
    if (o.result === "W" && (!biggestWin || o.margin > biggestWin.margin)) biggestWin = o;
    if (o.result === "L" && (!biggestLoss || o.margin < biggestLoss.margin)) biggestLoss = o;
  }

  const timeline: TimelinePoint[] = [];
  let myWins = 0;
  let theirWins = 0;
  mine.forEach((o, i) => {
    if (o.result === "W") myWins++;
    if (o.result === "L") theirWins++;
    timeline.push({
      index: i + 1,
      label: `${i + 1}`,
      date: o.date,
      scored: o.scored,
      conceded: o.conceded,
      myWins,
      theirWins,
      diff: myWins - theirWins,
    });
  });

  const last = results[results.length - 1];
  const history = [...mine].reverse();

  return {
    played,
    won,
    drawn,
    lost,
    winRate: played ? (won / played) * 100 : 0,
    lossRate: played ? (lost / played) * 100 : 0,
    drawRate: played ? (drawn / played) * 100 : 0,
    goalsScored,
    goalsConceded,
    goalDiff: goalsScored - goalsConceded,
    avgScored: played ? goalsScored / played : 0,
    avgConceded: played ? goalsConceded / played : 0,
    cleanSheets: mine.filter((o) => o.conceded === 0).length,
    biggestWin,
    biggestLoss,
    currentStreak: played ? { type: last, count: currentRun(results, [last]) } : null,
    currentWinStreak: currentRun(results, ["W"]),
    longestWinStreak: longestRun(results, ["W"]),
    currentUnbeaten: currentRun(results, ["W", "D"]),
    longestUnbeaten: longestRun(results, ["W", "D"]),
    form: results.slice(-formLength).reverse(),
    timeline,
    history,
    lastMeeting: history[0] ?? null,
  };
}
