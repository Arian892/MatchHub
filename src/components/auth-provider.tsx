"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, messageFrom, readToken, writeToken } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthState {
  token: string | null;
  profile: Profile | null;
  loading: boolean;
  /** Each returns an error message to show, or null when it worked. */
  signIn: (username: string, password: string) => Promise<string | null>;
  signUp: (username: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  changeUsername: (username: string) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export const USERNAME_RULE = /^[A-Za-z0-9_]{3,20}$/;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Pick up the session saved on this device, if it is still good.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const saved = readToken();
    if (!saved) {
      setLoading(false);
      return;
    }
    api
      .me(saved)
      .then((me) => {
        if (me) {
          setToken(saved);
          setProfile(me);
        } else {
          writeToken(null);
        }
      })
      .catch(() => writeToken(null))
      .finally(() => setLoading(false));
  }, []);

  const start = useCallback((credentials: { token: string; id: string; username: string }) => {
    writeToken(credentials.token);
    setToken(credentials.token);
    setProfile({
      id: credentials.id,
      username: credentials.username,
      created_at: new Date().toISOString(),
    });
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      if (!username.trim() || !password) return "Enter your username and password.";
      try {
        start(await api.logIn(username, password));
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [start],
  );

  const signUp = useCallback(
    async (username: string, password: string) => {
      if (!USERNAME_RULE.test(username.trim())) {
        return "Usernames are 3–20 characters: letters, numbers and underscores.";
      }
      if (password.length < 6) return "Use a password of at least 6 characters.";
      try {
        start(await api.signUp(username, password));
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [start],
  );

  const signOut = useCallback(async () => {
    const current = token;
    writeToken(null);
    setToken(null);
    setProfile(null);
    if (current) {
      try {
        await api.logOut(current);
      } catch {
        // The device is signed out either way.
      }
    }
  }, [token]);

  const changeUsername = useCallback(
    async (username: string) => {
      if (!token) return "You are signed out.";
      try {
        const next = await api.setUsername(token, username);
        setProfile((prev) => (prev ? { ...prev, username: next.username } : prev));
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!token) return "You are signed out.";
      try {
        await api.setPassword(token, current, next);
        return null;
      } catch (error) {
        return messageFrom(error);
      }
    },
    [token],
  );

  const value = useMemo<AuthState>(
    () => ({
      token,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      changeUsername,
      changePassword,
    }),
    [token, profile, loading, signIn, signUp, signOut, changeUsername, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
