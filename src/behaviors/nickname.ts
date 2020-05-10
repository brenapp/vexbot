/**
 * Automatic nickname moderation
 *
 * For VTOSC, nicknames need to follow a general pattern
 * Name | Primary Team | Secondary Team...
 *
 * For a nickname to be valid, the user needs to list at least one team which has played a match,
 * or they must have one of the following exemptions:
 *
 * - Mentors are exempt from nickname checks
 * - If they are VEX IQ, their nickname should look like:
 *     Name | VIQ 8000
 * - If they are RAIC, their nickname should look like
 *     Name | RAIC 320A
 * - If they don't compete in a VEX Robotics Competition, their name should look like:
 *     Name | Non-Competitor
 *
 */

import { client } from "../client";
import * as vexdb from "vexdb";

export async function nicknameValid(nick: string): Promise<boolean> {
  const [name, ...teams] = nick.split(" ");

  const records = await Promise.all(
    teams.map((team) => vexdb.get("teams", { team }).then((v) => v[0]))
  );

  return records.some((team) => team !== undefined);
}

client.on("guildMemberUpdate", async (old, current) => {
  if (old.nickname === current.nickname) return;

  // This only applies to vtosc
  if (old.guild.id !== "310820885240217600") return;

  const entry = await current.guild
    .fetchAuditLogs({ type: "MEMBER_UPDATE" })
    .then((audit) => audit.entries.first());
});
