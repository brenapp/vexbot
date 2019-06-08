import * as keya from "keya";
import { client } from "../../client";
import { GuildMember, Guild } from "discord.js";

import * as parse from "parse-duration";

export let TIMEOUTS = {};

export async function initalize() {
  const store = await keya.store("vexbot-probations");

  // Get all active probations (covers for bot shutdowns), note shutdown parameters looks like { start: timestamp, end: timestamp, reason: string }
  const probations = await store.all();

  for (let probation of probations) {
    const { start, end, reason, guild } = probation.value as {
      start: number;
      end: number;
      reason: string;
      guild: string;
    };

    TIMEOUTS[probation.key] = setTimeout(
      free(probation.key, guild),
      Date.now() - end
    );
  }
}

export const free = (memberid: string, guildid: string) => async () => {
  const guild = client.guilds.get(guildid);
  const member = guild.members.get(memberid);
  const probation = guild.roles.find(role => role.name === "Probation");

  const store = await keya.store("vexbot-probations");

  member.removeRole(probation);
  const dm = await member.createDM();

  dm.send(
    "Your probation has been lifted! You are now permitted to post again. Please remember, repeat offences will be more likely to lead to a ban"
  );

  store.delete(member.id);

  clearTimeout(TIMEOUTS[member.id]);
  delete TIMEOUTS[member.id];
};

export default async function probate(
  member: GuildMember,
  by: GuildMember,
  time: string,
  reason: string
) {
  // Create record in keya
  const store = await keya.store("vexbot-probations");
  const end = Date.now() + parse(time);

  await store.set(member.id, {
    start: Date.now(),
    end,
    reason,
    guild: member.guild.id
  });

  // Set up timeout
  TIMEOUTS[member.id] = setTimeout(
    free(member.id, member.guild.id),
    Date.now() - end
  );

  // Actually do the probation
  const probation = member.guild.roles.find(role => role.name === "Probation");

  await member.addRole(
    probation,
    `For ${time} by ${by.nickname}; Reason: ${reason}`
  );

  // Slide into DMs to give warning
  const dm = await member.createDM();
  const appeals = member.guild.channels.find(
    channel => channel.name === "appeals"
  );
  dm.send(
    `You've been put on probation by ${member} for \`${time}\` with the following reason: \`${reason}\`. While you are on probation, you cannot post or speak in any channel. If you believe this is in error, you can communicate with Admins in ${appeals}`
  );
}
