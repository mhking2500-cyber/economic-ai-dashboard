type EnvKey =
  | "DATABASE_URL"
  | "STOCK_API_KEY"
  | "CRYPTO_API_KEY"
  | "FX_API_KEY"
  | "NEWS_API_KEY"
  | "AI_API_KEY";

const OPTIONAL: EnvKey[] = ["STOCK_API_KEY", "CRYPTO_API_KEY", "FX_API_KEY", "NEWS_API_KEY", "AI_API_KEY"];
const REQUIRED: EnvKey[] = ["DATABASE_URL"];

export function checkEnv() {
  if (typeof window !== "undefined") return;

  const missing: string[] = [];
  const optional: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of OPTIONAL) {
    if (!process.env[key]) optional.push(key);
  }

  if (missing.length > 0) {
    console.error(`[env] 필수 환경변수 누락: ${missing.join(", ")}`);
  }
  if (optional.length > 0) {
    console.warn(`[env] 외부 API 키 미설정 (mock 데이터로 동작): ${optional.join(", ")}`);
  }
}
