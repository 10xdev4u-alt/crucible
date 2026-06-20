import type { Finding } from '../types/finding.js';
import type { ReviewResult } from '../types/review-result.js';
import type { Formatter } from './text.js';

const SARIF_VERSION = '2.1.0';
const SARIF_SCHEMA = `https://json.schemastore.org/sarif-${SARIF_VERSION}.json`;

const SEVERITY_TO_SARIF: Record<Finding['severity'], 'error' | 'warning' | 'note'> = {
  blocker: 'error',
  critical: 'error',
  major: 'error',
  minor: 'warning',
  info: 'note',
};

/** SARIF v2.1.0 formatter for code review integration with GitHub code scanning etc. */
export class SarifFormatter implements Formatter {
  format(result: ReviewResult): string {
    const rules = new Map<string, { id: string; name: string; shortDescription: string }>();
    const results = result.findings.map((f) => {
      const ruleId = f.ruleId ?? 'crucible';
      if (!rules.has(ruleId)) {
        rules.set(ruleId, {
          id: ruleId,
          name: f.title,
          shortDescription: f.message.slice(0, 100),
        });
      }
      const loc = f.location;
      const region: { startLine?: number; endLine?: number } = {};
      if (loc?.line) region.startLine = loc.line;
      if (loc?.endLine) region.endLine = loc.endLine;
      return {
        ruleId,
        level: SEVERITY_TO_SARIF[f.severity],
        message: { text: `${f.title}\n\n${f.message}` },
        locations: loc
          ? [
              {
                physicalLocation: {
                  artifactLocation: { uri: loc.file },
                  region,
                },
              },
            ]
          : [],
        properties: {
          agentId: f.agentId,
          category: f.category,
          confidence: f.confidence,
        },
      };
    });
    return JSON.stringify(
      {
        $schema: SARIF_SCHEMA,
        version: SARIF_VERSION,
        runs: [
          {
            tool: {
              driver: {
                name: 'crucible',
                version: '0.0.0',
                informationUri: 'https://github.com/10xdev4u-alt/crucible',
                rules: [...rules.values()],
              },
            },
            results,
          },
        ],
      },
      null,
      2,
    );
  }
}
