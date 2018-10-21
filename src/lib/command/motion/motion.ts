import { Role } from "discord.js";

export default class Motion {
  type: "prop" | "recall";
  status: "pending" | "passed" | "failed";

  neededVotes: number;

  constructor(type: "prop" | "recall", votingRole: Role) {
    this.type = type;

    if (type === "prop") {
      this.neededVotes = Math.ceil(votingRole.members.size / 2);
    } else {
      this.neededVotes = Math.ceil(((votingRole.members.size - 1) * 2) / 3);
    }
  }
}
