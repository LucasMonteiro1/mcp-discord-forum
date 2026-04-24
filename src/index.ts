// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function headers() {
  if (!BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is required');
  }
  return {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function discordRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: { ...headers(), ...((options.headers as Record<string, string>) ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Discord API error ${res.status}: ${(body as any)?.message ?? res.statusText}`);
  }

  return body as any;
}

const server = new McpServer({
  name: 'discord-forum',
  version: '1.0.0',
});

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

// ─── Tools ───────────────────────────────────────────────────────────────────

server.tool(
  'create_forum_post',
  'Create a new post (thread) in a Discord forum channel',
  {
    channel_id: z.string().describe('ID of the forum channel'),
    title: z.string().describe('Title of the forum post'),
    content: z.string().describe('Content/body of the first message in the post'),
    tags: z.array(z.string()).optional().describe('List of tag IDs to apply to the post'),
  },
  async ({ channel_id, title, content, tags }) => {
    const body: Record<string, unknown> = { name: title, message: { content } };
    if (tags && tags.length > 0) body.applied_tags = tags;

    const result = await discordRequest(`/channels/${channel_id}/threads`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return ok({
      id: result.id,
      name: result.name,
      url: `https://discord.com/channels/${result.guild_id}/${result.id}`,
    });
  },
);

server.tool(
  'reply_to_forum_post',
  'Send a message (reply) to an existing forum post thread',
  {
    thread_id: z.string().describe('ID of the forum post thread to reply to'),
    content: z.string().describe('Message content'),
  },
  async ({ thread_id, content }) => {
    const result = await discordRequest(`/channels/${thread_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    return ok({ id: result.id, content: result.content });
  },
);

server.tool(
  'list_forum_posts',
  'List active threads (posts) in a Discord forum channel',
  {
    channel_id: z.string().describe('ID of the forum channel'),
  },
  async ({ channel_id }) => {
    const channel = await discordRequest(`/channels/${channel_id}`);
    const { guild_id } = channel;

    const result = await discordRequest(`/guilds/${guild_id}/threads/active`);
    const threads = (result.threads as any[])
      .filter((t: any) => t.parent_id === channel_id)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        message_count: t.message_count,
        url: `https://discord.com/channels/${guild_id}/${t.id}`,
      }));

    return ok(threads);
  },
);

server.tool(
  'get_forum_post_messages',
  'Get messages from a forum post thread',
  {
    thread_id: z.string().describe('ID of the forum post thread'),
    limit: z.number().optional().default(50).describe('Number of messages to fetch (max 100)'),
  },
  async ({ thread_id, limit }) => {
    const messages = await discordRequest(
      `/channels/${thread_id}/messages?limit=${Math.min(limit, 100)}`,
    );

    return ok(
      (messages as any[]).map((m: any) => ({
        id: m.id,
        author: m.author?.username,
        content: m.content,
        timestamp: m.timestamp,
      })),
    );
  },
);

server.tool(
  'list_forum_tags',
  'List available tags in a Discord forum channel',
  {
    channel_id: z.string().describe('ID of the forum channel'),
  },
  async ({ channel_id }) => {
    const channel = await discordRequest(`/channels/${channel_id}`);
    const tags = ((channel.available_tags ?? []) as any[]).map((t: any) => ({
      id: t.id,
      name: t.name,
      emoji: t.emoji_name ?? null,
    }));

    return ok(tags);
  },
);

server.tool(
  'edit_forum_post',
  'Edit the title of an existing forum post (thread)',
  {
    thread_id: z.string().describe('ID of the forum post thread to edit'),
    title: z.string().describe('New title for the forum post'),
  },
  async ({ thread_id, title }) => {
    const result = await discordRequest(`/channels/${thread_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: title }),
    });

    return ok({
      id: result.id,
      name: result.name,
      url: `https://discord.com/channels/${result.guild_id}/${result.id}`,
    });
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Discord Forum MCP server running');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
