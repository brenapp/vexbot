import { addMessageHandler } from "../message";
import { GuildMember, DiscordAPIError } from "discord.js";
import { client } from "../../client";
import { Game } from "discord.js";

let probated = [];

/**
 * Automatically probates a user for a given time
 * @param user User to probate
 * @param length Time in milliseconds to apply the punishment for
 */
async function probate(
  user: GuildMember,
  length: { time: string; ms: number },
  by: GuildMember,
  reason: string
) {
  let probation = user.guild.roles.find(role => role.name === "Probation");
  let dm = await user.createDM();
  dm.send(
    `You've been put on probation by ${by} for ${
      length.time
    } for the reason: ${reason}`
  );
  dm.send(
    `While you are in probation, you cannot post messages in any channel, or speak in any voice channel. If you believe this was in error, you can appeal this in ${user.guild.channels.find(
      "name",
      "appeals"
    )}`
  );
  user.addRole(
    probation,
    `By: ${by.displayName} (${by.user.username}#${
      by.user.discriminator
    }); Reason: ${reason}`
  );

  probated.push(user.displayName.split(" |")[0]);

  setPresence(probated);

  setTimeout(() => {
    user.removeRole(probation);

    probated = probated.filter(u => u !== user.displayName.split(" |")[0]);
    setPresence(probated);

    dm.send(
      "Your probation has been lifted! You are now permitted to post again. Please remember, repeat offences will be more likely to lead to a ban"
    );
  }, length.ms);
}

function setPresence(users: string[]) {
  if (users.length < 1) {
    client.user.setActivity("over the server", { type: "WATCHING" });
    return;
  }
  client.user.setActivity(users.join(", "), { type: "WATCHING" });
}

/**
 * Turns a time and unit into a number milliseconds
 * Available units: ms, s, m, h, d
 * @param time Time + unit
 */
function parseTime(time: string) {
  const units = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  let [number, unit] = [+time.slice(0, -1), time.slice(-1)];
  if (units[unit]) {
    return { ms: number * units[unit], time };
  } else {
    return null; // No available unit
  }
}

addMessageHandler(async message => {
  if (!message.content.toLowerCase().startsWith("!probate")) return false;

  // First, test if the user has the permission to probate someone
  if (message.member.hasPermission("ADMINISTRATOR")) {
    let users = message.mentions.members;

    let time = parseTime(
      message.content
        .split("for")[0]
        .split(" ")
        .slice(-2)[0]
    );

    if (!time) {
      message.reply("Unknown time quantity");
    } else {
      users.forEach(user => {
        console.log(
          `Probate ${user.displayName} for ${time.time} by ${
            message.member.displayName
          }`
        );
        probate(user, time, message.member, message.content.split("for ")[1]);
      });
    }
  } else {
    // Probate the offender for a short period of time
    message.reply("You're not permitted to do that!");
    probate(
      message.member,
      parseTime("30s"),
      message.guild.me,
      "Unauthorized use of !probate"
    );
  }
  return true;
});

export { probate, parseTime };
