import { ClientPresenceStatus, ExcludeEnum, PresenceStatusData } from 'discord.js';
import { ActivityTypes } from 'discord.js/typings/enums';
import BetterClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'ready',
    run: async (client: BetterClient) => {
        client.user!.setPresence({
            activities: [{name: client.config.activityName, type: <ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>>client.config.activityType}],
            status: <ClientPresenceStatus>client.config.status
        });

        console.log(`${client.user!.tag} is ready.`);
    }
};
