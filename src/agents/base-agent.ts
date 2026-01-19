/**
 * ChittyOS Base Agent
 *
 * Templatized base class for all ChittyOS AI agents.
 * Handles tool orchestration, message flow, and state management.
 *
 * Usage:
 *   class MyAgent extends BaseAgent {
 *     constructor() {
 *       super(myAgentConfig);
 *     }
 *   }
 */

import type {
  AgentConfig,
  AgentContext,
  ChatMessage,
  ChatResponse,
  ToolDefinition,
  ToolCategory,
  PendingConfirmation,
} from './types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected tools: Map<string, ToolDefinition>;
  protected toolsByCategory: Map<string, ToolDefinition[]>;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new Map();
    this.toolsByCategory = new Map();

    // Index tools
    for (const category of config.toolCategories) {
      this.toolsByCategory.set(category.name, category.tools);
      for (const tool of category.tools) {
        this.tools.set(tool.name, tool);
      }
    }
  }

  /**
   * Get agent info for / endpoint
   */
  getInfo() {
    return {
      agent: this.config.name,
      type: 'ai-agent',
      version: this.config.version,
      description: this.config.description,
      model: this.config.model,
      toolCategories: this.config.toolCategories.map(cat => ({
        name: cat.name,
        description: cat.description,
        tools: cat.tools.map(t => ({ name: t.name, description: t.description })),
      })),
      settings: this.config.settings,
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      status: 'healthy',
      agent: this.config.name,
      type: 'ai-agent',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get tool definitions in OpenAI-compatible format
   */
  getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.entries(tool.parameters)
            .filter(([_, p]) => p.required)
            .map(([name]) => name),
        },
      },
    }));
  }

  /**
   * Build system prompt with tool descriptions
   */
  protected buildSystemPrompt(): string {
    const toolDescriptions = this.config.toolCategories
      .map(cat => {
        const toolList = cat.tools
          .map(t => `- ${t.name}: ${t.description}`)
          .join('\n');
        return `**${cat.name.toUpperCase()} Tools** - ${cat.description}:\n${toolList}`;
      })
      .join('\n\n');

    return `${this.config.systemPrompt}\n\nAvailable Tools:\n${toolDescriptions}`;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: AgentContext
  ): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return { error: `Unknown tool: ${toolName}` };
    }

    // Check if tool requires confirmation
    if (tool.requiresConfirmation && !context.env?.confirmed) {
      return {
        requiresConfirmation: true,
        tool: toolName,
        args,
        message: `This action requires confirmation. Tool: ${toolName}`,
      };
    }

    // Execute the tool
    if (tool.execute) {
      try {
        return await tool.execute(args, context);
      } catch (error) {
        return {
          error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    return { error: `Tool ${toolName} has no execute function` };
  }

  /**
   * Handle chat message - override in subclass for custom AI integration
   */
  abstract handleChat(
    message: string,
    context: AgentContext
  ): Promise<ChatResponse>;

  /**
   * Create HTTP response handler for Cloudflare Workers
   */
  createFetchHandler() {
    const agent = this;

    return async (request: Request, env: Record<string, any>): Promise<Response> => {
      const url = new URL(request.url);
      const path = url.pathname;

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      try {
        // Root - agent info
        if (path === '/' || path === '') {
          return jsonResponse(agent.getInfo(), corsHeaders);
        }

        // Health check
        if (path === '/health') {
          return jsonResponse(agent.getHealth(), corsHeaders);
        }

        // Tools list
        if (path === '/tools') {
          return jsonResponse({
            tools: agent.getToolDefinitions(),
          }, corsHeaders);
        }

        // Chat endpoint
        if (path === '/chat' && request.method === 'POST') {
          const body = await request.json() as { message: string; sessionId?: string };

          if (!body.message) {
            return jsonResponse({ error: 'message required' }, corsHeaders, 400);
          }

          const context: AgentContext = {
            env,
            kv: env.KV || env.KONDO_STATE,
            ai: env.AI,
            sessionId: body.sessionId,
          };

          const result = await agent.handleChat(body.message, context);
          return jsonResponse(result, corsHeaders);
        }

        return jsonResponse({ error: 'Not found' }, corsHeaders, 404);

      } catch (error) {
        console.error('Agent error:', error);
        return jsonResponse({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, corsHeaders, 500);
      }
    };
  }
}

// ============ Utilities ============

function jsonResponse(
  data: any,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
