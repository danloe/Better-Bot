"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
exports.event = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        console.log(`${interaction.user.tag} triggered an interaction.${interaction.isCommand() ? " [" + interaction.commandName + "]" : ""}`);
        // COMMAND
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName) ||
                client.aliases.get(interaction.commandName);
            if (!command)
                return;
            try {
                command.run(interaction);
            }
            catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
        // BUTTON
        else if (interaction.isButton()) {
            try {
                // TODO
            }
            catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
        // SELECT MENU
        else if (interaction.isSelectMenu()) {
            try {
                // TODO
            }
            catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
        else {
            return;
        }
    },
};
//# sourceMappingURL=interactionCreate.js.map