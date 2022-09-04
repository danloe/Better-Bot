/* https://github.com/discordjs/voice/tree/main/examples/music-bot */

import {
    AudioPlayer,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionState,
    VoiceConnectionStatus
} from '@discordjs/voice';
import { promisify } from 'node:util';
import { Track } from './Track';
import { Queue } from './Queue';
import {
    ButtonInteraction,
    CacheType,
    GuildTextBasedChannel,
    InteractionCollector,
    Message,
    Snowflake,
    VoiceBasedChannel
} from 'discord.js';
import { getAnnouncementString, getVoiceStream } from '../helpers';
import { getNowPlayingMessage, startNowPlayingCollector } from '../commands/audio/np';
import BotterinoClient from '../client';
import { Logger } from './Logger';

const wait = promisify(setTimeout);

export class MusicSubscription {
    public readonly client: BotterinoClient;
    public readonly guildId: Snowflake;
    public readonly audioPlayer!: AudioPlayer;
    public readonly voicePlayer!: AudioPlayer;

    public queue: Queue;
    public playerStatus: PlayerStatus;
    public voiceConnection!: VoiceConnection;
    public currentTrack!: Track | undefined;
    public lastChannel!: GuildTextBasedChannel;
    public lastNowPlayingMessage!: Message;
    public audioResource!: AudioResource<Track>;
    public voiceResource!: AudioResource;
    public npCollector!: InteractionCollector<ButtonInteraction<CacheType>>;

    private connectionTimeoutObj!: NodeJS.Timeout;

    private queueLock = false;
    private readyLock = false;
    private autoplay = true;
    private pausedForVoice = false;
    private restartTrack = false;
    private announcement = false;
    private _displayNowPlayingMessage = true;
    private _repeat = false;
    private _volume = 1;

    get volume(): number {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = value;
        if (this.audioResource) this.audioResource.volume?.setVolume(value);
        if (this.voiceResource)
            this.voiceResource.volume?.setVolume(value * this.client.config.music.voiceVolumeMultiplier);
    }

    get repeat(): boolean {
        return this._repeat;
    }

    set repeat(value: boolean) {
        this._repeat = value;
    }

    get displayNowPlayingMessage(): boolean {
        return this._displayNowPlayingMessage;
    }

    set displayNowPlayingMessage(value: boolean) {
        this._displayNowPlayingMessage = value;
    }

    public constructor(client: BotterinoClient, guildId: Snowflake) {
        this.client = client;
        this.guildId = guildId;
        this.queue = new Queue();
        this.audioPlayer = createAudioPlayer();
        this.voicePlayer = createAudioPlayer();
        this._volume = client.config.music.defaultVolume / 100;
        this.playerStatus = PlayerStatus.Idle;
    }

