// ===== การตั้งค่า Supabase =====
// URL และ publishable key สามารถเปิดเผยในเว็บ client ได้ (ปลอดภัย)
// ความปลอดภัยจริงมาจาก RLS policy ในฐานข้อมูล
//
// สามารถ override ผ่าน env ตอน build ได้ (VITE_SUPABASE_URL / VITE_SUPABASE_KEY)
// ถ้าไม่ตั้ง env จะใช้ค่า default ด้านล่าง

// อ่าน env แบบปลอดภัยต่อ type (import.meta.env เป็นของ Vite ตอน build)
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {}

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || 'https://aifrmuagssakszbvcoso.supabase.co'

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_KEY || 'sb_publishable_FwpGtZDHV9kzRWCx4qOhDg_eCrD_9w8'

/** เปิด/ปิดโหมด cloud sync — ถ้าไม่มีค่า config จะกลับไปใช้ localStorage อย่างเดียว */
export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
