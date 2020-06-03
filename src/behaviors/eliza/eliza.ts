// @ts-nocheck

import {
  elizaKeywords,
  elizaSynons,
  elizaPres,
  elizaPosts,
  elizaFinals,
  elizaInitials,
  elizaPostTransforms,
  elizaQuits,
} from "./data";

export default class ElizaBot {
  noRandom: boolean;
  capitalizeFirstLetter: boolean;
  debug: boolean;
  memSize: number;
  version: string;
  quit = false;

  synPatterns: {};

  mem: any[];
  lastchoice: number[][];

  _dataParsed: boolean;

  pres: {};
  preExp: RegExp;
  posts: {};
  postExp: RegExp;

  sentence: string;

  constructor(noRandomFlag: boolean) {
    this.noRandom = noRandomFlag ? true : false;
    this.capitalizeFirstLetter = true;
    this.debug = false;
    this.memSize = 20;
    this.version = "1.2 (TypeScript Rewrite)";
    this.synPatterns = {};
    this.pres = {};
    this.posts = {};

    if (!this._dataParsed) this._init();
    this.reset();
  }

  reset() {
    this.quit = false;
    this.mem = [];
    this.lastchoice = [];
    for (let k = 0; k < elizaKeywords.length; k++) {
      this.lastchoice[k] = [];
      const rules = elizaKeywords[k][2] as any;
      for (let i = 0; i < rules.length; i++) this.lastchoice[k][i] = -1;
    }
  }

  _init() {
    // parse data and convert it from canonical form to internal use
    // Produce synonym list
    for (const x in elizaSynons)
      this.synPatterns[x] = "(" + x + "|" + elizaSynons[x].join("|") + ")";

    // 1st convert rules to regexps
    // expand synonyms and insert asterisk expressions for backtracking
    const sre = /@(\S+)/;
    const are = /(\S)\s*\*\s*(\S)/;
    const are1 = /^\s*\*\s*(\S)/;
    const are2 = /(\S)\s*\*\s*$/;
    const are3 = /^\s*\*\s*$/;
    const wsre = /\s+/g;

    for (let k = 0; k < elizaKeywords.length; k++) {
      const rules = elizaKeywords[k][2] as any;
      elizaKeywords[k][3] = k; // save original index for sorting
      for (var i = 0; i < rules.length; i++) {
        const r = rules[i];
        // check mem flag and store it as decomp's element 2
        if (r[0].charAt(0) == "$") {
          let ofs = 1;
          while (r[0].charAt[ofs] == " ") ofs++;
          r[0] = r[0].substring(ofs);
          r[2] = true;
        } else {
          r[2] = false;
        }
        // expand synonyms (v.1.1: work around lambda function)
        let m = sre.exec(r[0]);
        while (m) {
          const sp = this.synPatterns[m[1]] ? this.synPatterns[m[1]] : m[1];
          r[0] =
            r[0].substring(0, m.index) +
            sp +
            r[0].substring(m.index + m[0].length);
          m = sre.exec(r[0]);
        }
        // expand asterisk expressions (v.1.1: work around lambda function)
        if (are3.test(r[0])) {
          r[0] = "\\s*(.*)\\s*";
        } else {
          m = are.exec(r[0]);
          if (m) {
            var lp = "";
            let rp = r[0];
            while (m) {
              lp += rp.substring(0, m.index + 1);
              if (m[1] != ")") lp += "\\b";
              lp += "\\s*(.*)\\s*";
              if (m[2] != "(" && m[2] != "\\") lp += "\\b";
              lp += m[2];
              rp = rp.substring(m.index + m[0].length);
              m = are.exec(rp);
            }
            r[0] = lp + rp;
          }
          m = are1.exec(r[0]);
          if (m) {
            var lp = "\\s*(.*)\\s*";
            if (m[1] != ")" && m[1] != "\\") lp += "\\b";
            r[0] = lp + r[0].substring(m.index - 1 + m[0].length);
          }
          m = are2.exec(r[0]);
          if (m) {
            let lps = r[0].substring(0, m.index + 1);
            if (m[1] != "(") lps += "\\b";
            r[0] = lps + "\\s*(.*)\\s*";
          }
        }
        // expand white space
        r[0] = r[0].replace(wsre, "\\s+");
        wsre.lastIndex = 0;
      }
    }

    // now sort keywords by rank (highest first)
    elizaKeywords.sort(this._sortKeywords);

    // and compose regexps and refs for pres and posts
    const a = [];
    for (var i = 0; i < elizaPres.length; i += 2) {
      a.push(elizaPres[i]);
      this.pres[elizaPres[i]] = elizaPres[i + 1];
    }
    this.preExp = new RegExp("\\b(" + a.join("|") + ")\\b");

    const b = [];
    for (var i = 0; i < elizaPosts.length; i += 2) {
      b.push(elizaPosts[i]);
      this.posts[elizaPosts[i]] = elizaPosts[i + 1];
    }
    this.postExp = new RegExp("\\b(" + b.join("|") + ")\\b");

    // done
    this._dataParsed = true;
  }

  _sortKeywords = function(a, b) {
    // sort by rank
    if (a[1] > b[1]) return -1;
    else if (a[1] < b[1]) return 1;
    // or original index
    else if (a[3] > b[3]) return 1;
    else if (a[3] < b[3]) return -1;
    else return 0;
  };

