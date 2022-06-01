import chalk from 'chalk';
import { ClientPresenceStatus, ExcludeEnum, PresenceStatusData } from 'discord.js';
import { ActivityTypes } from 'discord.js/typings/enums';
import BotterinoClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'ready',
    run: async (client: BotterinoClient) => {
        client.user!.setPresence({
            activities: [
                {
                    name: client.config.activityName,
                    type: <ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>>client.config.activityType
                }
            ],
            status: <ClientPresenceStatus>client.config.status
        });

        client.logger.log(chalk.green(`${client.user!.tag} is ready.`));

        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY!.length < 30) {
            client.logger.warn(
                chalk.yellow(
                    `Google API Key seems to be missing! Functionalities limited. Add GOOGLE_API_KEY="YOURKEY" to .env file.`
                )
            );
        }
        if (
            !process.env.SPOTIFY_CLIENT_ID ||
            process.env.SPOTIFY_CLIENT_ID!.length < 30 ||
            !process.env.SPOTIFY_CLIENT_SECRET ||
            process.env.SPOTIFY_CLIENT_SECRET!.length < 30
        ) {
            client.logger.warn(
                chalk.yellow(
                    `Spotify Credentials seem to be missing! Functionalities limited. Add SPOTIFY_CLIENT_ID="YOURCLIENTID" & SPOTIFY_CLIENT_SECRET="YOURCLIENTSECRET" to .env file.`
                )
            );
        }
    }
};
