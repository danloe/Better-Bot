import {
    createErrorEmbed,
    safeDeferReply,
    determineInputType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack,
    safeReply,
    getYoutubePlaylistTracks,
    getYoutubePlaylist
} from '../helpers';
import { ButtonInteraction, CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import BetterClient from '../client';
import { MusicSubscription } from './MusicSubscription';
import { Queue } from './Queue';
import { Track, TrackType } from './Track';
import {
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnectionStatus
} from '@discordjs/voice';
import google from 'googlethis';
import { Playlist } from '../interfaces';
const discordTTS = require('discord-tts');
//import discordTTS from 'discord-tts';

export class MusicManager {
    client: BetterClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();
    queues: Map<Snowflake, Queue> = new Map<Snowflake, Queue>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    play(
        interaction: CommandInteraction | ButtonInteraction,
        input: string,
        announce: boolean,
        skip: boolean,
        next: boolean
    ) {
        return new Promise<Track | Playlist>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                let type = determineInputType(input);
                let track: Track;
                let tracks: Track[] = [];
                let playlist: Playlist;

                switch (type) {
                    case TrackType.YouTube:
                        track = await getYouTubeTrack(input, interaction.user.username, announce);
                        break;

                    case TrackType.YouTubePlaylist:
                        playlist = await getYoutubePlaylist(input, announce);
                        tracks = await getYoutubePlaylistTracks(input, 50, interaction.user.username, announce);
                        break;

                    case TrackType.SoundCloud:
                        track = await getSoundCloudTrack(input, interaction.user.username, announce);
                        break;

                    case TrackType.Newgrounds:
                        track = await getNewgroundsTrack(input, interaction.user.username, announce);
                        break;

                    case TrackType.DirectFile:
                        let domainName = input.match(/\w+(?=\.\w+\/)/gi)![0];
                        let images = await google.image(domainName + ' logo | icon', { safe: false });
                        const imageUrl = images[0].url;

                        track = new Track(
                            TrackType.DirectFile,
                            input,
                            'Unknown File',
                            interaction.user.username,
                            announce,
                            input,
                            0,
                            imageUrl,
                            'The requestor provided a direct file link. No information available.',
                            'unknown',
                            'unknown'
                        );
                        break;
                }

                if (!queue) this.queues.set(interaction.guildId!, new Queue());
                queue = this.queues.get(interaction.guildId!);

                if (tracks.length > 0) {
                    tracks.forEach((track) => {
                        if (skip || next) {
                            queue!.next(track);
                        } else {
                            queue!.queue(track);
                        }
                    });
                } else if (track!) {
                    if (skip || next) {
                        queue!.next(track);
                    } else {
                        queue!.queue(track);
                    }
                }

                if (!subscription || !subscription.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        const channel = interaction.member.voice.channel;
                        subscription = new MusicSubscription(
                            joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild
                                    .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                            }),
                            queue!
                        );
                        subscription.voiceConnection.on('error', console.warn);
                        this.subscriptions.set(interaction.guildId!, subscription);
                    }
                }

                if (!subscription) {
                    await safeReply(
                        interaction,
                        createErrorEmbed(
                            '🚩 Could not join a voice channel: `You must first join a voice channel for me to follow you. ➡️ Then try the resume command.`'
                        )
                    );
                    if (type === TrackType.YouTube) {
                        done(track!);
                    } else {
                        done(playlist!);
                    }
                    return;
                }

                try {
                    await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    console.warn(err);
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                if (skip) {
                    subscription.audioPlayer.stop();
                } else {
                    subscription.play();
                }

                if (type === TrackType.YouTube) {
                    done(track!);
                } else {
                    done(playlist!);
                }
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    say(interaction: CommandInteraction | ButtonInteraction, phrase: string, lang: string = 'en') {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction, true);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue) this.queues.set(interaction.guildId!, new Queue());
                queue = this.queues.get(interaction.guildId!);

                if (!subscription || !subscription?.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        const channel = interaction.member.voice.channel;
                        subscription = new MusicSubscription(
                            joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild
                                    .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                            }),
                            queue!,
                            false
                        );
                        subscription.voiceConnection.on('error', console.warn);
                        this.subscriptions.set(interaction.guildId!, subscription);
                    }
                }

                if (!subscription) {
                    error(
                        'Could not join a voice channel: You must first join a voice channel for me to follow you. ➡️ Then try the say command.'
                    );
                    return;
                }

                try {
                    await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    console.warn(err);
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                const stream = discordTTS.getVoiceStream(phrase, {
                    lang: lang,
                    slow: false
                });

                const audioResource = createAudioResource(stream, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: true
                });
                subscription!.playVoice(audioResource);
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    stop(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!subscription) {
                    error('Not playing anything.');
                    return;
                }

                subscription!.audioPlayer.stop();
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    pause(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!subscription) {
                    error('Not playing anything.');
                    return;
                }

                subscription!.audioPlayer.pause();
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    resume(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!subscription || !subscription.isVoiceConnectionReady()) {
                    if (!queue) {
                        error('No queue.');
                        return;
                    }
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        const channel = interaction.member.voice.channel;
                        subscription = new MusicSubscription(
                            joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild
                                    .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                            }),
                            queue
                        );
                        subscription.voiceConnection.on('error', console.warn);
                        this.subscriptions.set(interaction.guildId!, subscription);
                    }
                }

                if (!subscription) {
                    error('Not in a voice channel.');
                    return;
                }

                try {
                    await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    console.warn(err);
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                subscription.audioPlayer.unpause();
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    skip(interaction: CommandInteraction | ButtonInteraction, amount: number) {
        return new Promise<Queue>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!subscription) {
                    error('Not playing anything.');
                    return;
                }

                if (amount > 0 && amount > queue!.length - 1) {
                    error('Not enough tracks in queue.');
                    return;
                }

                if (!queue) {
                    error('No queue available.');
                    return;
                }

                if (amount > 0) queue.remove(1, amount);
                subscription.audioPlayer.stop();
                done(queue);
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    remove(interaction: CommandInteraction | ButtonInteraction, positions: number[]) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue || queue.length <= 1) {
                    error('Queue not long enough.');
                    return;
                }

                // sort positions from high to low
                let sorted = positions.sort(function (a, b) {
                    return b - a;
                });
                sorted.forEach((postition) => {
                    queue?.remove(postition);
                });

                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    getQueue(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<Queue>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue || queue.length < 1) {
                    error('Queue is empty.');
                    return;
                }

                done(queue);
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    clear(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue || queue.length < 1) {
                    error('Queue is empty.');
                    return;
                }

                queue.clear();
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    shuffle(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue) {
                    error('Queue is empty.');
                    return;
                }
                if (queue.length <= 1) {
                    error('Queue has not enough tracks.');
                    return;
                }

                queue.shuffle();
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    move(interaction: CommandInteraction | ButtonInteraction, currentPos: number, targetPos: number) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(interaction);
                let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

                if (!queue || queue.length <= 1) {
                    error('Queue not long enough.');
                    return;
                }

                if (currentPos < 1 || currentPos > queue.length) {
                    error('Current position not possible.');
                    return;
                }

                if (targetPos < 1 || currentPos > queue.length || targetPos == currentPos) {
                    error('Target position not possible.');
                    return;
                }

                queue.move(currentPos, targetPos);
                done();
            } catch (err) {
                console.log(err);
                error(err);
            }
        });
    }

    /*
    setVolume(interaction: CommandInteraction, volume: number) {
        return new Promise(async (done, error) => {
        volume = Math.min(Math.max(volume / 100 + 0.5, 0.5), 2);
        this.config.stream.volume = volume;
        if (this.dispatcher) {
            this.dispatcher.setVolume(volume);
        }
    });
    }

    getVolume(interaction: CommandInteraction) {
        return (this.config.stream.volume - 0.5) * 100 + '%';
    }
    */

    /**
     * Returns for subscription and queue if available
     */
    getSubscriptionAndQueue(
        interaction: CommandInteraction | ButtonInteraction
    ): [MusicSubscription | undefined, Queue | undefined] {
        if (!interaction.guildId) return [undefined, undefined];
        const subscription = this.subscriptions.get(interaction.guildId);
        const queue = this.queues.get(interaction.guildId);
        if (subscription) subscription.lastChannel = interaction.channel || undefined;
        return [subscription, queue];
    }
}

export enum PlayerStatus {
    Playing,
    Paused,
    Stopped,
    Empty
}
