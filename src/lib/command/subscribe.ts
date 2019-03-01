import { addCommand } from "../message";
import * as vexdb from "vexdb";
import { User } from "discord.js";
import {
  MatchesResponseObject,
  SkillsResponseObject
} from "vexdb/out/constants/ResponseObjects";
import {
  MatchesRequestObject,
  SkillsRequestObject
} from "vexdb/out/constants/RequestObjects";

// Store subscriptions
const watchers: { [team: string]: TeamWatcher } = {};

export function matchTitle(match: MatchesResponseObject) {
  let type = [
    ,
    "PRACTICE",
    "QUAL",
    "QF",
    "SF",
    "F",
    "RR",
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    "R16"
  ][match.round];

  return `${type} ${
    [1, 2].includes(match.round)
      ? match.matchnum
      : `${match.instance}-${match.matchnum}`
  }`;
}

class TeamWatcher {
  matches: vexdb.LiveEventEmitter<MatchesRequestObject, MatchesResponseObject>;

  subs: Set<User> = new Set();
  team: string;

  constructor(team: string) {
    this.team = team;
    this.matches = vexdb.live("matches", { team, season: "current" });
  }

  // Update everyone about the new match
  async update(match: MatchesResponseObject) {
    for (let [user] of this.subs.entries()) {
      let channel = await user.createDM();
      let teams = [match.red1, match.red2, match.blue1, match.blue2];
      channel.send({
        embed: {
          color:
            match.redscore > match.bluescore
              ? 0xff7675
              : match.redscore === match.bluescore
              ? 0xffffff
              : 0x0984e3,
          title: `${matchTitle(match)} (${teams
            .slice(0, 2)
            .join(" & ")} vs. ${teams.slice(2, 4).join(" & ")})`,
          fields: [
            {
              name: "Red — " + match.redscore,
              value: [`Score: ${match.redscore}`].join("\n")
            },
            {
              name: "Blue — " + match.bluescore,
              value: [`Score: ${match.bluescore}`].join("\n")
            }
          ]
        }
      });
    }
  }

  end() {
    this.matches.close();
  }
}

addCommand("sub", async (args, message) => {
  const team = args[0];

  if (!team) {
    message.reply("No Team Specified!");
    return true;
  }

  if (!watchers[team]) {
    watchers[team] = new TeamWatcher(team);
  }

  // Check if user is subscribed already
  if (watchers[team].subs.has(message.author)) {
    message.reply(`You're already subscribed to ${team}!`);
    return true;
  }

  // Add user to subscription for teams
  message.reply(
    `You will now recieve updates (skills and matches) for ${team}`
  );
  watchers[team].subs.add(message.author);

  return true;
});

addCommand("unsub", async (args, message) => {
  const team = args[0];

  if (!team) {
    message.reply("No Team Specified!");
    return true;
  }

  if (!watchers[team]) {
    watchers[team] = new TeamWatcher(team);
  }

  // Check if user is subscribed already
  if (!watchers[team].subs.has(message.author)) {
    message.reply(`You're not yet subscribed to ${team}!`);
    return true;
  }

  // Add user to subscription for teams
  message.reply(`You will no longer recieve updates for ${team}`);
  watchers[team].subs.delete(message.author);

  // Stop polling if there's no more subscriptions
  if (!watchers[team].subs.size) {
    watchers[team].end();
    delete watchers[team];
  }

  return true;
});
