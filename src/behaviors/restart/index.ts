/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../../lib/report";
import { client } from "../../client";
import { join } from "path";

import execa from "execa";

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

handler.on("push", function(event) {
  if (process.env["DEV"]) return;

  report(
    `**PUSH RECIEVED**\n\nCommits:${event.payload.commits.map(
      commit => `\`\`\`${commit.message}\`\`\``
    )}Deploying changes now...`
  );
  const subprocess = execa.command("sh deploy.sh");

  subprocess.stdout.on("data", chunk => report(`\`\`\`${chunk}\`\`\``));
  subprocess.stderr.on("data", chunk => report(`\`\`\`${chunk}\`\`\``));
});
