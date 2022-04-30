"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_modals_1 = require("discord-modals");
const builders_1 = require("@discordjs/builders");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("modal")
        .setDescription("Opens a modal form."),
    run: async (interaction, message, args) => {
        if (!interaction)
            return;
        const modal = new discord_modals_1.Modal()
            .setCustomId("modal-customid")
            .setTitle("Play music.")
            .addComponents(new discord_modals_1.TextInputComponent()
            .setCustomId("textinput-customid1")
            .setLabel("YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗")
            .setStyle("SHORT")
            .setPlaceholder("URL or Search Keywords...")
            .setRequired(true));
        (0, discord_modals_1.showModal)(modal, {
            client: interaction.client,
            interaction: interaction,
        });
    },
};
//# sourceMappingURL=modal.js.map