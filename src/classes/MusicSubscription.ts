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
const discordTTS = require('discord-tts');
//import discordTTS from 'discord-tts';

const wait = promisify(setTimeout);

export class MusicSubscription {
    public readonly voiceConnection: VoiceConnection;
    public readonly audioPlayer: AudioPlayer;
    public readonly voicePlayer: AudioPlayer;
    public queue: Queue;
    public currentTrack: Track | undefined;
    public lastChannel: TextBasedChannel | undefined = undefined;
    public queueLock = false;
    public readyLock = false;
    public autoplay = true;
    public pausedForVoice = false;
    public announcement = false;
    private nextTrackResource: AudioResource<Track> | undefined;
    private nextVoiceResource: AudioResource | undefined;
    private connectionTimeoutObj: NodeJS.Timeout | undefined;

    public constructor(voiceConnection: VoiceConnection, queue: Queue, autoplay: boolean = true) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.voicePlayer = createAudioPlayer();
        this.queue = queue;
        this.autoplay = autoplay;

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
                    this.stop();
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
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
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
        this.audioPlayer.on<'stateChange'>('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.

                // Start connection timeout check
                this.connectionTimeoutObj = setTimeout(() => {
                    if (this.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                        this.voiceConnection.destroy();
                    }
                }, 60_000);
                this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                // Stop connection timeout check
                clearTimeout(this.connectionTimeoutObj!);
            } else if (newState.status === AudioPlayerStatus.Paused) {
                // If the Playing state has been entered, then the player was paused.
                if (this.pausedForVoice) {
                    this.voiceConnection.subscribe(this.voicePlayer);
                    this.voicePlayer.play(this.nextVoiceResource!);
                }
            }
        });

        // Configure voice player
        this.voicePlayer.on<'stateChange'>('stateChange', (oldState: AudioPlayerState, newState: AudioPlayerState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.voiceConnection.subscribe(this.audioPlayer);

                if (this.pausedForVoice) {
                    this.pausedForVoice = false;
                    this.audioPlayer.unpause();
                } else if (this.announcement) {
                    this.announcement = false;
                    this.audioPlayer.play(this.nextTrackResource!);
                }
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                this.autoplay = true;
            }
        });

        this.audioPlayer.on('error', (error: { resource: any }) => {
            console.log(error);
            this.processQueue();
        });

        this.voicePlayer.on('error', (error: { resource: any }) => console.log(error));

        voiceConnection.subscribe(this.audioPlayer);
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
        this.audioPlayer.stop(true);
    }

    /**
     * Plays audio.
     */
    public play() {
        if (this.audioPlayer.playable) {
            this.autoplay = true;
            this.pausedForVoice = false;
            this.processQueue();
        }
    }

    /**
     * Plays voice audio.
     */
    public playVoice(resource: AudioResource) {
        if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            this.pausedForVoice = true;
            this.audioPlayer.pause();
            this.nextVoiceResource = JSON.parse(JSON.stringify(resource));
        } else {
            this.voiceConnection.subscribe(this.voicePlayer);
            this.voicePlayer.play(resource);
        }
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
                this.nextTrackResource = await nextTrack.createAudioResource();
                if (nextTrack.announce) {
                    const stream = discordTTS.getVoiceStream(getAnnouncementString(nextTrack.name), {
                        lang: 'en',
                        slow: false
                    });
                    const voiceAudioResource = createAudioResource(stream, {
                        inputType: StreamType.Arbitrary,
                        inlineVolume: true
                    });

                    this.voiceConnection.subscribe(this.voicePlayer);
                    this.voicePlayer.play(voiceAudioResource);
                    this.announcement = true;
                } else {
                    this.audioPlayer.play(this.nextTrackResource);
                }
                this.currentTrack = nextTrack;
                this.queueLock = false;
            } catch (error) {
                // If an error occurred, try the next item of the queue instead
                //nextTrack.onError(error as Error);
                this.queueLock = false;
                return this.processQueue();
            }
        } catch (err) {
            console.log(err);
        }
    }
}

const announcements = [
    'Next track is ',
    'Next up, ',
    'Now playing, ',
    'Coming up next is ',
    'Listen closely to ',
    'Now coming, ',
    'Shut up, here is ',
    'Stop talking, this is ',
    'Hey Listen',
    "Rythm's not up, let me give you a hug. ",
    "Rythm's gone, my time has come. ",
    'Alright, Rythms lazy, listen to me baby. ',
    "Rythm's not doing shit, let me play this hit. ",
    'Hey Listen',
    "Rhytm who? Nothing that I can't do! ",
    "I don't wanna anounce this, I do it anyways. "
];

const postAnnouncements = [
    ', listen closely.',
    ", don't laugh.",
    ', I love that.',
    ', oh god not again.',
    ', groovy!',
    ', why do you do this?',
    ", that's my jam!"
];

function getAnnouncementString(trackName: string): string {
    let i = 0;
    if (Math.random() > 0.4) {
        i = Math.floor(Math.random() * announcements.length);
        return announcements[i] + trackName;
    } else {
        i = Math.floor(Math.random() * postAnnouncements.length);
        return trackName + postAnnouncements[i];
    }
}