  transform(text: string) {
    let rpl = "";
    this.quit = false;
    // unify text string
    text = text.toLowerCase();
    text = text.replace(/@#\$%\^&\*\(\)_\+=~`\{\[\}\]\|:;<>\/\\\t/g, " ");
    text = text.replace(/\s+-+\s+/g, ".");
    text = text.replace(/\s*[,\.\?!;]+\s*/g, ".");
    text = text.replace(/\s*\bbut\b\s*/g, ".");
    text = text.replace(/\s{2,}/g, " ");
    // split text in part sentences and loop through them
    const parts = text.split(".");
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (part != "") {
        // check for quit expression
        for (let q = 0; q < elizaQuits.length; q++) {
          if (elizaQuits[q] == part) {
            this.quit = true;
            return this.getFinal();
          }
        }
        // preprocess (v.1.1: work around lambda function)
        let m = this.preExp.exec(part);
        if (m) {
          let lp = "";
          let rp = part;
          while (m) {
            lp += rp.substring(0, m.index) + this.pres[m[1]];
            rp = rp.substring(m.index + m[0].length);
            m = this.preExp.exec(rp);
          }
          part = lp + rp;
        }
        this.sentence = part;
        // loop trough keywords
        for (var k = 0; k < elizaKeywords.length; k++) {
          if (
            part.search(new RegExp("\\b" + elizaKeywords[k][0] + "\\b", "i")) >=
            0
          ) {
            rpl = this._execRule(k);
          }
          if (rpl != "") return rpl;
        }
      }
    }
    // nothing matched try mem
    rpl = this._memGet();
    // if nothing in mem, so try xnone
    if (rpl == "") {
      this.sentence = " ";
      var k = this._getRuleIndexByKey("xnone");
      if (k >= 0) rpl = this._execRule(k);
    }
    // return reply or default string

    const defaults = [
      "I am at a loss for words.",
      "Keep Going?",
      "Yeah?",
      "Tell me more.",
      "Oh?",
    ];
    const str = defaults[(defaults.length * Math.random()) | 0];

    return rpl != "" ? rpl : str;
  }

  _execRule(k: number) {
    const rule = elizaKeywords[k];
    const decomps = rule[2] as any;
    const paramre = /\(([0-9]+)\)/;
    for (let i = 0; i < decomps.length; i++) {
      const m = this.sentence.match(decomps[i][0]);
      if (m != null) {
        const reasmbs = decomps[i][1];
        const memflag = decomps[i][2];
        let ri = this.noRandom ? 0 : Math.floor(Math.random() * reasmbs.length);
        if (
          (this.noRandom && this.lastchoice[k][i] > ri) ||
          this.lastchoice[k][i] == ri
        ) {
          ri = ++this.lastchoice[k][i];
          if (ri >= reasmbs.length) {
            ri = 0;
            this.lastchoice[k][i] = -1;
          }
        } else {
          this.lastchoice[k][i] = ri;
        }
        let rpl = reasmbs[ri];
        if (rpl.search("^goto ", "i") == 0) {
          const ki = this._getRuleIndexByKey(rpl.substring(5));
          if (ki >= 0) return this._execRule(ki);
        }
        // substitute positional params (v.1.1: work around lambda function)
        let m1 = paramre.exec(rpl);
        if (m1) {
          let lp = "";
          let rp = rpl;
          while (m1) {
            let param = m[parseInt(m1[1])];
            // postprocess param
            let m2 = this.postExp.exec(param);
            if (m2) {
              let lp2 = "";
              let rp2 = param;
              while (m2) {
                lp2 += rp2.substring(0, m2.index) + this.posts[m2[1]];
                rp2 = rp2.substring(m2.index + m2[0].length);
                m2 = this.postExp.exec(rp2);
              }
              param = lp2 + rp2;
            }
            lp += rp.substring(0, m1.index) + param;
            rp = rp.substring(m1.index + m1[0].length);
            m1 = paramre.exec(rp);
          }
          rpl = lp + rp;
        }
        rpl = this._postTransform(rpl);
        if (memflag) this._memSave(rpl);
        else return rpl;
      }
    }
    return "";
  }

  _postTransform(s: string) {
    // final cleanings
    s = s.replace(/\s{2,}/g, " ");
    s = s.replace(/\s+\./g, ".");
    for (let i = 0; i < elizaPostTransforms.length; i += 2) {
      s = s.replace(
        elizaPostTransforms[i],
        (elizaPostTransforms as any)[i + 1]
      );
      (elizaPostTransforms[i] as any).lastIndex = 0;
    }
    // capitalize first char (v.1.1: work around lambda function)
    if (this.capitalizeFirstLetter) {
      const re = /^([a-z])/;
      const m = re.exec(s);
      if (m) s = m[0].toUpperCase() + s.substring(1);
    }
    return s;
  }

  _getRuleIndexByKey = function(key: any) {
    for (let k = 0; k < elizaKeywords.length; k++) {
      if (elizaKeywords[k][0] == key) return k;
    }
    return -1;
  };

  _memSave = function(t) {
    this.mem.push(t);
    if (this.mem.length > this.memSize) this.mem.shift();
  };

  _memGet = function() {
    if (this.mem.length) {
      if (this.noRandom) return this.mem.shift();
      else {
        const n = Math.floor(Math.random() * this.mem.length);
        const rpl = this.mem[n];
        for (let i = n + 1; i < this.mem.length; i++)
          this.mem[i - 1] = this.mem[i];
        this.mem.length--;
        return rpl;
      }
    } else return "";
  };

  getFinal = function() {
    return elizaFinals[Math.floor(Math.random() * elizaFinals.length)];
  };

  getInitial = function() {
    return elizaInitials[Math.floor(Math.random() * elizaInitials.length)];
  };
}
