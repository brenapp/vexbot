import Command, { Permissions } from "../lib/command";
import { Message, TextChannel } from "discord.js";

/**
 * Locks a specific channel
 */

export class LockCommand extends Command("lock") {

    check = Permissions.admin;

    documentation() {
        return {
            description: "Locks a channel",
            usage: "locks",
            group: "admin"
        }
    }

    exec(message: Message, args: string[]) {
        const channel = message.channel as TextChannel;


        channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: false });

        return message.channel.send("Channel locked");

    }

}

new LockCommand();

export class UnlockCommand extends Command("unlock") {

    check = Permissions.admin;

    documentation() {
        return {
            description: "Unlocks a channel",
            usage: "unlock",
            group: "admin"
        }
    }

    exec(message: Message) {
        const channel = message.channel as TextChannel;


        channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: null });

        return message.channel.send("Channel unlocked");

    }

}

new UnlockCommand();