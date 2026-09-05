import { supabase } from "./supabase";

export interface TripAccess {
  /** true = 可看所有行程(profiles.is_admin) */
  all: boolean;
  /** 非 admin 時,被指派的行程 slug */
  slugs: string[];
}

/**
 * 目前登入者能看的行程。userId 由呼叫端從 useAuth() 的 session 直接帶入,
 * 不在這裡再呼叫 supabase.auth.getUser() 額外打一次驗證(剛登入時容易跟
 * session 更新的時機賽跑,拿到暫時性的 null 導致誤判「沒有指派任何行程」)。
 * - 沒設 Supabase → null(呼叫端自行決定)
 * - 查詢失敗 → 丟出錯誤,讓 React Query 重試 / 呼叫端顯示錯誤狀態,
 *   不要靜默當成「沒有任何權限」(會被誤判成使用者真的沒被指派行程)
 */
export async function fetchMyAccess(userId: string): Promise<TripAccess | null> {
  if (!supabase) return null;

  const [profileRes, membersRes] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle(),
    supabase.from("trip_members").select("trip_slug")
  ]);
  if (profileRes.error) throw profileRes.error;
  if (membersRes.error) throw membersRes.error;

  return {
    all: Boolean(profileRes.data?.is_admin),
    slugs: (membersRes.data ?? []).map((r) => r.trip_slug as string)
  };
}
