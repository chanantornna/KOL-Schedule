# KOL Schedule

เว็บแอพจัดการตารางงานสำหรับ KOL — บันทึกงาน วันส่งดราฟ วันลงงาน ค่าตัว พร้อมมุมมองปฏิทิน, ส่งออก CSV และแนบลิงก์งานที่ลงแล้ว รองรับภาษาไทย/อังกฤษ เก็บข้อมูลในเครื่อง (localStorage)

A web app for KOLs to track jobs, draft deadlines, publish dates and fees. Features a calendar view, CSV export, post links, Thai/English UI, and local (localStorage) storage.

## รันในเครื่อง (Local development)

ต้องมี Node.js ติดตั้งก่อน (โปรเจกต์นี้ทดสอบด้วย Node 20+).

```bash
npm install
npm run dev
```

เปิด http://localhost:5173/ — และเปิดจากมือถือในวง Wi-Fi เดียวกันได้ผ่าน URL ที่ขึ้นตรงบรรทัด `Network:`.

## Build

```bash
npm run build      # ผลลัพธ์อยู่ในโฟลเดอร์ dist/
npm run preview    # ดูตัว build ในเครื่อง
```

## Deploy ขึ้น GitHub Pages (auto)

โปรเจกต์นี้ตั้ง GitHub Actions ไว้แล้ว (`.github/workflows/deploy.yml`) — ทุกครั้งที่ push ขึ้น branch `main` มันจะ build แล้ว deploy ให้เอง

ขั้นตอนครั้งแรก:

1. สร้าง repository เปล่าใหม่บน GitHub (ตั้งชื่อ เช่น `kol-schedule`) — **อย่า** ติ๊ก add README/gitignore
2. เชื่อม remote แล้ว push (แทน `<USERNAME>` และ `<REPO>` ด้วยของจริง):

   ```bash
   git remote add origin https://github.com/<USERNAME>/<REPO>.git
   git push -u origin main
   ```

3. บน GitHub ไปที่ **Settings → Pages** แล้วตั้ง **Source** เป็น **GitHub Actions**
4. รอ workflow รันเสร็จ (ดูที่แท็บ **Actions**) แล้วเปิดเว็บได้ที่:

   ```
   https://<USERNAME>.github.io/<REPO>/
   ```

> หมายเหตุ: `base` path ถูกตั้งอัตโนมัติจากชื่อ repo ตอน build บน CI จึงไม่ต้องแก้ config เอง

## หมายเหตุเรื่องข้อมูล

ข้อมูลเก็บใน localStorage ของแต่ละเบราว์เซอร์/เครื่อง จึงไม่ sync ข้ามอุปกรณ์ ถ้าเปิดบนมือถือกับคอมจะเห็นข้อมูลคนละชุด สามารถใช้ปุ่มส่งออก CSV เพื่อสำรอง/ย้ายข้อมูลได้
