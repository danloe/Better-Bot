import { ActivityTypes } from 'discord.js/typings/enums';
import BetterClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'ready',
    run: async (client: BetterClient) => {
        client.user!.setPresence({
            activities: [{ name: '🦄', type: ActivityTypes.WATCHING }],
            status: 'dnd'
        });

        console.log(`${client.user!.tag} is ready.`);
    }
};
