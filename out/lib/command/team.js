"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var vexdb_1 = require("vexdb");
message_1.addCommand("team", function (args, message) { return __awaiter(_this, void 0, void 0, function () {
    var team, record, events, _a, _b;
    var _this = this;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                team = args[0];
                if (!team) {
                    message.reply("You didn't specify a team! Usage: `!team YNOT` or `!team 3796B`");
                    return [2, true];
                }
                return [4, vexdb_1.get("teams", { team: team }).then(function (res) { return res[0]; })];
            case 1:
                record = _c.sent();
                if (!record) {
                    message.reply("There doesn't appear to be a team with that number!");
                    return [2, true];
                }
                _b = (_a = Promise).all;
                return [4, vexdb_1.get("events", { team: team })];
            case 2: return [4, _b.apply(_a, [(_c.sent()).map(function (event) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _a = [{}, event];
                                    _b = {};
                                    return [4, vexdb_1.get("awards", { team: team, sku: event.sku })];
                                case 1:
                                    _b.awards = _c.sent();
                                    return [4, vexdb_1.get("rankings", { team: team, sku: event.sku })];
                                case 2: return [2, (__assign.apply(void 0, _a.concat([(_b.ranking = (_c.sent())[0], _b)])))];
                            }
                        });
                    }); })])];
            case 3:
                events = _c.sent();
                message.channel.send({
                    embed: {
                        color: 3447003,
                        title: record.team_name + " (" + record.number + ")",
                        url: "https://vexdb.io/teams/view/" + record.number,
                        description: (record.program == "VEXU" ? "VEXU" : record.grade) + " Team @ " + record.organisation + " (" + record.city + ", " + record.region + ")",
                        fields: events.map(function (event) { return ({
                            name: event.name,
                            value: (event.ranking ? "Ranked #" + event.ranking.rank : "Unranked") + ". " + event.awards.map(function (award) { return award.name.split(" (")[0]; }).join(", ")
                        }); }),
                        timestamp: new Date(),
                        footer: {
                            icon_url: message.author.avatarURL,
                            text: "Invoked by " + message.member.displayName
                        }
                    }
                });
                return [2];
        }
    });
}); });
