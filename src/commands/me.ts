import Command, { Permissions } from "../lib/command";

export const MeCommand = Command({
  names: ["me"],

  documentation: {
    usage: "me",
    description: "The selfish command",
    group: "META",
  },

  check: Permissions.guild,
  async exec(message) {
    const member = message.member;
    if (!member) return;
  },
});
