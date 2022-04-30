"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const builders_1 = require("@discordjs/builders");
exports.command = {
    data: new builders_1.SlashCommandBuilder()
        .setName("help")
        .setDescription("You need a hand?"),
    run: async (interaction, message, args) => {
        if (interaction) {
            interaction.reply({
                content: `${interaction.user.username}\n` +
                    "__Music Commands:__\n" +
                    "(`q`) `queue`\n" +
                    "(`p`) `play [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                    "(`sp`) `silent play. Same function as play but without announcement.`\n" +
                    "(`ps`) `play skip [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                    "(`pn`) `play next [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                    "(`s`) `skip`\n" +
                    //"(`res`) `resume`  -> resume playing with next track\n" +
                    "(`n`) `next [position]`\n" +
                    "(`r`) `remove [position] [position]...`\n" +
                    "(`c`) `clear`\n" +
                    "`stop` / `disconnect`\n\n" +
                    "__Other Commands:__\n" +
                    "`say (english) phrase`\n" +
                    "`sag (deutsch) Phrase`\n" +
                    "`zeg (nederlands) zin`\n" +
                    "`dites (francais) phrase`\n" +
                    "`uptime`\n" +
                    "`roast @name/me`\n" +
                    "`coin [side1] [side2]`\n" +
                    "`decide option1 option2 [option3] [...]`\n" +
                    "`ping`\n" +
                    "`8ball question`\n",
                ephemeral: true,
            });
        }
        if (message) {
            message.reply(`${message.author}\n` +
                "__Music Commands:__\n" +
                "(`q`) `queue`\n" +
                "(`p`) `play [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                "(`sp`) `silent play. Same function as play but without announcement.`\n" +
                "(`ps`) `play skip [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                "(`pn`) `play next [youtube search / youtube, soundcloud, newgrounds url / url to any audio file]`\n" +
                "(`s`) `skip`\n" +
                //"(`res`) `resume`  -> resume playing with next track\n" +
                "(`n`) `next [position]`\n" +
                "(`r`) `remove [position] [position]...`\n" +
                "(`c`) `clear`\n" +
                "`stop` / `disconnect`\n\n" +
                "__Other Commands:__\n" +
                "`say (english) phrase`\n" +
                "`sag (deutsch) Phrase`\n" +
                "`zeg (nederlands) zin`\n" +
                "`dites (francais) phrase`\n" +
                "`uptime`\n" +
                "`roast @name/me`\n" +
                "`coin [side1] [side2]`\n" +
                "`decide option1 option2 [option3] [...]`\n" +
                "`ping`\n" +
                "`8ball question`\n");
        }
    },
};
//# sourceMappingURL=help.js.map