require("dotenv").config();

const { prefix } = require("./config.json");
const { Client, GatewayIntentBits, Collection, Events, AttachmentBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const { Canvas, loadImage, loadFont: registerFont } = require("canvas-constructor/napi-rs");
const moment = require("moment");
const http = require("http");

const db = new QuickDB();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Register custom fonts
registerFont("./fonts/Vampire Wars.ttf", "Vampire Wars");
registerFont("./fonts/Quicksand-SemiBold.ttf", "Quicksand-SemiBold");

function drawAccentSymbol(card, x, y, size) {
  const half = size / 2;
  return card
    .save()
    .beginPath()
    .moveTo(x, y - half)
    .lineTo(x + half, y)
    .lineTo(x, y + half)
    .lineTo(x - half, y)
    .closePath()
    .fill()
    .restore();
}

async function loadUserAvatar(user) {
  const avatarUrl = user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
  const response = await fetch(avatarUrl);
  if (!response.ok) {
    throw new Error(`Failed to load avatar: ${response.status} ${response.statusText}`);
  }

  const avatarBuffer = Buffer.from(await response.arrayBuffer());
  return loadImage(avatarBuffer);
}

// Command and alias collections
client.commands = new Collection();
client.aliases = new Collection();

// Per-user command cooldown (in seconds)
const COOLDOWN_SECONDS = 1;
const cooldowns = new Map();

// Load all command handlers
["command"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

// Global unhandled rejection logger
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
});

// ─── Message command handler ───────────────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  // Cooldown check
  const now = Date.now();
  const cooldownExpiry = cooldowns.get(message.author.id);
  if (cooldownExpiry && now < cooldownExpiry) {
    const remaining = Math.ceil((cooldownExpiry - now) / 1000);
    return message.channel.send(
      `**${message.author.username}**, please wait \`${remaining}\` second(s) before using another command.`
    );
  }
  cooldowns.set(message.author.id, now + COOLDOWN_SECONDS * 1000);
  // Clean up after cooldown expires to prevent memory leak
  setTimeout(() => cooldowns.delete(message.author.id), COOLDOWN_SECONDS * 1000);

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  if (!cmdName) return;

  const command = client.commands.get(cmdName) ?? client.commands.get(client.aliases.get(cmdName));
  if (!command) return;

  try {
    await command.run(client, message, args, db);
  } catch (error) {
    console.error(`Error executing command "${cmdName}":`, error);
    message.channel
      .send("An error occurred while running that command.")
      .catch(() => {});
  }
});

