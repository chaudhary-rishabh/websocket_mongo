import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { uploadRateLimit } from '../../middleware/rateLimit.js'
import { imageUpload, audioUpload } from './upload.middleware.js'
import { uploadImageHandler, uploadAudioHandler, uploadAvatarHandler } from './media.controller.js'

const router = Router()

router.use(authenticate(), uploadRateLimit)

router.post('/images', imageUpload.single('file'), uploadImageHandler)
router.post('/audio', audioUpload.single('file'), uploadAudioHandler)
router.post('/avatar', imageUpload.single('file'), uploadAvatarHandler)

export default router
