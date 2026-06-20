import type { ReviewResult } from '../types/review-result.js';
import { HtmlFormatter } from './html.js';
import { JsonFormatter } from './json.js';
import { JUnitFormatter } from './junit.js';
import { MarkdownFormatter } from './markdown.js';
import { SarifFormatter } from './sarif.js';
import type { Formatter } from './text.js';
import { TextFormatter } from './text.js';

export type Format = 'text' | 'json' | 'sarif' | 'markdown' | 'html' | 'junit';

export function getFormatter(
  format: Format,
  options: { color?: boolean; verbose?: boolean } = {},
): Formatter {
  switch (format) {
    case 'text':
      return new TextFormatter(options);
    case 'json':
      return new JsonFormatter();
    case 'sarif':
      return new SarifFormatter();
    case 'markdown':
      return new MarkdownFormatter();
    case 'html':
      return new HtmlFormatter();
    case 'junit':
      return new JUnitFormatter();
  }
}

export function formatResult(format: Format, result: ReviewResult): string {
  return getFormatter(format).format(result);
}
