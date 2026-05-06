import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodSchema } from 'zod'
import { sendError } from '../shared/utils/apiResponse.js'

type Target = 'body' | 'query' | 'params'

export function validate(schema: ZodSchema, target: Target = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      sendError(res, 'VALIDATION_ERROR', 'Validation failed', {
        status: 422,
        details: result.error.issues,
      })
      return
    }
    req[target] = result.data as never
    next()
  }
}
