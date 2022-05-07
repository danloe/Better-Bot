import { ActivityTypes } from "discord.js/typings/enums";
import Client from "../client";
import { Event } from "../interfaces";

export const event: Event = {
  name: "ready",
  run: async (client: Client) => {
    client.user!.setPresence({
      activities: [{ name: "PEW POW!", type: ActivityTypes.COMPETING }],
      status: "online",
    });

    console.log(`${client.user!.tag} is ready.`);
  },
};
