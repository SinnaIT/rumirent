import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Saves an uploaded file to the public/uploads directory
 * @param file - The file to upload
 * @param subfolder - Optional subfolder within uploads (e.g., 'edificios')
 * @returns Promise with upload result containing the public URL
 */
export async function saveUploadedFile(
  file: File,
  subfolder: string = ''
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type (images only)
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ]

    if (!validImageTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed'
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 5MB limit'
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${randomString}.${extension}`

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', subfolder)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Generate public URL
    // In production (standalone mode), we use API route to serve files
    // In development, we can use direct /uploads path
    const publicUrl = `/api/uploads/${subfolder ? subfolder + '/' : ''}${filename}`

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('Error saving uploaded file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
