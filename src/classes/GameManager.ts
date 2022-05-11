import { createErrorEmbed, replyDefer as deferReply, replyInteraction } from '../helpers';
import { ButtonInteraction, CommandInteraction, GuildMember, Snowflake, User } from 'discord.js';
import BetterClient from '../client';
import google from 'googlethis';
import { GameLobby } from './GameLobby';
const discordTTS = require('discord-tts');
//import discordTTS from 'discord-tts';

export class GameManager {
    client: BetterClient;
    games: Map<Snowflake, GameLobby> = new Map<Snowflake, GameLobby>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    createTTTLobby(interaction: CommandInteraction, game: GameType, host: User,) {
        this.games.set(host.id, new GameLobby(game, host, interaction.channel, 2, 2))
    }
}

export enum GameType {
        TTT,
}