// ─── Embed welcome on member join ─────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  const channelId = await db.get(`welcome_${member.guild.id}`);
  if (!channelId) return;

  const [text, img, nail] = await Promise.all([
    db.get(`desc_${member.guild.id}`),
    db.get(`image_${member.guild.id}`),
    db.get(`thumbnail_${member.guild.id}`),
  ]);

  // Guard: all required fields must be set before sending
  if (!text || !nail) return;

  const memberCount = member.guild.memberCount;

  const description = text
    .replace(/`?\?user`?/g, member.user.username)
    .replace(/`?\?server`?/g, member.guild.name)
    .replace(/`?\?tag`?/g, member.user.tag)
    .replace(/`?\?mention`?/g, `<@${member.user.id}>`)
    .replace(/`?\?rank`?/g, memberCount);

  const thumbnail = nail
    .replace(/`?\?useravatar`?/g, member.user.displayAvatarURL({ forceStatic: false }))
    .replace(/`?\?serveravatar`?/g, member.guild.iconURL({ forceStatic: false }));

  const { EmbedBuilder } = require("discord.js");
  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${member.guild.name}`)
    .setDescription(description)
    .setThumbnail(thumbnail)
    .setColor("Random");

  if (img) embed.setImage(img);

  const welcomeChannel = client.channels.cache.get(channelId);
  if (welcomeChannel) {
    welcomeChannel.send({ embeds: [embed] }).catch(console.error);
  }
});

// ─── Image welcome on member join ─────────────────────────────────────────
const backgroundLinks = require("./JSON/link.json");

client.on(Events.GuildMemberAdd, async (member) => {
  const channelId = await db.get(`welcomeimg_${member.guild.id}`);
  if (!channelId) return;

  try {
    const link = backgroundLinks.link[Math.floor(Math.random() * backgroundLinks.link.length)];
    const bg = await loadImage(link);
    const userPfp = await loadUserAvatar(member.user);

    const memberCount = member.guild.memberCount;

    // ── Welcome card: 900×300 ───────────────────────────────────────────────
    // Layout: circular avatar on the left (center 150,150 r=110),
    //         text block on the right (x from ~280).
    const W = 900, H = 300;
    const AVATAR_CX = 150, AVATAR_CY = 150, AVATAR_R = 110;
    const TEXT_X = 295; // left edge of text column
    const HEADER_Y = 68;
    const HEADER_TEXT = "WELCOME";
    const HEADER_FONT = "22px Quicksand-SemiBold";
    const HEADER_TEXT_X = TEXT_X + 22;
    const HEADER_LEFT_X = TEXT_X + 4;
    const HEADER_RIGHT_PADDING = 18;
    const headerMeasure = new Canvas(1, 1).setTextFont(HEADER_FONT).measureText(HEADER_TEXT);
    const HEADER_RIGHT_X = HEADER_TEXT_X + headerMeasure.width + HEADER_RIGHT_PADDING;

    const imageBuffer = new Canvas(W, H)
      // Background stretched to fill the whole card
      .printImage(bg, 0, 0, W, H)
      // Semi-transparent dark overlay for legibility
      .setColor("rgba(0, 0, 0, 0.35)")
      .printRectangle(0, 0, W, H)
      // "WELCOME" header
      .setColor("rgba(255,255,255,0.75)")
      .setTextAlign("left")
      .setTextFont(HEADER_FONT)
      .process((card) => drawAccentSymbol(card, HEADER_LEFT_X, HEADER_Y - 8, 10))
      .printText(HEADER_TEXT, HEADER_TEXT_X, HEADER_Y)
      .process((card) => drawAccentSymbol(card, HEADER_RIGHT_X, HEADER_Y - 8, 10))
      // Username (large)
      .setColor("#FFFFFF")
      .setTextFont("44px Quicksand-SemiBold")
      .printText(member.user.username, TEXT_X, 128)
      // Divider line
      .setColor("rgba(255,255,255,0.25)")
      .printRectangle(TEXT_X, 138, W - TEXT_X - 30, 2)
      // Member rank
      .setColor("rgba(255,255,255,0.80)")
      .setTextFont("22px Quicksand-SemiBold")
      .printText(`Member #${memberCount}`, TEXT_X, 175)
      // Account created date
      .setColor("rgba(255,255,255,0.60)")
      .setTextFont("20px Quicksand-SemiBold")
      .printText(`Account created: ${moment(member.user.createdAt).format("MMM D, YYYY")}`, TEXT_X, 210)
      // Server name (bottom)
      .setColor("rgba(255,255,255,0.50)")
      .setTextFont("18px Quicksand-SemiBold")
      .printText(member.guild.name, TEXT_X, 245)
      // Thin white circle border around avatar
      .setColor("#FFFFFF")
      .printCircle(AVATAR_CX, AVATAR_CY, AVATAR_R + 4)
      .setColor("rgba(0, 0, 0, 0.25)")
      .printCircle(AVATAR_CX, AVATAR_CY, AVATAR_R)
      // Circular avatar
      .printCircularImage(userPfp, AVATAR_CX, AVATAR_CY, AVATAR_R, { fit: "cover" })
      .png();

    const attachment = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });
    const imageChannel = client.channels.cache.get(channelId);
    if (imageChannel) {
      imageChannel.send({ files: [attachment] }).catch(console.error);
    }
  } catch (error) {
    console.error("Error generating image welcome:", error);
  }
});

// ─── Keep-alive HTTP server (for Replit / hosting) ────────────────────────
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Welcome Bot is online.");
  })
  .listen(3000);

// ─── Ready event ──────────────────────────────────────────────────────────
client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setStatus("dnd");
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.TOKEN);
