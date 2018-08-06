"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = __importDefault(require("discord.js"));
var message_1 = require("./lib/message");
var verify_1 = __importDefault(require("./lib/verify"));
var report_1 = __importDefault(require("./lib/report"));
require("./lib/handlers");
require("./lib/command");
var token = process.env.token || require("../config").token;
var client = new discord_js_1.default.Client();
exports.client = client;
client.on("ready", function () {
    console.log("vexbot#0599 is online!");
    client.user.setPresence({
        game: new discord_js_1.default.Game({
            name: "over the server",
            type: 3
        })
    });
});
client.on("message", message_1.handleMessage);
client.on("guildMemberAdd", verify_1.default);
client.on("error", report_1.default);
client.login(token);
