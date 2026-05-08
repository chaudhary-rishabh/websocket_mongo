import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import {
  CreateConversationSchema,
  UpdateConversationSchema,
  ConversationIdParamSchema,
  AddMembersSchema,
  RemoveMemberParamSchema,
} from './conversation.schemas.js'
import { list, create, getOne, update, addMembersHandler, removeMemberHandler, leave } from './conversation.controller.js'

const router = Router()

router.use(authenticate())

router.get('/', list)
router.post('/', validate(CreateConversationSchema), create)
router.get('/:conversationId', validate(ConversationIdParamSchema, 'params'), getOne)
router.patch('/:conversationId', validate(ConversationIdParamSchema, 'params'), validate(UpdateConversationSchema), update)
router.post('/:conversationId/members', validate(ConversationIdParamSchema, 'params'), validate(AddMembersSchema), addMembersHandler)
router.delete('/:conversationId/members/:memberId', validate(RemoveMemberParamSchema, 'params'), removeMemberHandler)
router.delete('/:conversationId/leave', validate(ConversationIdParamSchema, 'params'), leave)

export default router
