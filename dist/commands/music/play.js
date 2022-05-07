"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
const discord_modals_1 = require("discord-modals");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("p")
        .setDescription("Play or Queue a Song.")
        .addStringOption(option => option.setName('input')
        .setDescription('URL to a File or Search Text')
        .setRequired(false)),
    run: async (interaction, message, args) => {
        if (interaction) {
            const input = interaction.options.getString("input");
            if (input) { //validate input
            }
            else { //open modal
                const modal = new discord_modals_1.Modal()
                    .setCustomId("modal-play")
                    .setTitle("Play or queue media.")
                    .addComponents(new discord_modals_1.TextInputComponent()
                    .setCustomId("input")
                    .setLabel("YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗")
                    .setStyle("SHORT")
                    .setPlaceholder("URL or Search Text...")
                    .setRequired(true));
                (0, discord_modals_1.showModal)(modal, {
                    client: interaction.client,
                    interaction: interaction,
                });
            }
        }
        if (message) {
            //message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
        }
    },
};
//# sourceMappingURL=play.js.map