/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../../lib/report";
import { client } from "../../client";
import { join } from "path";

import execa from "execa";
import { exec } from "../../commands/debug";
import { Message } from "discord.js";

const handler = createHandler({ path: "/webhook", secret: "vexbot" });
const report = information(client);

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

  report(
    `**PUSH RECIEVED**\n\nCommits:${event.payload.commits.map(
      commit => `\`\`\`${commit.message}\`\`\``
    )}Deploying changes now...`
  );
  const subprocess = execa.command("sh deploy.sh");
  let body = exec.prompt + " sh deploy.sh\n";
  const message = (await report(`\`\`\`${body}\`\`\``)) as Message;

  subprocess.stdout.on("data", chunk => {
    body += chunk.toString();
    message.edit(`\`\`\`${body}\`\`\``);
  });
  subprocess.stderr.on("data", chunk => {
    body += chunk.toString();
    message.edit(`\`\`\`${body}\`\`\``);
  });
});
