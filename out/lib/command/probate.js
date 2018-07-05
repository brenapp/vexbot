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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var message_1 = require("../message");
function probate(user, length, by, reason) {
    return __awaiter(this, void 0, void 0, function () {
        var probation, dm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    probation = user.guild.roles.find("name", "Probation");
                    return [4, user.createDM()];
                case 1:
                    dm = _a.sent();
                    dm.send("You've been put on probation by " + by + " for " + length.time + " for the reason: " + reason);
                    dm.send("While you are in probation, you cannot post messages in any channel, or speak in any voice channel. If you believe this was in error, you can appeal this in " + user.guild.channels.find("name", "appeals"));
                    user.addRole(probation);
                    setTimeout(function () {
                        user.removeRole(probation);
                        dm.send("Your probation has been lifted! You are now permitted to post again. Please remember, repeat offences will be more likely to lead to a ban");
                    }, length.ms);
                    return [2];
            }
        });
    });
}
function parseTime(time) {
    var units = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };
    var _a = [+time.slice(0, -1), time.slice(-1)], number = _a[0], unit = _a[1];
    if (units[unit]) {
        return { ms: number * units[unit], time: time };
    }
    else {
        return null;
    }
}
message_1.addMessageHandler(function (message) { return __awaiter(_this, void 0, void 0, function () {
    var admin, author, users, time_1;
    return __generator(this, function (_a) {
        if (!message.content.toLowerCase().startsWith("!probate"))
            return [2, false];
        admin = message.guild.roles.find("name", "Admins"), author = message.member;
        if (admin && author.roles.has(admin.id)) {
            users = message.mentions.members;
            time_1 = parseTime(message.content
                .split("for")[0]
                .split(" ")
                .slice(-2)[0]);
            if (!time_1) {
                message.reply("Unknown time quantity");
            }
            else {
                users.forEach(function (user) {
                    console.log("Probate " + user.displayName + " for " + time_1.time);
                    probate(user, time_1, message.member, message.content.split("for ")[1]);
                });
            }
        }
        else {
            message.reply("You're not permitted to do that!");
            probate(message.member, parseTime("30s"), message.guild.me, "Unauthorized use of !probate");
        }
        return [2, true];
    });
}); });
