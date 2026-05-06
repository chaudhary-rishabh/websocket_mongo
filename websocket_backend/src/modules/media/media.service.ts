import { cloudinary } from '../../config/cloudinary.js'
import { AppError } from '../../middleware/error.js'

export interface UploadResult {
  url: string
  publicId: string
  format: string
  width?: number
  height?: number
  duration?: number
  bytes: number
}

function bufferToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder = 'chatapp/images',
): Promise<UploadResult> {
  const dataUri = bufferToDataUri(buffer, mimeType)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err || !result) return reject(new AppError('UPLOAD_FAILED', 'Image upload failed', 500))
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        })
      },
    )
  })
}

export async function uploadAudio(
  buffer: Buffer,
  mimeType: string,
  folder = 'chatapp/audio',
): Promise<UploadResult> {
  const dataUri = bufferToDataUri(buffer, mimeType)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      { folder, resource_type: 'video' },
      (err, result) => {
        if (err || !result) return reject(new AppError('UPLOAD_FAILED', 'Audio upload failed', 500))
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          duration: result.duration,
          bytes: result.bytes,
        })
      },
    )
  })
}

export async function uploadAvatar(
  buffer: Buffer,
  mimeType: string,
  userId: string,
): Promise<UploadResult> {
  const dataUri = bufferToDataUri(buffer, mimeType)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'chatapp/avatars',
        public_id: `avatar_${userId}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
      },
      (err, result) => {
        if (err || !result) return reject(new AppError('UPLOAD_FAILED', 'Avatar upload failed', 500))
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        })
      },
    )
  })
}

export async function deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
