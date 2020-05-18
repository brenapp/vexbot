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
    let match = args[0].match(/([0-9]+)?d([0-9]+)([+-][0-9]+)?/);

    if (!match) {
      return message.channel.send(
        "Cannot parse dice information. Use something like `roll 4d5` or `roll d6`"
      );
    }

    const [expression, amount, sides, modifier] = match;

    let sum = 0;
    let body = `Rolling ${args[0]}...\n`;

    for (let i = 0; i < +amount; i++) {
      const result = randomRange(+sides);
      sum += result;

      body += `🎲 → ${result}\n`;
    }

    // Modifier
    let mod = 0;

    if (modifier) {
      let symbol = modifier[0];
      mod = +modifier.slice(1);

      if (symbol === "-") {
        mod *= -1;
      }
    }

    body += `Total → ${sum}${modifier ? modifier : ""} = ${sum + mod}\n`;

    return message.channel.send(body);
  },
});
