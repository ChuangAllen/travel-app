// 登入用「使用者代號」而非 Email:代號會被補上這個網域組成 Supabase 需要的 email。
// 例:代號 demo → demo@traveldemo.app(此網域不對外寄信,只是識別用)。
export const USER_EMAIL_DOMAIN = "traveldemo.app";

/** 使用者輸入的代號 / Email → Supabase 登入用 email */
export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${USER_EMAIL_DOMAIN}`;
}

/** email → 顯示用代號 */
export function emailToCode(email?: string | null): string {
  if (!email) return "";
  const [code, domain] = email.split("@");
  return domain === USER_EMAIL_DOMAIN ? code : email;
}
