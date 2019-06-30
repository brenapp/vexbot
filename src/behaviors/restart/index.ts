/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../../lib/report";
import { client } from "../../client";

import execa from "execa";
import { exec } from "../../commands/debug";
import { Message } from "discord.js";
import { code, escape } from "../../lib/util";

const secret = require("../../../config.json").github.webhook.secret;

const handler = createHandler({ path: "/webhook", secret });
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
    `**PUSH RECIEVED**${event.payload.commits
      .map(commit => code(`${commit.id.slice(0, 6)} ${escape(commit.message)}`))
      .join("")}*Log*`
  );
  const subprocess = execa.command("sh deploy.sh");
  let body = exec.prompt + " sh deploy.sh\n";
  const message = (await report(code(body))) as Message;

  subprocess.stdout.on("data", chunk => {
    body += chunk.toString();
    message.edit(code(body));
  });
  subprocess.stderr.on("data", chunk => {
    body += chunk.toString();
    message.edit(code(body));
  });
});
