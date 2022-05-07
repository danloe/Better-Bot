import { Event } from "../interfaces";
import Client from "../client";
import { ModalSubmitInteraction } from "discord-modals";
import { Formatters } from "discord.js";

export const event: Event = {
  name: "modalSubmit",
  run: async (client: Client, modal: ModalSubmitInteraction) => {
    if (modal.customId === "modal-customid") {
      const firstResponse = modal.getTextInputValue("textinput-customid1");
      modal.reply(Formatters.codeBlock("markdown", firstResponse));
    }
  },
};
