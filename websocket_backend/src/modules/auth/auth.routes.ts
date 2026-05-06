import { Router } from 'express'
import { authRateLimit } from '../../middleware/rateLimit.js'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/auth.js'
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schemas.js'
import { registerHandler, loginHandler, refreshHandler, logoutHandler } from './auth.controller.js'

const router = Router()

router.post('/register', authRateLimit, validate(RegisterSchema), registerHandler)
router.post('/login', authRateLimit, validate(LoginSchema), loginHandler)
router.post('/refresh', validate(RefreshSchema), refreshHandler)
router.post('/logout', authenticate(), logoutHandler)

export default router
