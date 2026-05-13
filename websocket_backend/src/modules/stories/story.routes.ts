import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { uploadRateLimit } from '../../middleware/rateLimit.js'
import { imageUpload } from '../media/upload.middleware.js'
import { validate } from '../../middleware/validate.js'
import { CreateStorySchema, StoryIdParamSchema, UserIdParamSchema } from './story.schemas.js'
import {
  getActiveStoriesHandler,
  getStoryPresenceHandler,
  getUserStoriesHandler,
  getMyStoriesHandler,
  createStoryHandler,
  viewStoryHandler,
  deleteStoryHandler,
} from './story.controller.js'

const router = Router()

router.use(authenticate())

router.get('/presence', getStoryPresenceHandler)
router.get('/mine', getMyStoriesHandler)
router.get('/user/:userId', validate(UserIdParamSchema, 'params'), getUserStoriesHandler)
router.get('/', getActiveStoriesHandler)
router.post('/', uploadRateLimit, imageUpload.single('file'), validate(CreateStorySchema, 'body'), createStoryHandler)
router.post('/:storyId/view', validate(StoryIdParamSchema, 'params'), viewStoryHandler)
router.delete('/:storyId', validate(StoryIdParamSchema, 'params'), deleteStoryHandler)

export default router
