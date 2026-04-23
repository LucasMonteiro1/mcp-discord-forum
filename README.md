# mcp-discord-forum

MCP server for posting and managing topics in Discord forum channels.

## Usage

Add to your MCP client config (e.g. `~/.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "discord-forum": {
      "command": "npx",
      "args": ["-y", "mcp-discord-forum"],
      "env": {
        "DISCORD_BOT_TOKEN": "your-bot-token-here"
      },
      "disabled": false,
      "autoApprove": [
        "create_forum_post",
        "reply_to_forum_post",
        "list_forum_posts",
        "get_forum_post_messages",
        "list_forum_tags"
      ]
    }
  }
}
```

## Tools

| Tool | Description |
|---|---|
| `create_forum_post` | Create a new post (thread) in a forum channel |
| `reply_to_forum_post` | Reply to an existing forum post |
| `list_forum_posts` | List active posts in a forum channel |
| `get_forum_post_messages` | Get messages from a forum post |
| `list_forum_tags` | List available tags in a forum channel |

## Setup — Creating the Discord Bot

**Create the application:**
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, give it a name and confirm
3. In the sidebar, click **Bot**
4. Click **Reset Token** → copy the generated token (use it as `DISCORD_BOT_TOKEN`)  

**Enable intents:**  
5. On the same **Bot** page, scroll to **Privileged Gateway Intents**  
6. Enable **Message Content Intent**  
7. Save changes

**Invite the bot to your server:**  
8. In the sidebar, click **OAuth2 → URL Generator**  
9. Under **Scopes**, check: `bot`  
10. Under **Bot Permissions**, check:  
    - `View Channels`  
    - `Send Messages`  
    - `Send Messages in Threads`  
    - `Create Public Threads`  
    - `Read Message History`  
11. Copy the generated URL at the bottom, open it in the browser and select your server  

**Grant access to the forum channel:**  
12. In Discord, right-click the forum channel → **Edit Channel → Permissions**  
13. Add the bot and make sure the permissions above are allowed  

## Finding Channel IDs

Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then right-click any channel and select **Copy Channel ID**.
