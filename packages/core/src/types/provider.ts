/** A model offered by a provider. */
export interface ModelDescriptor {
  id: string;
  provider: string;
  displayName?: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

/** Capabilities of a provider. */
export interface ProviderCapabilities {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  parallelToolCalls: boolean;
  systemPrompt: boolean;
  jsonMode: boolean;
}

/** Information about a provider. */
export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelDescriptor[];
  capabilities: ProviderCapabilities;
}

/** A token usage record. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
}

/** A message in a conversation. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}
