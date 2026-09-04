import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 尚未設定 .env 時給 null,讓「記帳/分帳/平安回報」等功能優雅停用,
// 內容(行程/攻略)仍可正常瀏覽。
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = Boolean(supabase);
