import { supabase } from "./supabase";

export interface TripAccess {
  /** true = 可看所有行程(profiles.is_admin) */
  all: boolean;
  /** 非 admin 時,被指派的行程 slug */
  slugs: string[];
}

/**
 * 目前登入者能看的行程。
 * - 未登入 / 沒設 Supabase → null(呼叫端自行決定)
 * - 查詢失敗 → 視為「沒有任何權限」({ all:false, slugs:[] }),不外洩
 */
export async function fetchMyAccess(): Promise<TripAccess | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const [{ data: profile }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", auth.user.id).maybeSingle(),
    supabase.from("trip_members").select("trip_slug")
  ]);

  return {
    all: Boolean(profile?.is_admin),
    slugs: (members ?? []).map((r) => r.trip_slug as string)
  };
}
