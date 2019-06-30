import Command, { Permissions, makeEmbed } from "../lib/command";
import { Message } from "discord.js";

import * as vexdb from "vexdb";
import * as keya from "keya";
import probate from "../behaviors/probation";
import { client } from "../client";
import { information } from "../lib/report";

import execa from "execa";

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
    const resp = (await message.channel.send(`\`\`\`${body}\`\`\``)) as Message;

    let response;
    try {
      const process = execa.command(params.join(" "));

      process.stdout.on("data", chunk => {
        body += chunk.toString();
        resp.edit(`\`\`\`${body}\`\`\``);
      });
      process.stderr.on("data", chunk => {
        body += chunk.toString();
        resp.edit(`\`\`\`${body}\`\`\``);
      });

      response = await process;
    } catch (error) {
      response = error;
    }

    return resp.edit(
      `\`\`\`${body}\`\`\`EXITED ${
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
