/** Count tokens approximately using a 4-characters-per-token heuristic. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Estimate cost in USD given a token count and per-token rates. */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  costPerInputToken: number,
  costPerOutputToken: number,
): number {
  return inputTokens * costPerInputToken + outputTokens * costPerOutputToken;
}

/** Format a number as USD with 4 decimal places. */
export function formatCost(usd: number): string {
  if (usd < 0.0001) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

/** A running tally of token usage. */
export class TokenTally {
  private input = 0;
  private output = 0;
  private cost = 0;

  record(inputTokens: number, outputTokens: number, costPerInput = 0, costPerOutput = 0): void {
    this.input += inputTokens;
    this.output += outputTokens;
    this.cost += inputTokens * costPerInput + outputTokens * costPerOutput;
  }

  merge(other: TokenTally): void {
    this.input += other.input;
    this.output += other.output;
    this.cost += other.cost;
  }

  total(): { input: number; output: number; total: number; costUsd: number } {
    return {
      input: this.input,
      output: this.output,
      total: this.input + this.output,
      costUsd: this.cost,
    };
  }

  reset(): void {
    this.input = 0;
    this.output = 0;
    this.cost = 0;
  }
}
