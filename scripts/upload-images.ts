/**
 * 把 public/images/<slug>/<檔名> 全部上傳到 Supabase Storage 私有 bucket「trip-images」
 * (物件路徑 <slug>/<檔名>),上傳後本機/git 就不再需要這些檔案。
 *
 * 用法:
 *   .env 需有 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY,
 *   另外用環境變數帶管理者帳密(不存進 .env,避免密碼留在檔案裡):
 *     UPLOAD_ADMIN_CODE=allen UPLOAD_ADMIN_PASSWORD=1234 \
 *       node --env-file=.env --import tsx scripts/upload-images.ts
 *
 * 對應 RLS policy(見 doc/Database.md):bucket_id='trip-images' 的寫入僅限 profiles.is_admin。
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const code = process.env.UPLOAD_ADMIN_CODE;
const password = process.env.UPLOAD_ADMIN_PASSWORD;

if (!url || !anonKey) {
  console.error("缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}
if (!code || !password) {
  console.error("缺少 UPLOAD_ADMIN_CODE / UPLOAD_ADMIN_PASSWORD(管理者代號與密碼)");
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const BUCKET = "trip-images";
const IMAGES_DIR = join(process.cwd(), "public", "images");

const CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

function contentTypeOf(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return CONTENT_TYPE[ext] ?? "application/octet-stream";
}

async function main() {
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: `${code}@traveldemo.app`,
    password: password!
  });
  if (authErr) {
    console.error("登入失敗:", authErr.message);
    process.exit(1);
  }

  const slugs = await readdir(IMAGES_DIR, { withFileTypes: true });
  let ok = 0;
  let fail = 0;
  for (const s of slugs) {
    if (!s.isDirectory()) continue;
    const slug = s.name;
    const files = await readdir(join(IMAGES_DIR, slug));
    for (const file of files) {
      const path = `${slug}/${file}`;
      const buf = await readFile(join(IMAGES_DIR, slug, file));
      const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
        contentType: contentTypeOf(file),
        upsert: true
      });
      if (error) {
        console.error("失敗", path, error.message);
        fail++;
      } else {
        console.log("上傳", path);
        ok++;
      }
    }
  }

  await supabase.auth.signOut();
  console.log(`完成:成功 ${ok} 筆,失敗 ${fail} 筆。`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
