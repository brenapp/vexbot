import { Message, TextChannel } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { information } from "../lib/report";

import probate from "../behaviors/probation";
import { client } from "../client";

import execa from "execa";
import { addOneTimeMessageHandler, removeMessageHandler } from "../lib/message";
import { code, escape } from "../lib/util";

import { getLastCommit, Commit } from "git-last-commit";
import * as os from "os";
import { resolve } from "path";

const getCommit = () =>
  new Promise<Commit>((res, rej) => {
    getLastCommit((err, commit) => (err ? rej(err) : res(commit)));
  });

export let DEBUG = false;

export const DebugCommand = Command({
  names: ["debug"],
  check: Permissions.compose(Permissions.guild, Permissions.owner),

  documentation: {
    description: "Toggles debug mode. Owner Only Command",
    usage: "debug",
    group: "Owner",
  },

  exec(message: Message) {
    DEBUG = !DEBUG;
    return message.channel.send(`Debug ${DEBUG ? "ENABLED" : "DISABLED"}`);
  },
});

export const PingCommand = Command({
  names: ["ping"],
  documentation: {
    description: "Heartbeat",
    usage: `ping`,
    group: "Meta",
  },

  check: Permissions.all,
  async exec(message: Message) {
    return message.channel.send("pong");
  },
});

export const EvalCommand = Command({
  names: ["eval"],

  documentation: {
    description: "Arbitrary JavaScript execution",
    usage: "eval process.env",
    group: "Owner",
  },

  check: Permissions.owner,
  async exec(message, args) {
    const command = args.join(" ");
    let result: string;
    try {
      result = JSON.stringify(eval(command));
    } catch (e) {
      result = e.toString();
    }

    return message.channel.send(code(result));
  },

  async fail(message: Message) {
    const report = information(client);

    if (!message.member) return;

    if (message.guild) {
      probate(
        message.member,
        message.guild.me,
        "1h",
        "Attempted use of javascript execution"
      );
    }

    await report(`Failed attempt at javascript execution by ${message.author}`);
  },
});

export const ShellCommand = Command({
  names: ["shell"],

  documentation: {
    description: "Arbitrary Shell execution",
    usage: `shell echo "Hi"`,
    group: "Owner",
  },

  check: Permissions.owner,

  async fail(message: Message) {
    const report = information(client);

    if (!message.member) return;

    if (message.guild) {
      probate(
        message.member,
        message.guild.me,
        "1h",
        "Attempted use of shell execution"
      );
    }

    await report(`Failed attempt at shell execution by ${message.author}`);
  },

  async exec(message: Message, params: string[]) {
    const prompt = `vexbot@${
      process.env["DEV"] ? "development" : "production"
    } $ `;
    let body = `${prompt}${params.join(" ")}\n`;
    let resp = (await message.channel.send(code(body))) as Message;

    let response;
    let handler;
    try {
      const proc = execa.command(params.join(" "), {
        cwd: resolve(__dirname, "../../"),
      });

      // eslint-disable-next-line no-inner-declarations
      async function handleChunk(chunk: Buffer) {
        // If the chunk itself is too big, handle it in sections
        if (chunk.length > 1900) {
          for (let i = 0; i < chunk.length; i += 1900) {
            const subchunk = chunk.slice(i, i + 1900);
            await handleChunk(subchunk);
          }
        }

        // If length would be exceeded
        if (body.length + chunk.length > 1900) {
          body = escape(chunk.toString());
          resp = (await message.channel.send(code(body))) as Message;
        } else {
          body += escape(chunk.toString());
          await resp.edit(code(body));
        }
      }

      proc.stdout.on("data", handleChunk);
      proc.stderr.on("data", handleChunk);

      // Cancel process
      handler = addOneTimeMessageHandler((m) => {
        if (
          m.channel.id !== message.channel.id ||
          m.author.id !== message.author.id ||
          m.content !== "exit"
        ) {
          return false;
        }

        proc.kill();
        proc.stdout.off("data", handleChunk);
        proc.stderr.off("data", handleChunk);
        message.channel.send("Killed");
        return true;
      });

      response = await proc;
      removeMessageHandler(handler);
    } catch (error) {
      response = error;
    }

    return resp.edit(
      `${code(body)}EXITED ${
        response.failed ? "UNSUCCESSFULLY" : "SUCCESSFULLY"
      } (${response.exitCode} ${response.exitCodeName})\n`
    );
  },
});

export const MachineCommand = Command({
  names: ["machine"],
  documentation: {
    usage: "machine",
    description: "Lists the machine vexbot is running on",
    group: "ADMIN",
  },

  check: Permissions.owner,
  exec(message: Message) {
    const { username } = os.userInfo();
    const machine = os.hostname();

    const type = os.type();
    const arch = os.arch();

    return message.channel.send(
      `\`\`\`${username}@${machine} (${type} ${arch})\`\`\``
    );
  },
});

export const RestartCommand = Command({
  names: ["restart"],

  documentation: {
    group: "OWNER",
    description: "Restarts vexbot",
    usage: "restart",
  },

  check: Permissions.compose(Permissions.owner, () => !process.env["DEV"]),
  async exec(message: Message) {
    execa.command("pm2 restart vexbot");
    return message.channel.send("Restarting...");
  },
});

export const ServersCommand = Command({
  names: ["servers"],
  documentation: {
    group: "OWNER",
    description: "Lists servers vexbot is in",
    usage: "servers",
  },

  check: Permissions.owner,
  async exec(message: Message) {
    const content = client.guilds.cache
      .map((guild) => `${guild.id}: ${guild.name}`)
      .join("\n");
    message.channel.send(content);
  },
});

export const ChannelsCommand = Command({
  names: ["channels"],
  documentation: {
    group: "OWNER",
    description: "Gets accessible channels in a specified server",
    usage: "channels <id>",
  },

  check: Permissions.owner,
  async exec(message: Message, args) {
    const server = client.guilds.resolve(args[0]);
    if (!server) {
      return message.channel.send("Can't access that server!");
    }

    // Get channels
    const channels = server.channels.cache
      .map((channel) => `\`${channel.id}\`: ${channel.name} (${channel.type})`)
      .join("\n");
    message.channel.send(channels);
  },
});

export const MessagesCommand = Command({
  names: ["messages"],
  documentation: {
    group: "OWNER",
    description: "Gets messages channels in a specified channel",
    usage: "messages <id>",
  },

  check: Permissions.owner,
  async exec(message: Message, args) {
    const channel = client.channels.resolve(args[0]);
    if (!channel) {
      return message.channel.send("Can't access that channel!");
    }

    if (channel.type == "category" || channel.type == "voice") {
      return message.channel.send("Not a text channel");
    }

    // Get channels
    const messages = await (channel as TextChannel).messages.fetch({
      limit: 50,
    });
    for (const [, m] of messages) {
      message.channel.send(
        `${m.author.username}#${
          m.author.discriminator
        } in ${m.channel.toString()}: ${m.cleanContent}`,
        {
          files: m.attachments.map((attach) => attach.url),
        }
      );
    }
  },
});

export const VersionCommand = Command({
  names: ["version"],

  documentation: {
    description: "Gets vexbot version",
    usage: `version`,
    group: "Owner",
  },

  check: Permissions.owner,
  async exec(message: Message) {
    const commit = await getCommit();
    return message.channel.send(
      code(`Commit ${commit.hash} (${commit.branch})\n${commit.subject}`)
    );
  },
});
