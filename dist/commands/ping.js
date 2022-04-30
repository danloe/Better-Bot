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
const discord_modals_1 = require("discord-modals");
// const wait = require('node:timers/promises').setTimeout;
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // await interaction.deferReply();
            // await wait(4000);
            // await interaction.editReply('Pong! 🏓');
            const modal = new discord_modals_1.Modal()
                .setCustomId('modal-customid')
                .setTitle('Play music.')
                .addComponents(new discord_modals_1.TextInputComponent()
                .setCustomId('textinput-customid1')
                .setLabel('YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗')
                .setStyle('SHORT')
                .setPlaceholder('URL or Search Keywords...')
                .setRequired(true));
            (0, discord_modals_1.showModal)(modal, {
                client: interaction.client,
                interaction: interaction,
            });
        });
    },
};
