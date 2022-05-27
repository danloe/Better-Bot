/* https://github.com/discordjs/voice/tree/main/examples/music-bot */

import {
    AudioPlayer,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionState,
    VoiceConnectionStatus
} from '@discordjs/voice';
import { promisify } from 'node:util';
import { Track } from './Track';
import { Queue } from './Queue';
import { TextBasedChannel } from 'discord.js';
import { getAnnouncementString } from '../helpers';
//import discordTTS from 'discord-tts';
const discordTTS = require('discord-tts');

const wait = promisify(setTimeout);

export class MusicSubscription {
    public readonly voiceConnection!: VoiceConnection;
    public readonly audioPlayer!: AudioPlayer;
    public readonly voicePlayer!: AudioPlayer;

    public queue: Queue;
    public currentTrack!: Track | undefined;
    public lastChannel!: TextBasedChannel;
    public queueLock = false;
    public readyLock = false;
    public autoplay = true;
    public pausedForVoice = false;
    public announcement = false;
    public volume = 1;
    public voiceVolumeMultiplier = 1.8;

    private audioResource!: AudioResource<Track>;
    private voiceResource!: AudioResource;
    private connectionTimeoutObj!: NodeJS.Timeout;

    public constructor(voiceConnection: VoiceConnection | undefined, queue: Queue, volume: number) {
        this.queue = queue;
        this.volume = volume;

        if (voiceConnection) {
            this.voiceConnection = voiceConnection;
            this.audioPlayer = createAudioPlayer();
            this.voicePlayer = createAudioPlayer();
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
                (oldState: AudioPlayerState, newState: AudioPlayerState) => {
                    if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                        // The queue is then processed to start playing the next track, if one is available.

                        // Start connection timeout check
                        this.startConnectionTimeout();

                        if (this.autoplay) this.processQueue();
                    } else if (newState.status === AudioPlayerStatus.Playing) {
                        // If the Playing state has been entered, then a new track has started playback.
                        // Stop connection timeout check
                        this.stopConnectionTimeout();
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
            this.voicePlayer.on<'stateChange'>(
                'stateChange',
                (oldState: AudioPlayerState, newState: AudioPlayerState) => {
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
                        }
                    } else if (newState.status === AudioPlayerStatus.Playing) {
                        // If the Playing state has been entered, then a new track has started playback.
                        // Stop connection timeout check
                        this.stopConnectionTimeout();
                        this.autoplay = true;
                    }
                }
            );

            this.audioPlayer.on('error', (error: { resource: any }) => {
                console.log(error);
                this.processQueue();
            });

            this.voicePlayer.on('error', (error: { resource: any }) => console.log(error));

            voiceConnection.subscribe(this.audioPlayer!);
        }
    }

    private startConnectionTimeout() {
        this.connectionTimeoutObj = setTimeout(() => {
            if (
                this.audioPlayer.state.status !== AudioPlayerStatus.Playing &&
                this.voicePlayer.state.status !== AudioPlayerStatus.Playing
            ) {
                this.voiceConnection.destroy();
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
        if (this.voiceConnection.state.status === VoiceConnectionStatus.Ready) return true;
        return false;
    }

    /**
     * Stops audio playback.
     */
    public stop() {
        this.autoplay = false;
        this.audioPlayer.stop();
        this.voiceConnection.destroy();
    }

    /**
     * Stops audio playback.
     */
    public pause() {
        this.audioPlayer.pause();
    }

    /**
     * Skips current audio playback.
     */
    public skip() {
        if (this.isIdle()) {
            this.play();
        } else {
            this.audioPlayer.stop();
        }
    }

    /**
     * Plays audio.
     */
    public play() {
        if (this.isPaused()) {
            this.audioPlayer.unpause();
        } else {
            this.pausedForVoice = false;
            this.processQueue();
        }
    }

    /**
     * Sets the audio volume.
     */
    public setVolume(value: number) {
        this.volume = value;
        if (this.audioResource) this.audioResource.volume?.setVolume(value);
        if (this.voiceResource) this.voiceResource.volume?.setVolume(value * this.voiceVolumeMultiplier);
    }

    /**
     * Gets the audio volume.
     */
    public getVolume(): number {
        return this.volume;
    }

    /**
     * Plays voice audio.
     */
    public playVoice(resource: AudioResource) {
        if (this.isPlaying()) {
            this.pausedForVoice = true;
            this.voiceResource = resource;
            this.voiceResource.volume?.setVolume(this.volume * 1.5);
            this.audioPlayer.pause();
        } else {
            this.voiceConnection.subscribe(this.voicePlayer!);
            this.voicePlayer.play(resource);
        }
    }

    public isPaused(): boolean {
        return this.audioPlayer.state.status == AudioPlayerStatus.Paused;
    }

    public isIdle(): boolean {
        return this.audioPlayer.state.status == AudioPlayerStatus.Idle;
    }

    public isPlaying(): boolean {
        return this.audioPlayer.state.status == AudioPlayerStatus.Playing;
    }

    /**
     * Attempts to play a Track from the queue.
     */
    private async processQueue(): Promise<void> {
        try {
            // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
            if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
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
                this.audioResource.volume?.setVolume(this.volume);
                if (nextTrack.announce) {
                    const stream = discordTTS.getVoiceStream(getAnnouncementString(nextTrack.name), {
                        lang: 'en',
                        slow: false
                    });
                    this.voiceResource = createAudioResource(stream, {
                        inputType: StreamType.Arbitrary,
                        inlineVolume: true
                    });
                    this.voiceResource.volume?.setVolume(this.volume * this.voiceVolumeMultiplier);

                    this.voiceConnection.subscribe(this.voicePlayer!);
                    this.voicePlayer.play(this.voiceResource);
                    this.announcement = true;
                } else {
                    this.audioPlayer.play(this.audioResource);
                }
                this.currentTrack = nextTrack;
                this.queueLock = false;
            } catch (error) {
                // If an error occurred, try the next item of the queue instead
                this.queueLock = false;
                return this.processQueue();
            }
        } catch (err) {
            console.log(err);
        }
    }
}
