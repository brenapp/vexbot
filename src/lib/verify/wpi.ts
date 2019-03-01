/**
 * VERIFICATION FOR WPI
 */

import { question, choose, questionValidate } from "../prompt";
import * as vexdb from "vexdb";
import {
  Guild,
  GuildMember,
  TextChannel,
  DMChannel,
  GroupDMChannel,
  GuildChannel,
  Message,
  MessageReaction,
  RichEmbed,
  Channel
} from "discord.js";
import { findOrMakeRole, approve } from "./index";

export async function verifyWPI(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel,
  approveChannel?: TextChannel | DMChannel | GroupDMChannel
) {
  approveChannel = member.guild.channels.get(
    "550868463220948995"
  ) as TextChannel;

  const channel = await member.createDM();
  let name = "",
    team = "";

  channel.send("Welcome to the WPI Signature Event Server!");
  channel.send(
    "In order to participate, you'll need to verify some basic information with us."
  );

  name = await question(
    "What should we call you? *(First Name, Nickname, etc.)*",
    channel
  );

  team = await questionValidate(
    "What team are you *primarily* a part of?",
    channel,
    async team => !!(await vexdb.size("teams", { team })),
    "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please message one of the admins"
  );

  member.setNickname(`${name} | ${team}"}`, "Verification: Nickname");

  let roles = ["550868863483379712"]; // Verified

  // Get WPI Events Teams
  const wpi = await vexdb.get("teams", { sku: "RE-VRC-19-5411" });

  if (wpi.some(t => t.number == team)) {
    roles.push("550868899235758095"); // WPI Bound
  }

  // Add Team Role
  const teamRole = await findOrMakeRole(team, approveChannel.guild);
  roles.push(teamRole.id);

  await approve(approveChannel, welcomeChannel, roles, member);
}
