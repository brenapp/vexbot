//
// UNTESTED - DO NOT DEPLOY
//

import {
    Guild,
    GuildMember,
    Message,
    MessageReaction,
    PartialMessage,
    PartialUser,
    User
} from "discord.js";
import {
    handleBanAdd,
    handleBanRemove,
    handleLeave,
    handleMessageDelete,
    handleMessageUpdate
} from "./behaviors/events";
import { handleMessage } from "./lib/message";
import { config } from "./lib/access";
import report, { information } from "./lib/report";
import { client } from "./client";
import { DEBUG, debug } from "./commands/debug";
import * as probation from "./behaviors/probation";
import "./commands";
import "./lib/handlers";
import "./behaviors/log";
import "./behaviors/random";
import "./behaviors/eliza";

// array of statuses for random generation
const statuses:string[] = [
    "over the server",
    "y'all",
    "quali highlights",
    "Clembot 👀",
    "<ERROR>",
    "Brendan",
    "Clemson football",
    "Carolina football",
    "a tournament",
    "3796 tip in finals"
];

/* ERROR HANDLING
 *   Creates a custom reporter and submits debug console reports for unhandled
 *    errors.
 */
const reporter = report(client);
process.on("uncaughtException",  (error:Error) => reporter(error));
process.on("unhandledRejection", (error:Error) => reporter(error));

/* CACHE/MEMORY CLEARING
 * A function to clear vexbot's cache of messages at specified intervals.
 *  Helps with runtime smoothness and processing speed.
 */

const cleanInterval:number = config("memory.cleanInterval") as number;
setInterval( () => {
    const numCleaned:number = client.sweepMessages(cleanInterval);
    debug(`Cleaned ${numCleaned} messages from cache`);

}, cleanInterval);
debug(`Cache Clearing Interval: ${cleanInterval} ms`);

/* EVENT HANDLERS
 *   Explicitly defined handlers for different events the bot will encounter.
 *   See header comment before each client.on() statement for which event that
 *    specific block of code handles.
 */ 

// startup handler
client.on('ready', () => {

    debug("Client initializing");

    // handle login/auth error
    if(!client.user){

        console.error("Error: client credential/login error");
        process.exit(1);
    
    }

    // set status
    if(process.env["DEV"]){

        // dev status
        client.user.setActivity("for changes", {type: "WATCHING"});
    
    } else {
        
        // update status every 10 mins
        setInterval( () => {
            const index:number = Math.floor(Math.random() * (statuses.length - 1));
            client.user.setActivity(statuses[index], {type: "WATCHING"});
        }, 600000);
    }

    // initialize probation records
    probation.initalize();

    // client launched successfully
    debug(`${client.user.tag} is online!`);

    // additional dev mode output
    if(DEBUG || !process.env["DEV"]){
        information(client)("PRODUCTION Online!");
    }
});

// handle messages - logging, commands, etc.
client.on("message", (msg:Message) => {

    // TODO: re-assess message handling protocol
    handleMessage(msg);
});

// handle edited messages, updates commands as well
client.on("messageUpdate", async (
    old:PartialMessage,
    current:PartialMessage
) => {
        // TODO: implmement BLBot message updater
});

// handle message deletions
// AUDIT LOG
client.on("messageDelete", (msg:Message) => {
    // TODO: implement delete message entry
});

// handle new guild members - auto-start verification process
// AUDIT LOG
client.on("guildMemberAdd", (member:GuildMember) => {
    // TODO: auto-verification implementation
});

// handle member leave/kick/ban
// AUDIT LOG
client.on("guildMemberLeave", (member:GuildMember) => {
    // TODO: implement member leave log
})

// handle the banhammer swing
// AUDIT LOG
client.on("guildBanAdd", (guild:Guild, user:User) => {
    // TODO: implement banhammer add
});

// handle the banhammer un-swing
// AUDIT LOG
client.on("guildBanRemove", (guild:Guild, user:User) => {
    // TODO: implement banhammer remove
});

// STARBOARD FUNCTIONS
client.on("messageReactionAdd", async (
    reaction:MessageReaction,
    user:(User | PartialUser)
) => {
    // TODO - start reaction check and update starboard entry
});

client.on("messageReactionRemove", async (
    reaction:MessageReaction,
    user:(User | PartialUser)
) => {
    // TODO - check star reaction and update starboard entry
});

client.on("")