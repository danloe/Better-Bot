"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const discord_js_1 = require("discord.js");
exports.event = {
    name: "modalSubmit",
    run: async (client, modal) => {
        if (modal.customId === "modal-customid") {
            const firstResponse = modal.getTextInputValue("textinput-customid1");
            modal.reply(discord_js_1.Formatters.codeBlock("markdown", firstResponse));
        }
    },
};
//# sourceMappingURL=modalSubmit.js.map