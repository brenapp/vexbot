/**
 * Rock Paper Scissors
 */

import Command, { Permissions } from "../lib/command";
import { Message, Channel, User, TextChannel } from "discord.js";
import listen from "../lib/reactions";

export const RockPaperScissorsCommand = Command({
  names: ["rps", "rockpaperscissors"],

  documentation: {
    description: "Rock Paper Scissors",
    usage: "rps @MayorMonty",
    group: "Meta",
  },

  check: Permissions.compose(Permissions.channel("bots"), Permissions.guild),
  async exec(message: Message, argv: string[]) {
    const challenger = message.author;
    const challenged = message.mentions.users.first();

    if (!challenged) {
      return message.channel.send("You need to challenge someone nitwit!");
    }

    await message.react("🔥");

    listen(message, ["🔥"], (reaction) => {
      if (reaction.users.has(challenged.id)) {
        message.channel.send("Competitors check DMs!");

        message.delete();

        this.doGame(message.channel as TextChannel, challenger, challenged);
      }
    });
  },
  async doGame(output: TextChannel, challenger: User, challenged: User) {
    const [challengerMove, challengedMove] = await Promise.all([
      this.getInput(challenger),
      this.getInput(challenged),
    ]);

    // Determine the winner
    // This code is a little confusing, but it's actually really difficult
    // to make code that determines the winner in a clean way

    let winner: User | null = null;

    const result =
      ["⛰️", "🧻", "✂️"].findIndex((v) => v === challengerMove) -
      ["⛰️", "🧻", "✂️"].findIndex((v) => v === challengedMove);

    switch (result) {
      case 0:
        winner = null;
        break;

      case 2:
      case -1:
        winner = challenged;
        break;

      case 1:
      case -2:
        winner = challenger;
        break;
    }

    let out = await output.send(
      `${challenger} plays ${challengerMove}\n${challenged} plays ${challengedMove}\n${
        winner ? `${winner} wins!` : "It's a tie!"
      } (React with 🔥 to play again)`
    );

    if (out instanceof Array) {
      out = out[0];
    }

    listen(out, ["🔥"], (fire) => {
      if (fire.users.has(challenger.id) && fire.users.has(challenged.id)) {
        this.doGame(output, challenger, challenged);
      }
    });
  },

  async getInput(user: User): Promise<string> {
    const dms = await user.createDM();

    const message = (await dms.send(
      "Respond to this message with your move"
    )) as Message;

    await Promise.all([
      message.react("⛰️"),
      message.react("🧻"),
      message.react("✂️"),
    ]);
    return new Promise((resolve) =>
      listen(message, ["⛰️", "🧻", "✂️"], (reaction) =>
        resolve(reaction.emoji.toString())
      )
    );
  },

  fail(message: Message) {
    message.channel.send("Not here!");
  },
});
