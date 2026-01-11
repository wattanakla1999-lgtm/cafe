import { z } from "zod";

// Zod schema for strong password
export const passwordSchema = z
    .string()
    .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
    .regex(/[^A-Za-z0-9]/, "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");

// Simple input sanitizer to remove common XSS vectors from plain text
export function sanitizeInput(input: string): string {
    if (!input) return "";
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .trim();
}

// Validate file type and size
export function validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB` };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)" };
    }

    return { valid: true };
}
