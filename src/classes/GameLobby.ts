import { TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import EventEmitter from 'node:events';

export class GameLobby extends EventEmitter {
    public game: GameType;
    public host: User;
    public players: User[] = [];
    public channel: TextBasedChannel;
    public state: GameState = GameState.Waiting;
    public minPlayers = 1;
    public maxPlayers = 1;    
    public winners: User[] = [];
    public interactionTimeout = 60_000;

    public constructor(
        game: GameType,
        host: User,
        channel: TextBasedChannel,
        minPlayers: number,
        maxPlayers: number,
        interactionTimeout: number = 60_000
    ) {
        super();

        this.game = game;
        this.host = host;
        this.players.push(host);
        this.channel = channel;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.interactionTimeout = interactionTimeout;
    }

    open() {
        this.emit('join', this);
    }

    join(user: User) {
        if (this.state !== GameState.Waiting) return;
        if (this.players.length < this.maxPlayers) this.players.push(user);
        if (this.players.length >= this.minPlayers && this.players.length <= this.maxPlayers) {
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
    Finished,
    Canceled
}
