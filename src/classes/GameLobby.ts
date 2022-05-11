import { TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import EventEmitter from 'node:events';

export class GameLobby extends EventEmitter {
    /*
    private readonly onGameReady = new LiteEvent<void>();
    private readonly onGameTick = new LiteEvent<void>();
    private readonly onGameOver = new LiteEvent<string>();

    public get GameReady() {
        return this.onGameReady.expose();
    }
    public get GameTick() {
        return this.onGameTick.expose();
    }
    public get GameOver() {
        return this.onGameOver.expose();
    }
    */

    public game: GameType;
    public host: User;
    public players: User[];
    public channel: TextBasedChannel;
    public state: GameState = GameState.Waiting;
    public minPlayers = 1;
    public maxPlayers = 1;

    public constructor(game: GameType, host: User, channel: TextBasedChannel, minPlayers: number, maxPlayers: number) {
        super();

        this.game = game;
        this.host = host;
        this.channel = channel;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
    }

    join(user: User) {
        if (this.state !== GameState.Waiting) return;
        if (this.players.length < this.maxPlayers) this.players.push(user);
        if (this.players.length >= this.minPlayers || this.players.length == this.maxPlayers) {
            this.state = GameState.Ready;
            this.emit('ready', this);
        } else {
            this.emit('join', this);
        }
    }

    start() {
        if (this.state === GameState.Ready) {
            this.state = GameState.Started;
            this.emit('start', this);
        }
    }
}

export enum GameState {
    Waiting,
    Ready,
    Started,
    Finished
}

/* https://stackoverflow.com/a/14657922 
interface ILiteEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
}

class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void }[] = [];

    public on(handler: { (data?: T): void }): void {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }): void {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach((h) => h(data));
    }

    public expose(): ILiteEvent<T> {
        return this;
    }
}
*/
