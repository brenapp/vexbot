/**
 * @author Brendan McGuire
 * @date 12 December 2021
 * 
 * Ping command
 */

import Command from "../lib/command";

export const PingCommand = Command({
    names: ["ping"],
    documentation: {
        description: "Ping the bot",
        group: "General",
        usage: "ping"
    },

    check: () => true,
    exec(message) {
        return message.channel.send("Pong!");
    },
});