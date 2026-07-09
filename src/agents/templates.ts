/**
 * ChittyOS Agent Templates
 *
 * Pre-built templates for common agent patterns.
 */

import type { AgentConfig, AgentManifest, AgentSettings } from './types';

// ============ System Prompt Templates ============

export const systemPromptTemplates = {
  /**
   * Base prompt for all ChittyOS agents
   */
  base: (agentName: string, description: string) => `You are ${agentName}, a ChittyOS AI agent.

${description}

Guidelines:
- Be helpful and concise
- Use tools to gather information before responding
- Explain your reasoning clearly
- Prioritize safety and user data protection`,

  /**
   * Cleanup/maintenance agent prompt
   */
  cleanup: (agentName: string) => `You are ${agentName}, an AI-powered cleanup and organization agent. Your personality is inspired by Marie Kondo - you help users decide what "sparks joy" and what should be cleaned up.

Guidelines:
- Be helpful and encouraging, not judgmental
- Use the "spark joy" philosophy: if something isn't needed, let it go
- Prioritize safety: never suggest deleting system files or active projects
- Be specific: mention exact paths, sizes, and ages when relevant
- For cleanup actions, always default to dryRun=true (show what would be cleaned)

The Worker queues jobs - the local agent executes them.
When users ask questions, use your tools to gather information before responding.`,

  /**
   * Operations agent prompt
   */
  operations: (agentName: string, platform: string) => `You are ${agentName}, an AI agent for ${platform} operations.

Guidelines:
- Provide accurate information about ${platform} resources
- Suggest optimizations when appropriate
- Warn about potentially dangerous operations
- Always confirm destructive actions before executing`,

  /**
   * Data/analytics agent prompt
   */
  analytics: (agentName: string) => `You are ${agentName}, an AI agent for data analysis and insights.

Guidelines:
- Provide accurate analysis of data
- Explain patterns and trends clearly
- Use visualizations when helpful
- Be honest about data limitations`,
};

// ============ Agent Config Templates ============

export const agentConfigTemplates = {
  /**
   * Create a cleanup agent config
   */
  cleanup: (
    name: string,
    toolCategories: AgentConfig['toolCategories'],
    settings?: Partial<AgentSettings>
  ): AgentConfig => ({
    name,
    version: '1.0.0',
    description: 'AI-powered cleanup and organization agent',
    model: '@cf/meta/llama-3.1-8b-instruct',
    systemPrompt: systemPromptTemplates.cleanup(name),
    toolCategories,
    settings: {
      maxTurns: 5,
      confirmDestructive: true,
      dryRunDefault: true,
      ...settings,
    },
  }),

  /**
   * Create an operations agent config
   */
  operations: (
    name: string,
    platform: string,
    toolCategories: AgentConfig['toolCategories'],
    settings?: Partial<AgentSettings>
  ): AgentConfig => ({
    name,
    version: '1.0.0',
    description: `AI agent for ${platform} operations`,
    model: '@cf/meta/llama-3.1-8b-instruct',
    systemPrompt: systemPromptTemplates.operations(name, platform),
    toolCategories,
    settings: {
      maxTurns: 5,
      confirmDestructive: true,
      ...settings,
    },
  }),
};

// ============ Manifest Templates ============

export function createAgentManifest(
  config: AgentConfig,
  options: {
    tier: number;
    category: AgentManifest['category'];
    domain?: string;
    maintainer: string;
    repository: string;
  }
): AgentManifest {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    tier: options.tier,
    category: options.category,
    domain: options.domain,
    status: 'active',
    toolCategories: config.toolCategories.map(cat => ({
      name: cat.name,
      description: cat.description,
      toolCount: cat.tools.length,
    })),
    model: {
      provider: 'workers-ai',
      name: config.model,
    },
    endpoints: {
      chat: '/chat',
      health: '/health',
      tools: '/tools',
    },
    maintainer: options.maintainer,
    repository: options.repository,
  };
}

// ============ Wrangler.toml Template ============

export function generateWranglerToml(
  name: string,
  accountId: string,
  options?: {
    kvNamespaces?: { binding: string; id: string }[];
    durableObjects?: { binding: string; className: string }[];
    aiBinding?: boolean;
    vars?: Record<string, string>;
  }
): string {
  const lines = [
    `name = "${name}"`,
    `main = "src/index.ts"`,
    `compatibility_date = "2024-12-01"`,
    `compatibility_flags = ["nodejs_compat"]`,
    `account_id = "${accountId}"`,
    '',
  ];

  if (options?.kvNamespaces?.length) {
    lines.push('# KV namespace for state');
    lines.push('kv_namespaces = [');
    for (const kv of options.kvNamespaces) {
      lines.push(`  { binding = "${kv.binding}", id = "${kv.id}" }`);
    }
    lines.push(']');
    lines.push('');
  }

  if (options?.aiBinding !== false) {
    lines.push('# AI binding for Workers AI');
    lines.push('[ai]');
    lines.push('binding = "AI"');
    lines.push('');
  }

  if (options?.durableObjects?.length) {
    lines.push('# Durable Objects for agent state');
    for (const dO of options.durableObjects) {
      lines.push('[[durable_objects.bindings]]');
      lines.push(`name = "${dO.binding}"`);
      lines.push(`class_name = "${dO.className}"`);
    }
    lines.push('');
    lines.push('[[migrations]]');
    lines.push('tag = "v1"');
    lines.push(`new_classes = [${options.durableObjects.map(d => `"${d.className}"`).join(', ')}]`);
    lines.push('');
  }

  if (options?.vars && Object.keys(options.vars).length) {
    lines.push('[vars]');
    for (const [key, value] of Object.entries(options.vars)) {
      lines.push(`${key} = "${value}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============ Package.json Template ============

export function generatePackageJson(
  name: string,
  version = '1.0.0',
  description?: string
): Record<string, any> {
  return {
    name,
    version,
    description: description || `ChittyOS AI Agent: ${name}`,
    type: 'module',
    scripts: {
      dev: 'wrangler dev',
      deploy: 'wrangler deploy',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@chittyos/core': '^2.1.0',
    },
    devDependencies: {
      '@cloudflare/workers-types': '^4.20250109.0',
      typescript: '^5.7.3',
      wrangler: '^3.99.0',
    },
  };
}
