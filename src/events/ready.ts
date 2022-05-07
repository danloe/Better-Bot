import { ActivityTypes } from "discord.js/typings/enums";
import Client from "../client";
import { Event } from "../interfaces";

export const event: Event = {
  name: "ready",
  run: async (client: Client) => {
    client.user!.setPresence({
      activities: [{ name: "🦄", type: ActivityTypes.WATCHING }],
      status: "dnd",
    });

    console.log(`${client.user!.tag} is ready.`);
  },
};
