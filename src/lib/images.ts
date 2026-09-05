import { supabase } from "./supabase";

const BUCKET = "trip-images";
const SIGN_TTL = 60 * 60; // 1 小時

/**
 * 把 DayImage.src 換成可直接顯示的網址。
 * - 外部 http(s) 網址:原樣回傳,不需簽章
 * - Storage 物件路徑 <slug>/<檔名>:向 Supabase 私有 bucket「trip-images」換一次性簽章網址
 *   (RLS 依 trip_members / is_admin 過濾,沒權限會拿不到)
 * 回傳 { [原始 src]: 可顯示網址 },查不到的鍵不會出現在結果裡。
 */
export async function signedImageUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const toSign = paths.filter((p) => !/^https?:\/\//.test(p));
  for (const p of paths) {
    if (/^https?:\/\//.test(p)) out[p] = p;
  }
  if (!supabase || toSign.length === 0) return out;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(toSign, SIGN_TTL);
  if (error || !data) return out;

  data.forEach((d, i) => {
    if (d.signedUrl) out[toSign[i]] = d.signedUrl;
  });
  return out;
}
