/**
 * Rolls dice
 */

import Command, { Permissions } from "../lib/command";

function randomRange(max: number, min: number = 1) {
  return Math.round(Math.random() * (max - min) + min);
}

export const RollCommand = Command({
  names: ["roll"],

  documentation: {
    usage: "roll 4d6",
    description:
      "Rolls dice (4d6 find the sum of a 6-sided dice rolled 4 times)",
    group: "META",
  },

  check: Permissions.all,
  exec(message, args) {
    let [amount, sides] = args[0].split("d").map((r) => +r);

    // If they didn't specify, then set it to one
    if (!amount) {
      amount = 1;
    }

    if (!sides) {
      return message.channel.send(
        "Cannot parse dice information. Use something like `roll 4d5` or `roll d6`"
      );
    }

    let sum = 0;
    let body = `Rolling ${args[0]}...\n`;

    for (let i = 0; i < amount; i++) {
      const result = randomRange(sides);
      sum += result;

      body += `🎲 → ${result}\n`;
    }

    body += `Total → ${sum}\n`;

    return message.channel.send(body);
  },
});
