import Command, { Permissions, makeEmbed } from "../lib/command";
import { Message } from "discord.js";

import * as vexdb from "vexdb";
import * as keya from "keya";
import probate from "../behaviors/probation";
import { client } from "../client";
import { information } from "../lib/report";

import execa from "execa";
import { addOneTimeMessageHandler, removeMessageHandler } from "../lib/message";
import { code, escape } from "../lib/util";

export let DEBUG = false;

export class DebugCommand extends Command("debug") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  documentation() {
    return {
      description: "Toggles debug mode. Owner Only Command",
      usage: "debug",
      group: "Owner"
    };
  }

  exec(message: Message, args: string[]) {
    DEBUG = !DEBUG;
    message.channel.send(`Debug ${DEBUG ? "ENABLED" : "DISABLED"}`);
  }
}

new DebugCommand();

export class CacheCommand extends Command("cache") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  documentation() {
    return {
      description: "Cache Management",
      usage: "cache [clear|list]",
      group: "Owner"
    };
  }

  async exec(message: Message, args: string[]) {
    switch (args[0]) {
      case "clear":
        vexdb.cache.clear();
        return message.channel.send("Cache Cleared");
        break;
      case "list":
      default:
        const store = await keya.store("vexdb");
        const cache = (await store.all()).map(v => v.key);

        const embed = makeEmbed(message)
          .setTitle("VexDB Cache")
          .setDescription(
            cache.slice(0, 10).join("\n") +
              `\n\n*(${cache.length - 10} more items)*`
          );

        return message.channel.send({ embed });

        break;
    }
  }
}

new CacheCommand();

export class PingCommand extends Command("ping") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Heartbeat",
      usage: `ping`,
      group: "Meta"
    };
  }

  async exec(message: Message, args: string[]) {
    return message.reply("Pong!");
  }
}

new PingCommand();

export class ExecCommand extends Command("shell") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  prompt = "";

  constructor() {
    super();

    // Get shell prompt
    this.prompt = `vexbot@${
      process.env["DEV"] ? "development" : "production"
    } $ `;
  }

  documentation() {
    return {
      description: "Arbitrary Shell execution",
      usage: `shell echo "Hi"`,
      group: "Owner"
    };
  }

  async exec(message: Message, params: string[]) {
    let body = `${this.prompt}${params.join(" ")}\n`;
    let resp = (await message.channel.send(code(body))) as Message;

    let response;
    let handler;
    try {
      const process = execa.command(params.join(" "));

      async function handleChunk(chunk: any) {
        // If length would be exceed
        if (body.length + chunk.length > 1900) {
          body = escape(chunk);
          resp = (await message.channel.send(code(body))) as Message;
        } else {
          body += escape(chunk);
          await resp.edit(code(body));
        }
      }

      process.stdout.on("data", handleChunk);
      process.stderr.on("data", handleChunk);

      // Cancel process
      handler = addOneTimeMessageHandler(m => {
        if (
          m.channel.id !== message.channel.id ||
          m.member.id !== message.member.id ||
          m.content !== "exit"
        ) {
          return false;
        }

        process.kill();
        process.stdout.off("data", handleChunk);
        process.stderr.off("data", handleChunk);
        message.channel.send("Killed");
        return true;
      });

      response = await process;
      removeMessageHandler(handler);
    } catch (error) {
      response = error;
    }

    return resp.edit(
      `${code(body)}EXITED ${
        response.failed ? "UNSUCCESSFULLY" : "SUCCESSFULLY"
      } (${response.exitCode} ${response.exitCodeName})\n`
    );
  }

  async fail(message: Message) {
    const report = information(client);
    probate(
      message.member,
      message.guild.me,
      "1h",
      "Attempted use of shell execution"
    );

    await report(`Failed attempt at shell execution by ${message.author}`);
  }
}

const exec = new ExecCommand();
export { exec };
