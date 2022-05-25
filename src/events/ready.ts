import { ClientPresenceStatus, ExcludeEnum, PresenceStatusData } from 'discord.js';
import { ActivityTypes } from 'discord.js/typings/enums';
import BetterClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'ready',
    run: async (client: BetterClient) => {
        client.user!.setPresence({
            activities: [
                {
                    name: client.config.activityName,
                    type: <ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>>client.config.activityType
                }
            ],
            status: <ClientPresenceStatus>client.config.status
        });

        console.log(`${client.user!.tag} is ready.`);

        if (process.env.GOOGLE_API_KEY!.length < 30) {
            console.log(`Google API Key seems to be missing! Functionalities limited.`);
        }
        if (process.env.SPOTIFY_CLIENT_ID!.length < 30 || process.env.SPOTIFY_CLIENT_SECRET!.length < 30) {
            console.log(`Spotify Credentials seems to be missing! Functionalities limited.`);
        }
    }
};