    public createVoiceConnection(channel: VoiceBasedChannel) {
        this.voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
        });

        // Configure voice connection
        this.voiceConnection.on<'stateChange'>(
            'stateChange',
            async (_: VoiceConnectionState, newState: VoiceConnectionState) => {
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (
                        newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
                        newState.closeCode === 4014
                    ) {
                        /**
                         * If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                         * but there is a chance the connection will recover itself if the reason of the disconnect was due to
                         * switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                         * so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                         * the voice connection.
                         */
                        try {
                            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                            // Probably moved voice channel
                        } catch {
                            this.voiceConnection.destroy();
                            // Probably removed from voice channel
                        }
                    } else if (this.voiceConnection.rejoinAttempts < 5) {
                        /**
                         * The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                         */
                        await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
                        this.voiceConnection.rejoin();
                    } else {
                        /**
                         * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                         */
                        this.voiceConnection.destroy();
                    }
                } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                    /**
                     * Once destroyed, stop the subscription.
                     */
                    this.audioPlayer.pause();
                    this.voicePlayer.pause();
                    this.playerStatus = PlayerStatus.Paused;
                } else if (
                    !this.readyLock &&
                    (newState.status === VoiceConnectionStatus.Connecting ||
                        newState.status === VoiceConnectionStatus.Signalling)
                ) {
                    /**
                     * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                     * before destroying the voice connection. This stops the voice connection permanently existing in one of these
                     * states.
                     */
                    this.readyLock = true;
                    try {
                        await entersState(this.voiceConnection!, VoiceConnectionStatus.Ready, 20_000);
                        if (this.autoplay) this.processQueue();
                    } catch {
                        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed)
                            this.voiceConnection.destroy();
                    } finally {
                        this.readyLock = false;
                    }
                }
            }
        );

        // Configure audio player
        this.audioPlayer.on<'stateChange'>(
            'stateChange',
            async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                    // The queue is then processed to start playing the next track, if one is available.

                    // Start connection timeout check
                    this.startConnectionTimeout();
                    if (this.autoplay && (this._repeat || this.restartTrack)) {
                        this.audioResource = await this.currentTrack!.createAudioResource();
                        this.audioPlayer.play(this.audioResource);
                        this.playerStatus = PlayerStatus.Playing;
                    } else if (this.autoplay) {
                        this.processQueue();
                    }
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    // If the Playing state has been entered, then a new track has started playback.
                    // Stop connection timeout check
                    this.stopConnectionTimeout();
                    this.restartTrack = false;
                } else if (newState.status === AudioPlayerStatus.Paused) {
                    // If the Playing state has been entered, then the player was paused.
                    if (this.pausedForVoice) {
                        this.voiceConnection.subscribe(this.voicePlayer!);
                        this.voicePlayer.play(this.voiceResource!);
                    }
                }
            }
        );

        // Configure voice player
        this.voicePlayer.on<'stateChange'>('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.voiceConnection.subscribe(this.audioPlayer!);

                // Start connection timeout check
                this.startConnectionTimeout();

                if (this.pausedForVoice) {
                    this.pausedForVoice = false;
                    this.audioPlayer.unpause();
                } else if (this.announcement) {
                    this.announcement = false;
                    this.audioPlayer.play(this.audioResource!);
                    this.playerStatus = PlayerStatus.Playing;
                }
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                // Stop connection timeout check
                this.stopConnectionTimeout();
                this.autoplay = true;
            }
        });

        this.audioPlayer.on('error', (error: { resource: any }) => {
            Logger.error(error.resource);
            this.processQueue();
        });

        this.voicePlayer.on('error', (error: { resource: any }) => Logger.error(error.resource));

        this.voiceConnection.subscribe(this.audioPlayer!);

        this.voiceConnection.on('error', console.warn);
    }

    private startConnectionTimeout() {
        this.connectionTimeoutObj = setTimeout(() => {
            if (
                this.audioPlayer.state.status !== AudioPlayerStatus.Playing &&
                this.voicePlayer.state.status !== AudioPlayerStatus.Playing
            ) {
                this.voiceConnection.disconnect();
            }
        }, 60000);
    }

    private stopConnectionTimeout() {
        clearTimeout(this.connectionTimeoutObj!);
    }

    /**
     * Tells if the voice connection is established.
     */
    public isVoiceConnectionReady(): boolean {
        if (this.voiceConnection?.state?.status === VoiceConnectionStatus.Ready) return true;
        return false;
    }

    /**
     * Stops audio playback.
     */
    public stop() {
        this.autoplay = false;
        this.audioPlayer.stop();
        this.playerStatus = PlayerStatus.Stopped;
        this.voiceConnection.disconnect();
    }

    /**
     * Stops audio playback.
     */
    public pause() {
        this.audioPlayer.pause();
        this.playerStatus = PlayerStatus.Paused;
    }

    /**
     * Skips current audio playback.
     */
    public skip() {
        if (this.playerStatus === PlayerStatus.Idle) {
            this.play();
        } else if (this.playerStatus === PlayerStatus.Paused) {
            this.audioPlayer.unpause();
            this.audioPlayer.stop();
            this.playerStatus = PlayerStatus.Stopped;
        } else {
            this.audioPlayer.stop();
            this.playerStatus = PlayerStatus.Stopped;
        }
    }

    /**
     * Plays audio.
     */
    public play() {
        if (this.playerStatus === PlayerStatus.Paused) {
            this.audioPlayer.unpause();
            this.playerStatus = PlayerStatus.Playing;
        } else {
            this.pausedForVoice = false;
            this.processQueue();
        }
    }

    /**
     * Restarts audio.
     */
    public restart() {
        this.restartTrack = true;
        this.audioPlayer.stop();
    }

    /**
     * Plays voice audio.
     */
    public playVoice(resource: AudioResource) {
        if (this.playerStatus === PlayerStatus.Playing) {
            this.pausedForVoice = true;
            this.voiceResource = resource;
            this.voiceResource.volume?.setVolume(this._volume * 1.5);
            this.audioPlayer.pause();
            this.playerStatus = PlayerStatus.Paused;
        } else {
            this.voiceConnection.subscribe(this.voicePlayer!);
            this.voicePlayer.play(resource);
        }
    }

    /**
     * Attempts to play a Track from the queue.
     */
    private async processQueue(): Promise<void> {
        try {
            // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
            if (
                this.queueLock ||
                (this.audioPlayer.state.status !== AudioPlayerStatus.Idle &&
                    this.audioPlayer.state.status !== AudioPlayerStatus.AutoPaused)
            ) {
                return;
            }
            // If the queue is empty, set current track to undefined and return
            if (this.queue.length === 0) {
                this.currentTrack = undefined;
                return;
            }

            // Lock the queue to guarantee safe access
            this.queueLock = true;

            // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
            const nextTrack = this.queue.dequeue();
            try {
                // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
                this.audioResource = await nextTrack.createAudioResource();
                this.audioResource.volume?.setVolume(this._volume);
                if (nextTrack.announce) {
                    const stream = await getVoiceStream(getAnnouncementString(nextTrack.title), {
                        lang: 'en',
                        slow: false
                    });
                    this.voiceResource = createAudioResource(stream, {
                        inputType: StreamType.Arbitrary,
                        inlineVolume: true
                    });
                    this.voiceResource.volume?.setVolume(this._volume * this.client.config.music.voiceVolumeMultiplier);

                    this.voiceConnection.subscribe(this.voicePlayer!);
                    this.voicePlayer.play(this.voiceResource);
                    this.announcement = true;
                } else {
                    this.audioPlayer.play(this.audioResource);
                    this.playerStatus = PlayerStatus.Playing;
                }
                this.currentTrack = nextTrack;
                this.showNowPlayingMessage();
                this.queueLock = false;
            } catch (error) {
                // If an error occurred, try the next item of the queue instead
                this.queueLock = false;
                return this.processQueue();
            }
        } catch (err: any) {
            Logger.debug(err);
        }
    }

    private async showNowPlayingMessage() {
        if (this._displayNowPlayingMessage) {
            if (!this.lastNowPlayingMessage) {
                const [msgembed, rows] = getNowPlayingMessage(this);
                this.lastNowPlayingMessage = await this.lastChannel
                    .send({
                        embeds: [msgembed],
                        components: [...rows]
                    })
                    .catch();
            }
            startNowPlayingCollector(this.client, this);
        }
    }
}

export enum PlayerStatus {
    Idle,
    Playing,
    Paused,
    Stopped
}
