import type { ValidationError } from './rules.js';

export class ReturnRulesViolation extends Error {
  constructor(public errors: ValidationError[]) {
    super('The return request does not satisfy the return rules.');
  }
}

/** The submission lost the write race. Nothing was stored, so retrying is safe. */
export class ReturnConflict extends Error {
  constructor() {
    super('The return could not be processed just now. Please try again.');
  }
}

export class ReturnRequestNotFound extends Error {
  constructor() {
    super('Return request not found.');
  }
}
