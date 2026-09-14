import { validationResult } from 'express-validator'

// Runs express-validator results; returns 422 if any field failed.
export function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error:  'Validation failed.',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}
