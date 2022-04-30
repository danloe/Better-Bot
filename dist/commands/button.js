"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
// const wait = require('node:timers/promises').setTimeout;
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('button')
        .setDescription('Replies with Pong!'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = new discord_js_1.MessageActionRow()
                .addComponents(new discord_js_1.MessageButton()
                .setCustomId('ping')
                .setLabel('Ping! 🏓')
                .setStyle('PRIMARY'));
            yield interaction.reply({ content: ' ', components: [row] });
        });
    },
};
