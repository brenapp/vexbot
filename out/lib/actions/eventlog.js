"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vexdb_1 = __importDefault(require("vexdb"));
var callcount = 0;
function now() {
    var start = 1520674200000;
    return new Date(start + callcount++ * 20 * 60 * 1000);
}
var events = ["RE-VRC-17-3161"];
var MatchLog = vexdb_1.default.live("matches", {
    sku: "RE-VRC-17-3161",
    scored: 1
});
MatchLog.on("item", function (match) { return console.log(match); });
MatchLog.on("fetch", function () { return console.log("fetch", MatchLog.current()); });
