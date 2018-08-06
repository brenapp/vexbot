import { addCommand } from "../message";
import vexdb from "vexdb";

addCommand("event", async (args, message) => {
  let [sku] = args;

  if (!sku) {
    message.reply("No event SKU specified (Usage: `!event [sku]`)");
    return true;
  }

  let event = (await vexdb.get("events", { sku }))[0];
  let divisionReport = await Promise.all(
    event.divisions.map(async name => {
      let topSeed = (await vexdb.get("rankings", { sku, division: name }))[0]
        .team;
      return {
        name,
        value: `Top Seed: ${topSeed}`
      };
    })
  );
  let awards = await vexdb.get("awards", { sku });
  let excellence = awards
    .filter(a => a.name.includes("Excellence Award"))
    .map(a => a.team);
  let champions = awards
    .filter(a => a.name.includes("Champions"))
    .map(a => a.team);

  if (!event) {
    message.reply(`No event with that SKU (${sku})`);
    return true;
  }

  message.channel.send({
    embed: {
      color: 3447003,
      title: event.name,
      url: `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${
        event.sku
      }.html`,
      description: `${await vexdb.size("teams", {
        sku
      })} Teams; Excellence: ${excellence.join(
        ", "
      )}; Champions: ${champions.join(", ")}`,
      footer: {
        icon_url: message.author.avatarURL,
        text: `Trigged by ${message.author.username}#${
          message.author.discriminator
        }`
      },
      timestamp: message.createdAt,
      fields: divisionReport
    }
  });
});
