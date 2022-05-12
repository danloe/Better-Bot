import { CommandInteraction, Snowflake, User } from 'discord.js';
import BetterClient from '../client';
import { GameLobby } from './GameLobby';
import { TTTGame } from './TTTGame';
import { FourWinsGame } from './FourWinsGame';

export class GameManager {
    client: BetterClient;
    games: Map<Snowflake, GameLobby> = new Map<Snowflake, GameLobby>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    createLobby(gameType: GameType, interaction: CommandInteraction, host: User) {
        return new Promise<GameLobby>(async (done, error) => {
            try {
                let lobby = this.games.get(host.id);
                if (lobby) {
                    error('You have created a game lobby already!');
                    return;
                }
                switch (gameType) {
                    case GameType.TicTacToe:
                        lobby = new TTTGame(host, interaction.channel!);
                        break;
                    case GameType.FourWins:
                        lobby = new FourWinsGame(host, interaction.channel!);
                        break;
                }
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
    TicTacToe,
    FourWins
}
