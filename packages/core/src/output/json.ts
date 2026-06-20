import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

/** JSON formatter — outputs the full result. */
export class JsonFormatter implements Formatter {
  constructor(private readonly options: { pretty?: boolean; indent?: number } = {}) {}

  format(result: ReviewResult): string {
    return JSON.stringify(result, null, this.options.indent ?? 2);
  }
}
