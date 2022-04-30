import Client from "../client";
import { Event } from "../interfaces";

export const event: Event = {
  name: "ready",
  run: async (client: Client) => {
    console.log(`${client.user!.tag} is ready.`);
  },
};
