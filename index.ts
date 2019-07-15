/*
Copyright (c) 2019 Daniel A. Hawton <daniel@hawton.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const config: Config = require("./config.json");
const rcon: any = require("rcon");
import { exec } from "child_process";

interface StringMap {
  [s: string]: any;
}

interface Config {
  servers: {
    [key: string]: Server;
  };
  gitpull: string;
}

interface Server {
  name: string;
  hostname: string;
  port: number;
  password: string;
  shutdown: string;
  start: string;
}

const argv = process.argv.slice(2);
let shutdown: boolean = argv[0] === "shutdown" ? true : false;
let restart: boolean = argv[0] === "restart" ? true : false;
let start: boolean = argv[0] === "start" ? true : false;
let now: boolean = argv.includes("now") ? true : false;
const conns: StringMap = {};

if (shutdown || restart) {
  Object.keys(config.servers).map((v: string) => {
    let s = config.servers[v];
    conns[s.name] = new rcon(s.hostname, s.port, s.password, { tcp: true });
    conns[s.name].connect();
  });
}

let timeLeft = now ? 0 : 3 * 60;

const procShutdown = () => {
  if (timeLeft > 0) {
    if (timeLeft % 60 === 0) {
      Object.keys(conns).map(v => {
        conns[v].send(
          `shutdown The world will end in ${timeLeft /
            60} minutes. Seek shelter now!`
        );
      });
    }
    timeLeft -= 1;
  } else {
    Object.keys(config.servers).map((v: string) => {
      exec(config.servers[v].shutdown);
    });
    if (restart) setTimeout(procStartup, 5000);
  }
};

const procStartup = () => {
  Object.keys(config.servers).map((v: string) => {
    exec(config.servers[v].start);
  });
};

if (shutdown || restart) setTimeout(procShutdown, 1000);
else if (start) procStartup();
else console.error("Invalid syntax");
