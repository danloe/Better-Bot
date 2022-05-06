"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const path_1 = __importDefault(require("path"));
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commands = [];
const commandPath = path_1.default.join(__dirname, "..", "commands");
(0, node_fs_1.readdirSync)(commandPath).forEach((dir) => {
    const dirs = (0, node_fs_1.readdirSync)(`${commandPath}\\${dir}`).filter((file) => file.endsWith(".ts"));
    for (const file of dirs) {
        const { command } = require(`${commandPath}\\${dir}\\${file}`);
        const regex = new RegExp("^[-_p{L}p{N}p{sc=Deva}p{sc=Thai}]{1,32}$");
        if (!regex.test(command.data.name)) {
            console.log("Command failed regex check:", command);
            //continue;
        }
        commands.push(command.data.toJSON());
    }
});
console.log("🚀 ~ file: g2.ts ~ line 31 ~ commands", commands);
const rest = new rest_1.REST({ version: "9" }).setToken(process.env.BOT_TOKEN);
rest
    .put(v9_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD2_ID), { body: commands })
    .then(() => console.log("Successfully registered guild commands."))
    .catch(console.error);
//# sourceMappingURL=g2.js.map