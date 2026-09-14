export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  played_on: string; // YYYY-MM-DD
  created_by: string;
  created_at: string;
}

export type Result = "W" | "D" | "L";

/** A match seen from one player's side. */
export interface OrientedMatch {
  match: Match;
  scored: number;
  conceded: number;
  margin: number;
  result: Result;
  date: string;
}
