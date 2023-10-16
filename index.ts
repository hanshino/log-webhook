import fs from "fs";
import path from "path";
import readline from "readline";
import { md5 } from "./lib";
import config from "./config.json";
import axios from "axios";
import { Discord, IWebhook } from "./src/webhooks";
import { chunk } from "lodash";

axios.defaults.timeout = 1000;

const waitListMessages: string[] = [];

interface IConfig {
  webhook: {
    type: string;
    url: string;
  };
  triggers: ITrigger[];
}

interface ITrigger {
  regex: string;
  message: string;
  type: string;
}

interface IOptions {
  start: number;
}

const cwd = process.cwd();
const filename = process.env["FILENAME"];

if (!filename) {
  throw new Error("Filename not provided");
}

const filepath = path.join(cwd, filename);
const cursorFilepath = path.join(cwd, `${filename}.cursor`);

function createWebhook(webhook: IConfig["webhook"]): IWebhook {
  switch (webhook.type) {
    case "discord":
      return new Discord({ url: webhook.url, axios });
    default:
      throw new Error(`Unknown webhook type: ${webhook.type}`);
  }
}

function processLine(line: string) {
  const { triggers } = config as IConfig;

  for (const trigger of triggers) {
    const regex = new RegExp(trigger.regex);
    const match = line.match(regex);

    if (match) {
      // message contains the index of the capture group
      // replace it with the actual value
      // and match will be an array of strings
      // replace all the capture groups with their values
      // template: "Hello {$1}, you are {$2} years old"
      // match: ["Hello {$1}, you are {$2} years old", "John", "20"]
      // result: "Hello John, you are 20 years old"
      const message = trigger.message.replace(/\{\$(\d+)\}/g, (_, index) => {
        return match[Number(index)];
      });

      waitListMessages.push(message);
    }
  }
}

function stackProcessedLines(stack: number, line: string) {
  // +1 for the newline character
  return stack + line.length + 1;
}

function linesReader(filepath: string, options: IOptions) {
  const stream = fs.createReadStream(filepath, {
    encoding: "utf-8",
    start: options.start,
  });
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  return rl;
}

function readStackInfo() {
  const content = fs.readFileSync(cursorFilepath, {
    encoding: "utf-8",
    flag: "a+",
  });
  const [stack = "0", lineMD5 = ""] = content.split(",");
  return { stack: Number(stack), md5: lineMD5 };
}

function saveStackInfo(stack: number, line: string) {
  fs.writeFileSync(cursorFilepath, `${stack},${md5(line)}\n`);
}

async function initialize(offset: number = 0) {
  const rl = linesReader(filepath, { start: offset });
  let stack = 0 + offset;

  for await (const line of rl) {
    stack = stackProcessedLines(stack, line);
    processLine(line);
    saveStackInfo(stack, line);
  }
}

async function run() {
  // the offset is the number of bytes to skip before starting to read
  const stackInfo = readStackInfo();
  await initialize(stackInfo.stack);

  const webhook = createWebhook(config.webhook);
  const queue = waitListMessages.slice();
  waitListMessages.length = 0;

  const parts = chunk(queue, 10);
  for (const part of parts) {
    const message = part.join("\n");
    await webhook.send(message);
  }

  setTimeout(run, 5000);
}

run();
