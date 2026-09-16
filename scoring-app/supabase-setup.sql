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

-- 3) Policy: อนุญาตให้ทุกคน (anon) อ่านและเขียนได้
--    เหมาะกับงานให้คะแนนที่แชร์ลิงก์กันในกลุ่มที่เชื่อใจ
--    ใครมีลิงก์ + รหัสห้อง ก็แก้คะแนนได้
drop policy if exists "public read" on public.scoreboards;
create policy "public read"
  on public.scoreboards for select
  to anon
  using (true);

drop policy if exists "public insert" on public.scoreboards;
create policy "public insert"
  on public.scoreboards for insert
  to anon
  with check (true);

drop policy if exists "public update" on public.scoreboards;
create policy "public update"
  on public.scoreboards for update
  to anon
  using (true)
  with check (true);

-- 4) เปิด Realtime ให้ตารางนี้ (ให้ทุกคนเห็นการแก้ทันที)
alter publication supabase_realtime add table public.scoreboards;
