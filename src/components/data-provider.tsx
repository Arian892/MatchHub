"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, messageFrom } from "@/lib/api";
import type { Match, Profile } from "@/lib/types";
import { useAuth } from "./auth-provider";

interface DataState {
  players: Profile[];
  matches: Match[];
  loading: boolean;
  /** Each returns an error message to show, or null when it worked. */
  addPlayer: (username: string) => Promise<string | null>;
  removePlayer: (id: string) => Promise<string | null>;
  addMatch: (opponentId: string, my: number, theirs: number, date: string) => Promise<string | null>;
  updateMatch: (id: string, my: number, theirs: number, date: string) => Promise<string | null>;
  deleteMatch: (id: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setPlayers([]);
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      const [nextPlayers, nextMatches] = await Promise.all([
        api.players(token),
        api.matches(token),
      ]);
      setPlayers(nextPlayers ?? []);
      setMatches(nextMatches ?? []);
    } catch {
      // Keep whatever is on screen; the next refresh will try again.
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // A match your opponent added shows up when you come back to the app.
  useEffect(() => {
    if (!token) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [token, refresh]);

  const addPlayer = useCallback(
    async (username: string) => {
      if (!token) return "You are signed out.";
      try {
        const added = await api.addPlayer(token, username);
        setPlayers((prev) =>
          prev.some((p) => p.id === added.id)
            ? prev
            : [...prev, added].sort((a, b) => a.username.localeCompare(b.username)),
        );
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const removePlayer = useCallback(
    async (id: string) => {
      if (!token) return "You are signed out.";
      try {
        await api.removePlayer(token, id);
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const addMatch = useCallback(
    async (opponentId: string, my: number, theirs: number, date: string) => {
      if (!token) return "You are signed out.";
      try {
        const saved = await api.addMatch(token, opponentId, my, theirs, date);
        setMatches((prev) => [saved, ...prev]);
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const updateMatch = useCallback(
    async (id: string, my: number, theirs: number, date: string) => {
      if (!token) return "You are signed out.";
      try {
        const saved = await api.updateMatch(token, id, my, theirs, date);
        setMatches((prev) => prev.map((m) => (m.id === id ? saved : m)));
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const deleteMatch = useCallback(
    async (id: string) => {
      if (!token) return "You are signed out.";
      const previous = matches;
      setMatches((prev) => prev.filter((m) => m.id !== id));
      try {
        await api.deleteMatch(token, id);
        return null;
      } catch (error) {
        setMatches(previous);
        return messageFrom(error);
      }
    },
    [token, matches],
  );

  const value = useMemo<DataState>(
    () => ({
      players,
      matches,
      loading,
      addPlayer,
      removePlayer,
      addMatch,
      updateMatch,
      deleteMatch,
      refresh,
    }),
    [
      players,
      matches,
      loading,
      addPlayer,
      removePlayer,
      addMatch,
      updateMatch,
      deleteMatch,
      refresh,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
