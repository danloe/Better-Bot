"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commands = [];
const commandFiles = node_fs_1.default.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}
const rest = new rest_1.REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
rest.put(v9_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD1_ID), { body: commands })
    .then(() => console.log('Successfully registered guild commands.'))
    .catch(console.error);
