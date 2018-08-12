"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var prompt_1 = require("./prompt");
var message_1 = require("./message");
var vexdb = __importStar(require("vexdb"));
var discord_js_1 = require("discord.js");
var main_1 = require("../main");
function findOrMakeRole(name, guild) {
    var role = guild.roles.find("name", name);
    return role
        ? Promise.resolve(role)
        : guild.createRole({ name: name, mentionable: true });
}
function verify(member, welcomeChannel, approveChannel) {
    var _this = this;
    if (!approveChannel) {
        approveChannel = member.guild.channels.get("478064021136998401");
    }
    member.createDM().then(function (channel) { return __awaiter(_this, void 0, void 0, function () {
        var verification, _a, _b, _c, team, roles, teamRole, embed;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    verification = {
                        name: "",
                        team: "",
                        role: ""
                    };
                    channel.send("Welcome to VEX Teams of South Carolina!");
                    channel.send("In order to participate, you'll need to verify some basic information with us.");
                    console.log("Get Name");
                    _a = verification;
                    return [4, prompt_1.question("What should we call you? *(First Name, Nickname, etc.)*", channel)];
                case 1:
                    _a.name = _d.sent();
                    _b = verification;
                    return [4, prompt_1.questionValidate("What team are you *primarily* a part of?", channel, function (team) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, vexdb.size("teams", { team: team })];
                                case 1: return [2, !!(_a.sent())];
                            }
                        }); }); }, "There doesn't appear to be a team with that number.")];
                case 2:
                    _b.team = _d.sent();
                    _c = verification;
                    return [4, prompt_1.choose("On your team, what role do you serve? *(Member, Alumni, Mentor)*", channel, [
                            ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
                            ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
                            ["MENTOR", "COACH", "ADVISOR"]
                        ])];
                case 3:
                    _c.role = _d.sent();
                    console.log("Verify " + member.user.username + "#" + member.user.discriminator, verification);
                    member.setNickname(verification.name + " | " + verification.team + " " + (verification.role === "ALUMNI" ? "ALUM" : ""), "Verification: Nickname");
                    return [4, vexdb.get("teams", { team: verification.team })];
                case 4:
                    team = (_d.sent())[0];
                    roles = ["310902227160137730"];
                    if (verification.role !== "ALUMNI") {
                        if (team.program == "VEXU") {
                            roles.push("377219725442154526");
                        }
                        else if (team.grade == "Middle School") {
                            roles.push("376489822598201347");
                        }
                        else {
                            roles.push("376489878700949515");
                        }
                    }
                    if (!(team.region === "South Carolina")) return [3, 6];
                    return [4, findOrMakeRole(verification.team, member.guild)];
                case 5:
                    teamRole = _d.sent();
                    roles.push(teamRole.id);
                    return [3, 7];
                case 6:
                    roles.push("387074517408808970");
                    _d.label = 7;
                case 7:
                    switch (verification.role) {
                        case "MEMBER":
                            break;
                        case "ALUMNI":
                            roles.push("329760448020873229");
                            break;
                        case "MENTOR":
                            roles.push("329760518334054402");
                            break;
                    }
                    embed = new discord_js_1.RichEmbed()
                        .setAuthor(member.user.username, member.user.avatarURL)
                        .setTitle("Member Verification")
                        .setDescription(member + " \n Requested Roles: " + roles
                        .map(function (role) { return member.guild.roles.get(role).toString(); })
                        .join(", "))
                        .addField("Verification Process", [
                        "This member is seeking verification",
                        "You can interact with them in " + member.guild.channels.find("name", "verification")
                    ])
                        .addField("Approving Members", "React with :thumbsup: to approve the member")
                        .addField("Deny and Kick", "If the member's verification violates rules or guidelines set by Admins, react with :thumbsdown:")
                        .setTimestamp();
                    approveChannel.send(embed).then(function (approval) { return __awaiter(_this, void 0, void 0, function () {
                        var collector, handleReaction;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    channel.send("You're all set! Your information is awaiting approval. Hang tight!");
                                    return [4, Promise.all([approval.react("👍"), approval.react("👎")])];
                                case 1:
                                    _a.sent();
                                    collector = approval.createReactionCollector(function (vote, usr) {
                                        return (vote.emoji.name === "👎" || vote.emoji.name === "👍") &&
                                            usr !== main_1.client.user;
                                    });
                                    collector.on("collect", (handleReaction = function (vote) {
                                        var approver = vote.users.last();
                                        if (vote.emoji.name === "👍") {
                                            member.addRoles(roles, "Verification: Roles");
                                            channel.send("You're all set up! Note that you can change your nickname at any time, but please keep it in the correct format");
                                            approval.edit(embed.addField("Outcome", "Approved by " + approver.toString()));
                                            if (welcomeChannel) {
                                                welcomeChannel.send("Welcome " + member + "!");
                                            }
                                            else {
                                                var channel_1 = member.guild.channels.find("name", "general");
                                                channel_1.send("Welcome " + member);
                                            }
                                            if (collector.off) {
                                                collector.off("collect", handleReaction);
                                            }
                                        }
                                        else {
                                            approval.edit(embed.addField("Outcome", "Denied and kicked by " + approver.toString()));
                                            member.kick("Verification Denied. Rejoin to try again!");
                                        }
                                        collector.emit("end");
                                        approval.clearReactions();
                                    }));
                                    collector.on("end", function () { });
                                    return [2];
                            }
                        });
                    }); });
                    return [2];
            }
        });
    }); });
}
message_1.addMessageHandler(function (message) {
    var activate = message.content.startsWith("!join") &&
        !(message.channel instanceof discord_js_1.DMChannel) &&
        !(message.channel instanceof discord_js_1.GroupDMChannel);
    if (activate) {
        verify(message.member, message.channel);
        return true;
    }
});
exports.default = verify;
message_1.addCommand("approve", function (args, message) {
    var awaiting = message.channel.send({
        embed: {
            author: {
                name: message.author.username,
                icon_url: message.author.avatarURL
            },
            title: message.member.displayName,
            description: message.member.roles
                .filter(function (role) { return role.name !== "@everyone"; })
                .map(function (role) { return role.toString(); })
                .join("\n"),
            fields: [
                {
                    name: "Team",
                    value: "3796B"
                },
                {
                    name: "Region",
                    value: "South Carolina"
                }
            ]
        }
    });
    return true;
});
