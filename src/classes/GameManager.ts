import { CommandInteraction, Snowflake, User } from 'discord.js';
import BotterinoClient from '../client';
import { GameLobby } from './GameLobby';
import { TTTGame } from './TTTGame';
import { FourWinsGame } from './FourWinsGame';
import { TriviaGame } from './TriviaGame';
import { FindTheEmojiGame } from './FindTheEmojiGame';
import { FastTyperGame } from './FastTyperGame';

export class GameManager {
    client: BotterinoClient;
    games: Map<Snowflake, GameLobby> = new Map<Snowflake, GameLobby>();

    constructor(client: BotterinoClient) {
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
                    case GameType.FastTyper:
                        lobby = new FastTyperGame(this.client, host, interaction.channel!, maxPlayers);
                        break;
                }
                this.games.set(host.id, lobby!);
                this.client.logger.info(`[${lobby!.name}: ${host.username}] lobby created`);
                done(lobby!);
            } catch (err) {
                error(err);
            }
        });
    }

    destroyLobby(host: User, gameLobby: GameLobby) {
        let lobby = this.games.get(host.id);
        if (lobby) {
            if (lobby.id == gameLobby.id) {
                this.client.logger.info(`[${lobby!.name}: ${host.username}] lobby destroyed`);
                this.games.delete(host.id);
            }
        }
    }
}

export enum GameType {
    TicTacToe,
    FourWins,
    Trivia,
    FindTheEmoji,
    FastTyper
}
