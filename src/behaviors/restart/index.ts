/**
 * Automatically restarts on updates
 */

import createHandler from "github-webhook-handler";
import http from "http";
import { information } from "../../lib/report";
import { client } from "../../client";
import child_process from "child_process";
import { join } from "path";

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

  console.log(event.payload);
  report("Recieved push, restarting...");
  child_process
    .spawn("sh", [join(__dirname, "../deploy.sh")], {
      detached: true
    })
    .stdout.on("data", report);
});
