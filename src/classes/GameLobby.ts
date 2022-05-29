import {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessagePayload,
    TextBasedChannel,
    User,
    WebhookEditMessageOptions
} from 'discord.js';
import { GameType } from './GameManager';
import EventEmitter from 'node:events';
import BotterinoClient from '../client';

export class GameLobby extends EventEmitter {
    public game: GameType;
    public host: User;
    public players!: User[];
    public channel: TextBasedChannel;
    public state: GameState = GameState.Waiting;
    public minPlayers = 1;
    public maxPlayers = 1;
    public winners!: User[];
    public interactionTimeout = 60_000;
    public name = '';
    public thumbnail = '';

    public constructor(
        client: BotterinoClient,
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
        if (this.players.length >= this.minPlayers && this.players.length <= this.maxPlayers) {
            this.state = GameState.Ready;
            this.emit('ready', this);
        } else {
            this.state = GameState.Waiting;
            this.emit('join', this);
        }
    }

    join(user: User) {
        if (this.state !== GameState.Waiting && this.state !== GameState.Ready) return;
        if (!this.players.includes(user)) {
            if (this.players.length < this.maxPlayers) this.players.push(user);
        }
        this.open();
    }

    start() {
        if (this.state === GameState.Ready) {
            this.state = GameState.Started;
            this.emit('start', this);
        }
    }

    getChallengeMessage(opponent: User, message: string): string | MessagePayload | WebhookEditMessageOptions {
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setAuthor({ name: opponent.username, iconURL: opponent.avatarURL() || '' })
            .setDescription(message)
            .setThumbnail(this.thumbnail);
        const row1 = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('challenge_accept').setLabel('Accept').setStyle('SUCCESS'),
            new MessageButton().setCustomId('challenge_decline').setLabel('Decline').setStyle('DANGER')
        ]);
        return {
            content: `<@${opponent.id}>`,
            embeds: [embedmsg],
            components: [row1]
        };
    }
}

export enum GameState {
    Waiting,
    Ready,
    Started,
    Finished,
    Canceled
}

export enum GameDifficulty {
    Easy = 'Easy',
    Medium = 'Medium',
    Hard = 'Hard'
}
