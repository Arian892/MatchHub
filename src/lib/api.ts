import { getSupabase } from "./supabase";
import type { Match, Profile } from "./types";

const TOKEN_KEY = "matchhub:token";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Database errors arrive as plain sentences, so they can be shown as they are. */
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) {
    throw new Error(
      error.message.includes("fetch")
        ? "Can't reach the server. Check your connection."
        : error.message,
    );
  }
  return data as T;
}

export interface Credentials {
  token: string;
  id: string;
  username: string;
}

export const api = {
  signUp: (username: string, password: string) =>
    rpc<Credentials>("app_signup", { p_username: username, p_password: password }),

  logIn: (username: string, password: string) =>
    rpc<Credentials>("app_login", { p_username: username, p_password: password }),

  me: (token: string) => rpc<Profile | null>("app_me", { p_token: token }),

  logOut: (token: string) => rpc<null>("app_logout", { p_token: token }),

  setUsername: (token: string, username: string) =>
    rpc<{ id: string; username: string }>("app_set_username", {
      p_token: token,
      p_username: username,
    }),

  setPassword: (token: string, current: string, next: string) =>
    rpc<null>("app_set_password", {
      p_token: token,
      p_current: current,
      p_new: next,
    }),

  players: (token: string) => rpc<Profile[]>("app_players", { p_token: token }),

  addPlayer: (token: string, username: string) =>
    rpc<Profile>("app_add_player", { p_token: token, p_username: username }),

  removePlayer: (token: string, id: string) =>
    rpc<null>("app_remove_player", { p_token: token, p_id: id }),

  matches: (token: string) => rpc<Match[]>("app_matches", { p_token: token }),

  addMatch: (
    token: string,
    opponentId: string,
    myScore: number,
    theirScore: number,
    playedOn: string,
  ) =>
    rpc<Match>("app_add_match", {
      p_token: token,
      p_opponent: opponentId,
      p_my_score: myScore,
      p_their_score: theirScore,
      p_played_on: playedOn,
    }),

  updateMatch: (
    token: string,
    matchId: string,
    myScore: number,
    theirScore: number,
    playedOn: string,
  ) =>
    rpc<Match>("app_update_match", {
      p_token: token,
      p_match: matchId,
      p_my_score: myScore,
      p_their_score: theirScore,
      p_played_on: playedOn,
    }),

  deleteMatch: (token: string, matchId: string) =>
    rpc<null>("app_delete_match", { p_token: token, p_match: matchId }),
};

export function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
