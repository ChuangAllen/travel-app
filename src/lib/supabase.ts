import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 尚未設定 .env 時給 null,讓登入 / 記帳等功能優雅停用,
// 內容(行程/攻略)仍可正常瀏覽。
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true, // session 存 localStorage,同裝置免重登
          autoRefreshToken: true, // 自動續期(實際上限由 Supabase Auth 的 session timebox 決定,建議設 720h)
          detectSessionInUrl: false
        }
      })
    : null;

export const hasSupabase = Boolean(supabase);
