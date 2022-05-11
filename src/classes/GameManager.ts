import { CommandInteraction, Snowflake, User } from 'discord.js';
import BetterClient from '../client';
import { GameLobby } from './GameLobby';

export class GameManager {
    client: BetterClient;
    games: Map<Snowflake, GameLobby> = new Map<Snowflake, GameLobby>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    createTTTLobby(interaction: CommandInteraction, host: User) {
        return new Promise<GameLobby>(async (done, error) => {
            try {
                let lobby = this.games.get(host.id);
                if (lobby) {
                    error('You have created a game lobby already!');
                    return;
                }
                lobby = new GameLobby(GameType.TTT, host, interaction.channel, 2, 2);
                this.games.set(host.id, lobby);
                done(lobby);
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    destroyLobby(host: User) {
        this.games.delete(host.id);
    }
}

export enum GameType {
    TTT
}
