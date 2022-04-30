"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const discord_js_1 = require("discord.js");
const discord_modals_1 = __importDefault(require("discord-modals"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// CLIENT
const client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS] });
(0, discord_modals_1.default)(client);
// COMMANDS
exports.commands = new discord_js_1.Collection();
const commandFiles = node_fs_1.default.readdirSync('./commands').filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    exports.commands.set(command.data.name, command);
}
// EVENTS
const eventFiles = node_fs_1.default.readdirSync('./events').filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
// LOGIN
client.login(process.env.BOT_TOKEN);
