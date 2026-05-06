import multer from 'multer'
import { AppError } from '../../middleware/error.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES, 'application/pdf']

const MB = 1024 * 1024

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * MB },
  fileFilter(_req, file, cb) {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('INVALID_FILE', 'Only JPEG, PNG, WebP, or GIF images allowed', 400))
    }
  },
})

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * MB },
  fileFilter(_req, file, cb) {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('INVALID_FILE', 'Unsupported audio format', 400))
    }
  },
})

export const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * MB },
  fileFilter(_req, file, cb) {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('INVALID_FILE', 'Unsupported file type', 400))
    }
  },
})
