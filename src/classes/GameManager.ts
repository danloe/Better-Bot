import { CommandInteraction, Snowflake, User } from 'discord.js';
import BetterClient from '../client';
import { GameLobby } from './GameLobby';
import { TTTGame } from './TTTGame';
import { FourWinsGame } from './FourWinsGame';
import { TriviaGame } from './TriviaGame';
import { FindTheEmojiGame } from './FindTheEmojiGame';

export class GameManager {
    client: BetterClient;
    games: Map<Snowflake, GameLobby> = new Map<Snowflake, GameLobby>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    createLobby(gameType: GameType, interaction: CommandInteraction, host: User, minPlayers = 1, maxPlayers = 1) {
        return new Promise<GameLobby>(async (done, error) => {
            try {
                let lobby = this.games.get(host.id);
                if (lobby) {
                    error('You have created a game lobby already!');
                    return;
                }
                switch (gameType) {
                    case GameType.TicTacToe:
                        lobby = new TTTGame(this.client, host, interaction.channel!);
                        break;
                    case GameType.FourWins:
                        lobby = new FourWinsGame(this.client, host, interaction.channel!);
                        break;
                    case GameType.Trivia:
                        lobby = new TriviaGame(this.client, host, interaction.channel!, maxPlayers);
                        break;
                    case GameType.FindTheEmoji:
                        lobby = new FindTheEmojiGame(this.client, host, interaction.channel!, maxPlayers);
                        break;
                }
                this.games.set(host.id, lobby!);
                done(lobby!);
            } catch (err) {
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
    FourWins,
    Trivia,
    FindTheEmoji
}
