import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { UpdateProfileSchema, SearchUsersQuerySchema, UserIdParamSchema } from './user.schemas.js'
import { getMe, getUser, patchMe, searchUsersHandler } from './user.controller.js'

const router = Router()

router.use(authenticate())

router.get('/me', getMe)
router.patch('/me', validate(UpdateProfileSchema), patchMe)
router.get('/search', validate(SearchUsersQuerySchema, 'query'), searchUsersHandler)
router.get('/:userId', validate(UserIdParamSchema, 'params'), getUser)

export default router
