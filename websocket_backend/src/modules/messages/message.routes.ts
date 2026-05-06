import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  SendMessageSchema,
  EditMessageSchema,
  ReactSchema,
  MessageQuerySchema,
  MessageIdParamSchema,
  ConvParamSchema,
} from './message.schemas.js'
import { list, send, edit, remove, react, read } from './message.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate())

router.get('/', validate(MessageQuerySchema, 'query'), list)
router.post('/', validate(SendMessageSchema), send)
router.post('/read', validate(ConvParamSchema, 'params'), read)

router.patch('/:messageId', validate(MessageIdParamSchema, 'params'), validate(EditMessageSchema), edit)
router.delete('/:messageId', validate(MessageIdParamSchema, 'params'), remove)
router.post('/:messageId/reactions', validate(MessageIdParamSchema, 'params'), validate(ReactSchema), react)

export default router
