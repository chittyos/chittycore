/**
 * ChittyOS Tool Builder
 *
 * Utilities for defining agent tools with type safety.
 *
 * Usage:
 *   const myTool = createTool({
 *     name: 'my_tool',
 *     description: 'Does something useful',
 *     category: 'utility',
 *     parameters: {
 *       input: { type: 'string', description: 'The input', required: true }
 *     },
 *     execute: async (args, context) => {
 *       return { result: args.input.toUpperCase() };
 *     }
 *   });
 */

import type { ToolDefinition, ToolParameter, AgentContext, ToolCategory } from './types';

/**
 * Create a tool definition with type checking
 */
export function createTool(definition: ToolDefinition): ToolDefinition {
  return {
    ...definition,
    requiresConfirmation: definition.requiresConfirmation ?? false,
  };
}

/**
 * Create a tool that requires human confirmation (no auto-execute)
 */
export function createConfirmableTool(
  definition: Omit<ToolDefinition, 'execute' | 'requiresConfirmation'>
): ToolDefinition {
  return {
    ...definition,
    requiresConfirmation: true,
  };
}

/**
 * Create a tool category with multiple tools
 */
export function createToolCategory(
  name: string,
  description: string,
  tools: ToolDefinition[]
): ToolCategory {
  return { name, description, tools };
}

/**
 * Common parameter builders
 */
export const params = {
  string: (description: string, required = false): ToolParameter => ({
    type: 'string',
    description,
    required,
  }),

  number: (description: string, required = false): ToolParameter => ({
    type: 'number',
    description,
    required,
  }),

  boolean: (description: string, required = false): ToolParameter => ({
    type: 'boolean',
    description,
    required,
  }),

  stringEnum: (description: string, options: string[], required = false): ToolParameter => ({
    type: 'string',
    description,
    enum: options,
    required,
  }),

  array: (description: string, itemType: string, required = false): ToolParameter => ({
    type: 'array',
    description,
    items: { type: itemType },
    required,
  }),

  path: (description = 'File or directory path'): ToolParameter => ({
    type: 'string',
    description,
    required: true,
  }),

  dryRun: (): ToolParameter => ({
    type: 'boolean',
    description: 'If true, only report what would be done without making changes (default: true)',
    default: true,
  }),
};

/**
 * Job queue helper for tools that queue work for external execution
 */
export function createJobResult(
  jobId: string,
  type: string,
  args: Record<string, any>,
  note = 'Job queued for local agent execution.'
) {
  return {
    success: true,
    jobId,
    type,
    args,
    status: 'queued',
    createdAt: new Date().toISOString(),
    note,
  };
}

/**
 * Store job in KV
 */
export async function queueJob(
  kv: any, // KVNamespace
  type: string,
  args: Record<string, any>,
  ttlSeconds = 86400
): Promise<string> {
  const jobId = crypto.randomUUID();
  await kv.put(
    `job:${jobId}`,
    JSON.stringify({
      type,
      args,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }),
    { expirationTtl: ttlSeconds }
  );
  return jobId;
}
