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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var message_1 = require("../message");
var vexdb_1 = __importDefault(require("vexdb"));
message_1.addMessageHandler(function (message) { return __awaiter(_this, void 0, void 0, function () {
    var sku, event, divisionReport, awards, excellence, champions, _a, _b, _c, _d;
    var _this = this;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (!message.content.toLowerCase().startsWith("!event"))
                    return [2, false];
                sku = message.content.split(" ")[1];
                if (!sku) {
                    message.reply("No event SKU specified (Usage: `!event [sku]`)");
                    return [2, true];
                }
                return [4, vexdb_1.default.get("events", { sku: sku })];
            case 1:
                event = (_e.sent())[0];
                return [4, Promise.all(event.divisions.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                        var topSeed;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, vexdb_1.default.get("rankings", { sku: sku, division: name })];
                                case 1:
                                    topSeed = (_a.sent())[0]
                                        .team;
                                    return [2, {
                                            name: name,
                                            value: "Top Seed: " + topSeed
                                        }];
                            }
                        });
                    }); }))];
            case 2:
                divisionReport = _e.sent();
                return [4, vexdb_1.default.get("awards", { sku: sku })];
            case 3:
                awards = _e.sent();
                excellence = awards
                    .filter(function (a) { return a.name.includes("Excellence Award"); })
                    .map(function (a) { return a.team; });
                champions = awards
                    .filter(function (a) { return a.name.includes("Champions"); })
                    .map(function (a) { return a.team; });
                if (!event) {
                    message.reply("No event with that SKU (" + sku + ")");
                    return [2, true];
                }
                _b = (_a = message.channel).send;
                _c = {};
                _d = {
                    color: 3447003,
                    title: event.name,
                    url: "https://www.robotevents.com/robot-competitions/vex-robotics-competition/" + event.sku + ".html"
                };
                return [4, vexdb_1.default.size("teams", {
                        sku: sku
                    })];
            case 4:
                _b.apply(_a, [(_c.embed = (_d.description = (_e.sent()) + " Teams; Excellence: " + excellence.join(", ") + "; Champions: " + champions.join(", "),
                        _d.footer = {
                            icon_url: message.author.avatarURL,
                            text: "Trigged by " + message.author.username + "#" + message.author.discriminator
                        },
                        _d.timestamp = message.createdAt,
                        _d.fields = divisionReport,
                        _d),
                        _c)]);
                return [2];
        }
    });
}); });
