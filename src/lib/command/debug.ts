import { addCommand } from "../message";
import { client } from "../../client";

const MAYORMONTY = "274004148276690944";

function okay(message) {
  return message.author.id === MAYORMONTY;
}

addCommand("grant", (args, message) => {
  // Exclusive to myself
  if (!okay(message)) {
    return false;
  }

  const role = message.guild.roles.find(role => role.name === args.join(" "));
  message.member.addRole(role);
});

let DEBUG = false;

addCommand("debug", (args, message) => {
  if (!okay(message)) {
    return false;
  }

  DEBUG = !DEBUG;

  message.channel.send(`Debug ${DEBUG ? "ENABLED" : "DISABLED"}`);
});

process.stderr.on("data", async chunk => {
  if (DEBUG) {
    let channel = await client.users.get(MAYORMONTY).createDM();

    channel.send(chunk.toString());
  }
});
