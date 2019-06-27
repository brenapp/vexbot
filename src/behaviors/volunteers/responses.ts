import { google } from "googleapis";
import { sheets_v4 } from "googleapis/build/src/apis/sheets/v4";

const key = require("../../../config.json").google;

const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });
const ID = "1MQg8R6ANvP_9rwLgog2B81vFu-jbWm3Z5PEn_b0GUdE";

export default async function getResponses() {
  return sheets.spreadsheets.values
    .get({
      spreadsheetId: ID,
      range: "A2:Z"
    })
    .then(resp => (resp.data.values || []).map(r => new Response(r)));
}

export class Response {
  event: {
    name: string;
    sku: string;
    date: Date;
    location: string;
  } = { name: "", sku: "", date: new Date(), location: "string" };

  ep: {
    name: string;
    email: string;
    phone: string;
    eventPhone: string;
  } = { name: "", email: "", phone: "", eventPhone: "" };

  volunteers: {
    judges: number;
    referees: number;
    management: number;
  } = { judges: 0, referees: 0, management: 0 };

  constructor(response: string[]) {
    this.event.name = response[1];
    this.event.sku = response[2];
    this.event.date = new Date(Date.parse(response[3]));
    this.event.location = response[4];

    this.ep.name = response[5];
    this.ep.email = response[6];
    this.ep.phone = response[7];
    this.ep.eventPhone = response[8];

    this.volunteers.judges = Number.parseInt(response[9]);
    this.volunteers.referees = Number.parseInt(response[10]);
    this.volunteers.management = Number.parseInt(response[11]);
  }

  toJSON() {
    const { ep, event, volunteers } = this;
    return { ep, event, volunteers };
  }
}
