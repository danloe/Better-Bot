"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const config_json_1 = __importDefault(require("../config.json"));
const discord_modals_1 = __importDefault(require("discord-modals"));
class ExtendedClient extends discord_js_1.Client {
    commands = new discord_js_1.Collection();
    aliases = new discord_js_1.Collection();
    events = new discord_js_1.Collection();
    config = config_json_1.default;
    async init() {
        (0, discord_modals_1.default)(this);
        this.login(process.env.BOT_TOKEN);
        //connect(process.env.MONGO_URI);
        // Commands
        const commandPath = path_1.default.join(__dirname, "..", "commands");
        (0, fs_1.readdirSync)(commandPath).forEach((dir) => {
            const commands = (0, fs_1.readdirSync)(`${commandPath}\\${dir}`).filter((file) => file.endsWith(".ts"));
            for (const file of commands) {
                const { command } = require(`${commandPath}\\${dir}\\${file}`);
                this.commands.set(command.data.name, command);
                if (command?.aliases?.length) {
                    command.aliases.forEach((alias) => {
                        this.aliases.set(alias, command);
                    });
                }
            }
        });
        // Events
        const eventPath = path_1.default.join(__dirname, "..", "events");
        (0, fs_1.readdirSync)(eventPath).forEach(async (file) => {
            const { event } = await Promise.resolve().then(() => __importStar(require(`${eventPath}/${file}`)));
            this.events.set(event.name, event);
            //console.log(event);
            this.on(event.name, event.run.bind(null, this));
        });
    }
}
exports.default = ExtendedClient;
//# sourceMappingURL=index.js.map