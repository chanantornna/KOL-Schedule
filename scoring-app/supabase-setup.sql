-- ============================================================
-- Supabase setup สำหรับแอพรวมคะแนน (คัดลอกทั้งหมดไปรันใน
-- Supabase Dashboard → SQL Editor → New query → Run)
-- ============================================================

-- 1) ตารางเก็บ state ของแต่ละห้อง (room = รหัสงาน/การแข่งขัน)
create table if not exists public.scoreboards (
  room text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) เปิด Row Level Security
alter table public.scoreboards enable row level security;

-- 3) Policy: อนุญาตให้ทุกคนอ่าน/เพิ่ม/แก้ได้
--    ใช้ role public เพื่อครอบทั้ง anon และ authenticated
--    เหมาะกับงานให้คะแนนที่แชร์ลิงก์กันในกลุ่มที่เชื่อใจ
drop policy if exists "public read" on public.scoreboards;
create policy "public read" on public.scoreboards
  for select to public using (true);

drop policy if exists "public insert" on public.scoreboards;
create policy "public insert" on public.scoreboards
  for insert to public with check (true);

drop policy if exists "public update" on public.scoreboards;
create policy "public update" on public.scoreboards
  for update to public using (true) with check (true);

-- 4) เปิด Realtime ให้ตารางนี้ (ให้ทุกคนเห็นการแก้ทันที)
--    ถ้าขึ้น error "already member" ข้ามได้ แปลว่าเปิดไว้แล้ว
alter publication supabase_realtime add table public.scoreboards;
