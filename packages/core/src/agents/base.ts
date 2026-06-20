import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { Agent, AgentInfo, AgentInput, AgentOutput } from '../types/agent.js';
import type { Finding, FindingCategory } from '../types/finding.js';
import type { SeverityLevel } from '../types/severity.js';

export interface PromptTemplate {
  system: string;
  user: (context: AgentInput) => string;
}

export interface LLMCaller {
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}

export class ProviderLLMCaller implements LLMCaller {
  constructor(private readonly provider: Provider) {}

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    return this.provider.complete(request);
  }
}

/** Abstract base class for all review agents. */
export abstract class BaseAgent implements Agent {
  protected abstract readonly agentInfo: AgentInfo;
  protected abstract readonly prompt: PromptTemplate;
  protected readonly defaultModel: string;
  protected readonly caller: LLMCaller;

  constructor(caller: LLMCaller, defaultModel = 'claude-sonnet-4-5') {
    this.caller = caller;
    this.defaultModel = defaultModel;
  }

  info(): AgentInfo {
    return this.agentInfo;
  }

  async review(input: AgentInput): Promise<AgentOutput> {
    const startedAt = Date.now();
    const response = await this.caller.complete({
      model: this.defaultModel,
      systemPrompt: this.prompt.system,
      messages: [{ role: 'user', content: this.prompt.user(input) }],
    });
    const findings = this.parseResponse(response.content);
    return {
      agentId: this.agentInfo.id,
      findings,
      durationMs: Date.now() - startedAt,
      metadata: { tokens: response.usage },
    };
  }

  /** Subclasses implement this to extract structured findings from the LLM response. */
  protected abstract parseResponse(content: string): Finding[];

  /** Helper for subclasses to build findings. */
  protected finding(
    partial: Omit<Finding, 'id' | 'agentId' | 'createdAt' | 'confidence'> & {
      confidence?: number;
    },
  ): Finding {
    return {
      id: `${this.agentInfo.id}-${Math.random().toString(36).slice(2, 10)}`,
      agentId: this.agentInfo.id,
      createdAt: new Date().toISOString(),
      confidence: partial.confidence ?? 0.8,
      ...partial,
    };
  }
}

export interface StaticFindingInput {
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  message: string;
  file?: string;
  line?: number;
  ruleId?: string;
  confidence?: number;
}
