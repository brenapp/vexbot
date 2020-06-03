/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../lib/report";
import { client } from "../client";

import { Message, MessageEmbed, User, MessageReaction } from "discord.js";
import { code, escape } from "../lib/util";
import { authorization } from "../lib/access";

import { ShellCommand } from "../commands/debug";

const secret = authorization("github.webhook.secret");
const owner = authorization("discord.owner");

const handler = createHandler({ path: "/webhook", secret });
const report = information(client);

/**
 * Runs the deploy script
 * @param channel
 */
async function deploy() {
  const user = await client.users.fetch(owner);
  const dm = await user.createDM();

  ShellCommand.exec(dm.lastMessage as Message, ["sh", "deploy.sh"]);
}

/**
 * Seeks approval
 * @param embed
 */
async function approval(embed: MessageEmbed) {
  const approval = (await report({ embed })) as Message;
  await approval.react("👍");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 5 * 60 * 1000);

    const collector = approval.createReactionCollector(
      (vote, usr: User) =>
        (vote.emoji.name === "👎" || vote.emoji.name === "👍") && !usr.bot
    );
    let handleReaction: (vote: MessageReaction) => void;
    collector.on(
      "collect",
      (handleReaction = (vote) => {
        if (vote.emoji.name === "👍") {
          if (collector.off) {
            collector.off("collect", handleReaction);
          }
          resolve(true);
        }
        collector.emit("end");
        clearTimeout(timeout);

        resolve(false);
      })
    );
  }) as Promise<boolean>;
}

http
  .createServer((req, res) => {
    handler(req, res, function() {
      res.statusCode = 404;
      res.end("no such location");
    });
  })
  .listen(7777);

handler.on("push", async (event) => {
  if (process.env["DEV"]) return;

  const embed = new MessageEmbed();
  embed
    .setTitle("Push Recieved")
    .setDescription(
      `[Compare Changes](${event.payload.compare})\n\n**Commits**`
    )
    .setAuthor(
      event.payload.repository.owner.name,
      event.payload.repository.owner.avatar_url,
      event.payload.repository.url
    );

  for (const commit of event.payload.commits) {
    embed.addField(
      code(escape(commit.message)),
      `${commit.added
        .map((file: string) => `+ ${file}`)
        .join("\n")}${commit.removed
        .map((file: string) => `- ${file}`)
        .join("\n")}${commit.modified
        .map((file: string) => `Δ ${file}`)
        .join("\n")}`
    );
  }

  embed.addField("Deploy", "React with :thumbsup: to deploy these changes");

  if (await approval(embed)) {
    await deploy();
  }
});
