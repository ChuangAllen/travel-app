import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, hasSupabase } from "./supabase";
import { toLoginEmail } from "./config";

interface AuthState {
  ready: boolean; // 首次讀取 session 完成
  session: Session | null;
  user: User | null;
  authEnabled: boolean; // 有設 Supabase 金鑰
  /** 傳入「使用者代號」或 Email 皆可 */
  signIn: (codeOrEmail: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!hasSupabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      authEnabled: hasSupabase,
      async signIn(codeOrEmail, password) {
        if (!supabase) return { error: "尚未設定 Supabase" };
        const { error } = await supabase.auth.signInWithPassword({
          email: toLoginEmail(codeOrEmail),
          password
        });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        await supabase?.auth.signOut();
      }
    }),
    [ready, session]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth 必須在 <AuthProvider> 內使用");
  return v;
}
