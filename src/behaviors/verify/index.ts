import { addMessageHandler, addCommand } from "../../lib/message";

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
import { client } from "../../client";
import { askString, choose, questionValidate } from "../../lib/prompt";

import * as vexdb from "vexdb";

export default async function verify(member: GuildMember) {
  // Slide into DMs
  const dm = await member.createDM();

  const name = await askString(
    "Welcome to VEX Teams of South Carolina! In order to participate, you'll need to verify some basic information with us. What should we call you? **(Your Name/Nickname)**",
    dm
  );

  const team = await questionValidate(
    "What team are you *primarily* a part of?",
    dm,
    async team =>
      team === "OVERRIDE" || !!(await vexdb.size("teams", { team })),
    "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please enter OVERRIDE"
  );

  let override = false;
  let reason;
  if (team === "OVERRIDE") {
    override = true;
    reason = await askString(
      "Please specify why you are overriding. This will be visible to admins.",
      dm
    );
  }

  const role = await choose(
    "What is your relationship with your primary team? *(Member, Alumni, Mentor)*",
    dm,
    [
      ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
      ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
      ["MENTOR", "COACH", "ADVISOR"]
    ]
  );

  // Add additional teams
  const additional = await choose(
    "Do you have any other teams you are/were involved with? (yes/no)",
    dm,
    [["YES", "Y"], ["NO", "N"]]
  );

  let teams = additional;
  if (additional === "YES") {
    teams = await askString("Please list all of these below", dm);
  }
}
