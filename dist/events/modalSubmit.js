"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
exports.event = {
    name: "modalSubmit",
    run: async (client, modal) => {
        if (modal.customId === "modal-play") {
            const input = modal.getTextInputValue("input");
            //play input
            modal.reply(discord_js_1.Formatters.codeBlock("markdown", input));
        }
    },
};
//# sourceMappingURL=modalSubmit.js.map