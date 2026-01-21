/**
 * ChittyOS Agent Types
 *
 * Shared type definitions for all ChittyOS AI agents.
 */

// ============ Tool Types ============

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: { type: string };
  default?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, ToolParameter>;
  requiresConfirmation?: boolean;
  execute?: (args: Record<string, any>, context: AgentContext) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  jobId?: string;
  note?: string;
}

// ============ Agent Types ============

export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  model: string;
  systemPrompt: string;
  toolCategories: ToolCategory[];
  settings?: AgentSettings;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: ToolDefinition[];
}

export interface AgentSettings {
  maxTurns?: number;
  temperature?: number;
  confirmDestructive?: boolean;
  dryRunDefault?: boolean;
}

export interface AgentContext {
  env: Record<string, any>;
  kv?: any; // KVNamespace from Cloudflare
  ai?: any; // Ai binding from Cloudflare Workers AI
  sessionId?: string;
  userId?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  toolsUsed?: string[];
  pendingConfirmation?: PendingConfirmation;
}

export interface PendingConfirmation {
  toolName: string;
  toolArgs: Record<string, any>;
  message: string;
}

// ============ Agent Manifest ============

export interface AgentManifest {
  name: string;
  version: string;
  description: string;
  tier: number;
  category: 'foundation' | 'core' | 'platform' | 'domain' | 'application';
  domain?: string;
  status: 'active' | 'beta' | 'deprecated';
  toolCategories: {
    name: string;
    description: string;
    toolCount: number;
  }[];
  model: {
    provider: 'workers-ai' | 'chittyserv' | 'openai' | 'anthropic';
    name: string;
    fallback?: string;
  };
  endpoints: {
    chat: string;
    health: string;
    tools?: string;
  };
  maintainer: string;
  repository: string;
}

// ============ KV/State Types ============

export interface AgentState {
  sessionId: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface JobQueue {
  jobId: string;
  type: string;
  args: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}
