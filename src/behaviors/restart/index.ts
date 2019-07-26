/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../../lib/report";
import { client } from "../../client";

import execa from "execa";
import { exec } from "../../commands/debug";
import { Message, RichEmbed, User } from "discord.js";
import { code, escape } from "../../lib/util";
import { authorization } from "../../lib/access";

const secret = authorization("github.webhook.secret");

const handler = createHandler({ path: "/webhook", secret });
const report = information(client);

async function deploy() {
  const subprocess = execa.command("sh deploy.sh");
  let body = exec.prompt + " sh deploy.sh\n";
  let message = (await report(code(body))) as Message;

  async function handleChunk(chunk: string) {
    // If the chunk itself is too big, handle it in sections
    if (chunk.length > 1900) {
      for (let i = 0; i < chunk.length; i += 1900) {
        const subchunk = chunk.slice(i, 1900);
        await handleChunk(subchunk);
      }
    }

    // If length would be exceed
    if (body.length + chunk.length > 1900) {
      body = escape(chunk);
      message = (await message.channel.send(code(body))) as Message;
    } else {
      body += escape(chunk);
      await message.edit(code(body));
    }
  }

  subprocess.stdout.on("data", handleChunk);
  subprocess.stderr.on("data", handleChunk);
}

async function approval(embed: RichEmbed) {
  const approval = (await report({ embed })) as Message;
  await approval.react("👍");

  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => resolve(false), 5 * 60 * 1000);

    let collector = approval.createReactionCollector(
      (vote, usr: User) =>
        (vote.emoji.name === "👎" || vote.emoji.name === "👍") && !usr.bot
    );
    let handleReaction;
    collector.on(
      "collect",
      (handleReaction = vote => {
        const approver = vote.users.last();

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
    collector.on("end", () => {});
  }) as Promise<boolean>;
}

http
  .createServer((req, res) => {
    handler(req, res, function(err) {
      res.statusCode = 404;
      res.end("no such location");
    });
  })
  .listen(7777);

handler.on("push", async event => {
  if (process.env["DEV"]) return;

  const embed = new RichEmbed();
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

  for (let commit of event.payload.commits) {
    embed.addField(
      code(escape(commit.message)),
      `${commit.added.map(file => `+ ${file}`).join("\n")}${commit.removed
        .map(file => `- ${file}`)
        .join("\n")}${commit.modified.map(file => `Δ ${file}`).join("\n")}`
    );
  }

  embed.addField("Deploy", "React with :thumbsup: to deploy these changes");

  if (await approval(embed)) {
    await deploy();
  }
});
