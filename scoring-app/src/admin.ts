import { useState } from 'react'

// ===== โหมดแอดมิน =====
// เฉพาะผู้ที่รู้รหัสนี้เท่านั้นที่แก้ชื่อ/ตั้งค่าได้
// คนอื่น (กรรมการ) แก้ได้แค่คะแนน
// หมายเหตุ: เป็นการกันระดับ frontend เหมาะกับกลุ่มผู้ใช้ทั่วไป
// (ผู้ที่เชี่ยวชาญด้านเทคนิคสามารถเปิดซอร์สดูรหัสได้ ถ้าต้องการกันจริงจังต้องใช้ระบบ login ฝั่งเซิร์ฟเวอร์)
export const ADMIN_PASSWORD = '15112542'

const ADMIN_KEY = 'scoring-app-admin'

/** hook จัดการสถานะโหมดแอดมิน (จำไว้ใน localStorage ของเครื่องนั้น) */
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_KEY) === '1'
    } catch {
      return false
    }
  })

  /** พยายามเข้าโหมดแอดมินด้วยรหัส คืน true ถ้าสำเร็จ */
  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      try {
        localStorage.setItem(ADMIN_KEY, '1')
      } catch {
        /* ignore */
      }
      setIsAdmin(true)
      return true
    }
    return false
  }

  const logout = () => {
    try {
      localStorage.removeItem(ADMIN_KEY)
    } catch {
      /* ignore */
    }
    setIsAdmin(false)
  }

  return { isAdmin, login, logout }
}
