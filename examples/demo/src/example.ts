/**
 * A small example module with intentional issues for Crucible to find.
 *
 * Used to demonstrate the review pipeline. Run:
 *
 *   cd examples/demo
 *   git init
 *   git add .
 *   git commit -m initial
 *   # Edit src/example.ts
 *   cd ../..
 *   pnpm --filter @crucible/cli build
 *   cd examples/demo
 *   ANTHROPIC_API_KEY=sk-... node ../../packages/cli/dist/index.js review
 */
import { writeFile } from 'node:fs/promises';

// INTENTIONAL: Hardcoded secret for the secrets agent to find.
const API_KEY = 'sk-1234567890abcdefghijklmnop';

// INTENTIONAL: SQL injection for the security agent.
export async function getUser(name: string): Promise<unknown> {
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  // ... in real code, this would call the DB
  return { query };
}

// INTENTIONAL: Inefficient loop for the performance agent.
export function findDuplicates(items: string[]): string[] {
  const seen: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i !== j && items[i] === items[j] && !seen.includes(items[i]!)) {
        seen.push(items[i]!);
      }
    }
  }
  return seen;
}

// INTENTIONAL: Bad naming for the naming agent.
export function doIt(x: number, y: number): number {
  return x + y;
}

// INTENTIONAL: No error handling for the error-handling agent.
export async function saveData(data: string): Promise<void> {
  await writeFile('/tmp/example.txt', data);
}

// INTENTIONAL: Magic numbers for the style agent.
export function calculate(a: number, b: number): number {
  return a * 0.082 + b * 1.5 - 42;
}
