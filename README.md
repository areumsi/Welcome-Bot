<div align="center">

<img src="welcome bot.png" width="600" alt="Welcome Bot preview" />

<h1>Welcome Bot</h1>

<p>A Discord bot that sends fully customizable embed and image-based welcome messages when new members join your server.</p>

[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

</div>

---

## Features

- **Embed welcome** — Send a rich embed with a customizable title, description, image, and thumbnail when a member joins.
- **Image welcome card** — Generate a canvas-based welcome image with the member's avatar, username, join rank, and account creation date.
- **Template tags** — Use `?user`, `?tag`, `?mention`, `?server`, and `?rank` in your descriptions for dynamic content.
- **Per-server configuration** — All settings are stored per guild using a persistent SQLite database.
- **Admin-only setup** — Configuration commands require the `Administrator` permission.
- **Command cooldown** — Built-in 10-second cooldown per user to prevent spam.

---

## Tech Stack

| Package | Purpose |
|---|---|
| [discord.js v14](https://discord.js.org) | Discord API client |
| [quick.db v9](https://quickdb.js.org) | Persistent guild settings (SQLite) |
| [canvas](https://github.com/Automattic/node-canvas) | Image generation |
| [canvas-constructor](https://github.com/kyranet/canvas-constructor) | Fluent canvas API |
| [moment](https://momentjs.com) | Date formatting |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable loading |

---

## Screenshots

### Embed Welcome

![Embed Welcome](https://user-images.githubusercontent.com/74746579/131488177-cacfe559-02fe-4e6e-a8fc-4ce73c4fd81a.png)

### Image Welcome Card

![Image Welcome](https://media.discordapp.net/attachments/855820422960513054/882210623566540890/unknown.png)

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A Discord application & bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/diwasatreya/Welcome-Bot.git
cd Welcome-Bot

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your bot token

# 4. Start the bot
npm start
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `TOKEN` | Your Discord bot token | ✅ Yes |

Create a `.env` file in the root directory (copy from `.env.example`):

```env
TOKEN=your_bot_token_here
```

> **Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Configuration

Edit `config.json` to set your bot's command prefix and your Discord user ID:

```json
{
  "prefix": "!",
  "developerID": "your_discord_user_id"
}
```

---

## Running Locally

```bash
npm start
```

For development with auto-restart on file changes (Node.js ≥ 18):

```bash
npm run dev
```

The bot also starts an HTTP keep-alive server on port **3000**, which is useful when hosting on platforms like Replit.

---

## Bot Setup (Discord)

When inviting the bot to your server, ensure it has these permissions:
- Read Messages / View Channels
- Send Messages
- Embed Links
- Attach Files
- Manage Messages *(for auto-deleting help messages)*

Enable these **Privileged Gateway Intents** in the Developer Portal:
- ✅ **Server Members Intent** — required for `guildMemberAdd` events
- ✅ **Message Content Intent** — required for reading command messages

---

## Commands

All commands require the `Administrator` permission unless noted.

| Command | Alias | Description | Required |
|---|---|---|---|
| `setwelcomechannel <#channel>` | `sw` | Set the embed welcome channel | ✅ |
| `setdescription <text>` | `sd` | Set the welcome embed description | ✅ |
| `setthumbnail <url\|tag>` | `st` | Set the welcome thumbnail | ✅ |
| `setimage <url>` | `si` | Set the welcome embed image | Optional |
| `setimagewelcome <#channel>` | `siw` | Set the image-card welcome channel | Optional |
| `test` | — | Preview the embed welcome | — |
| `testimage` | `ti` | Preview the image welcome card | — |
| `reset` | — | Clear all welcome settings | — |
| `help [command]` | — | Show help for all or one command | — |

### Description Tags

Use these placeholders in your `setdescription` text:

| Tag | Output |
|---|---|
| `?user` | Member's username |
| `?tag` | Member's username#discriminator |
| `?mention` | @mention |
| `?server` | Server name |
| `?rank` | Member's join position (e.g. 42nd) |

### Thumbnail Tags

Use these with `setthumbnail`:

| Tag | Output |
|---|---|
| `?useravatar` | New member's avatar URL |
| `?serveravatar` | Server icon URL |

---

## Project Structure

```
Welcome-Bot/
├── commands/
│   └── welcome/          # All command modules
│       ├── help.js
│       ├── imagetest.js
│       ├── reset.js
│       ├── setdesc.js
│       ├── setimg.js
│       ├── setimgwel.js
│       ├── setnail.js
│       ├── setwelchn.js
│       └── test.js
├── fonts/                # TrueType fonts for canvas rendering
├── handlers/
│   └── command.js        # Auto-loads all commands on startup
├── JSON/
│   └── link.json         # Background image URLs for welcome cards
├── .env.example          # Environment variable template
├── .gitignore
├── config.json           # Prefix and developer ID
├── index.js              # Bot entry point
├── LICENSE
├── package.json
└── README.md
```

---

## Scripts

| Script | Description |
|---|---|
| `npm start` | Start the bot |
| `npm run dev` | Start with Node.js `--watch` (auto-restart on change) |

---

## Deployment

### Replit

1. Fork this repo and open it in [Replit](https://replit.com).
2. Add your `TOKEN` in **Secrets** (not in `.env`).
3. Click **Run**.

The built-in HTTP server on port 3000 keeps the bot alive with an uptime monitor (e.g. [UptimeRobot](https://uptimerobot.com)).

### VPS / Server

```bash
# Install pm2 for process management
npm install -g pm2

pm2 start index.js --name welcome-bot
pm2 save
pm2 startup
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b fix/your-fix`
3. Commit your changes: `git commit -m "fix: describe the fix"`
4. Push and open a Pull Request

Please keep changes minimal and focused. This is a small, intentionally simple bot.

---

## License

Distributed under the [Apache License 2.0](LICENSE).

---

## Credits

- Created by **Atreya** ([@diwasatreya](https://github.com/diwasatreya))
- Built with [discord.js](https://discord.js.org) and [canvas-constructor](https://github.com/kyranet/canvas-constructor)
