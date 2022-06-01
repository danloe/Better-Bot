import {
    createErrorEmbed,
    safeDeferReply,
    determineInputType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack,
    safeReply,
    getYoutubePlaylistTracks,
    getYoutubePlaylist,
    getLogoUrlfromUrl,
    getSpotifyAlbumOrPlaylistTracks,
    getSpotifyTrack
} from '../helpers';
import { ButtonInteraction, CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import BotterinoClient from '../client';
import { MusicSubscription } from './MusicSubscription';
import { Queue } from './Queue';
import { Track, InputType } from './Track';
import {
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnectionStatus
} from '@discordjs/voice';
import { Playlist } from '../interfaces';
//import discordTTS from 'discord-tts';
const discordTTS = require('discord-tts');

export class MusicManager {
    client: BotterinoClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();
    queues: Map<Snowflake, Queue> = new Map<Snowflake, Queue>();

    constructor(client: BotterinoClient) {
        this.client = client;
    }

    play(
        interaction: CommandInteraction | ButtonInteraction,
        input: string,
        announce: boolean,
        skip: boolean,
        next: boolean,
        reverse: boolean,
        shuffle: boolean,
        offset: number,
        limit: number
    ) {
        return new Promise<Track | Playlist>(async (resolve, reject) => {
            try {
                await safeDeferReply(this.client, interaction);
                let track: Track;
                let tracks: Track[] = [];
                let playlist: Playlist | null = null;
                let inputType = determineInputType(input);

                switch (inputType) {
                    case InputType.YouTube:
                        track = await getYouTubeTrack(this.client, input, interaction.user.username, announce);
                        break;

                    case InputType.YouTubePlaylist:
                        playlist = await getYoutubePlaylist(input, announce);
                        tracks = await getYoutubePlaylistTracks(
                            this.client,
                            input,
                            offset,
                            limit,
                            interaction.user.username,
                            announce,
                            reverse,
                            shuffle
                        );
                        break;

                    case InputType.SoundCloud:
                        track = await getSoundCloudTrack(input, interaction.user.username, announce);
                        break;

                    case InputType.Newgrounds:
                        track = await getNewgroundsTrack(input, interaction.user.username, announce);
                        break;

                    case InputType.SpotifyTrack:
                        track = await getSpotifyTrack(input, this.client, interaction.user.username, announce);
                        break;

                    case InputType.SpotifyAlbum:
                        [playlist, tracks] = await getSpotifyAlbumOrPlaylistTracks(
                            input,
                            this.client,
                            interaction,
                            announce,
                            reverse,
                            shuffle,
                            skip || next,
                            offset,
                            limit
                        );
                        break;

                    case InputType.SpotifyPlaylist:
                        [playlist, tracks] = await getSpotifyAlbumOrPlaylistTracks(
                            input,
                            this.client,
                            interaction,
                            announce,
                            reverse,
                            shuffle,
                            skip || next,
                            offset,
                            limit
                        );
                        break;

                    case InputType.DirectFile:
                        const imageUrl = await getLogoUrlfromUrl(this.client, input);

                        track = new Track(
                            InputType.DirectFile,
                            InputType.DirectFile,
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

                const queue = this.getQueue(interaction);

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

                const subscription = this.getSubscription(interaction, true);

                if (!subscription.voiceConnection) {
                    await safeReply(
                        this.client,
                        interaction,
                        createErrorEmbed(
                            '🚩 Could not join a voice channel: `You must first join a voice channel for me to follow you. ➡️ Then try the resume command.`'
                        )
                    );
                    if (playlist) {
                        resolve(playlist!);
                    } else {
                        resolve(track!);
                    }
                    return;
                }

                await entersState(subscription.voiceConnection!, VoiceConnectionStatus.Ready, 20e3).catch((_) => {
                    this.client.logger.warn("Could not enter voice connection state 'ready'.");
                    reject('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                });

                if (skip) {
                    subscription.skip();
                } else {
                    subscription.play();
                }

                if (playlist) {
                    this.client.logger.info(`Playlist ${playlist.name} queued.`);
                    resolve(playlist!);
                } else {
                    this.client.logger.info(`Track ${track!.title} queued.`);
                    resolve(track!);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    say(interaction: CommandInteraction | ButtonInteraction, phrase: string, lang: string = 'en') {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(this.client, interaction, true);
                const subscription = this.getSubscription(interaction, true);

                if (!subscription.voiceConnection) {
                    error(
                        'Could not join a voice channel: You must first join a voice channel for me to follow you. ➡️ Then try the say command.'
                    );
                    return;
                }

                try {
                    await entersState(subscription.voiceConnection!, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    this.client.logger.warn("Could not enter voice connection state 'ready'.");
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
                error(err);
            }
        });
    }

    stop(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(interaction, false);

                if (!subscription.voiceConnection) {
                    error('Not playing anything.');
                    return;
                }

                subscription!.stop();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    pause(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(interaction, false);

                if (!subscription.voiceConnection) {
                    error('Not playing anything.');
                    return;
                }

                subscription!.pause();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    resume(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(this.client, interaction);
                const queue = this.getQueue(interaction);
                const subscription = this.getSubscription(interaction, queue.length > 0);

                if (!queue.hasTracks() && !subscription.isPaused()) {
                    error('Nothing to play.');
                    return;
                }

                try {
                    await entersState(subscription.voiceConnection!, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    this.client.logger.warn("Could not enter voice connection state 'ready'.");
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                subscription.play();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    skip(interaction: CommandInteraction | ButtonInteraction, amount: number) {
        return new Promise<Queue>(async (done, error) => {
            try {
                const queue = this.getQueue(interaction);
                const subscription = this.getSubscription(interaction, queue.length > 0);

                if (!subscription.voiceConnection) {
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
                subscription.skip();
                done(queue);
            } catch (err) {
                error(err);
            }
        });
    }

    restart(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(interaction, true);

                if (!subscription.voiceConnection) {
                    error('Not playing anything.');
                    return;
                }

                if (!subscription.currentTrack) {
                    error('Nothing to restart.');
                    return;
                }

                subscription.restart();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    remove(interaction: CommandInteraction | ButtonInteraction, positions: number[]) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(this.client, interaction);
                const queue = this.getQueue(interaction);

                if (queue.length <= 1) {
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
                error(err);
            }
        });
    }

    clear(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                await safeDeferReply(this.client, interaction);
                const queue = this.getQueue(interaction);

                if (queue.length < 1) {
                    error('Queue is empty.');
                    return;
                }

                queue.clear();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    shuffle(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getQueue(interaction);

                if (queue.length == 0) {
                    error('Queue is empty.');
                    return;
                }

                if (queue.length == 1) {
                    error('Queue has not enough tracks.');
                    return;
                }

                queue.shuffle();
                done();
            } catch (err) {
                error(err);
            }
        });
    }

    repeat(interaction: CommandInteraction | ButtonInteraction, enable: boolean | null) {
        return new Promise<boolean>(async (done, error) => {
            try {
                const subscription = this.getSubscription(interaction, false);

                if (enable !== null) {
                    subscription.setRepeat(enable);
                    done(enable);
                } else {
                    done(subscription.getRepeat());
                }
            } catch (err) {
                error(err);
            }
        });
    }

    move(interaction: CommandInteraction | ButtonInteraction, currentPos: number, targetPos: number) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getQueue(interaction);

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
                error(err);
            }
        });
    }

    getQueue(interaction: CommandInteraction | ButtonInteraction): Queue {
        let queue = this.queues.get(interaction.guildId!);

        if (!queue) {
            queue = new Queue();
            this.queues.set(interaction.guildId!, queue);
        }
        return queue;
    }

    getSubscription(interaction: CommandInteraction | ButtonInteraction, join: boolean = true): MusicSubscription {
        let subscription = this.subscriptions.get(interaction.guildId!);
        if (!subscription) {
            if (join) {
                if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                    const channel = interaction.member.voice.channel;
                    subscription = new MusicSubscription(
                        this.client,
                        joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                        }),
                        this.getQueue(interaction),
                        this.client.config.defaultVolume
                    );
                    subscription.voiceConnection!.on('error', console.warn);
                }
            } else {
                subscription = new MusicSubscription(
                    this.client,
                    undefined,
                    this.getQueue(interaction),
                    this.client.config.defaultVolume
                );
            }
            this.subscriptions.set(interaction.guildId!, subscription!);
        } else if (join && (!subscription.voiceConnection! || !subscription.isVoiceConnectionReady())) {
            if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                const channel = interaction.member.voice.channel;
                subscription = new MusicSubscription(
                    this.client,
                    joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                    }),
                    this.getQueue(interaction),
                    subscription.volume
                );
                subscription.voiceConnection!.on('error', console.warn);
            }
        }
        return subscription!;
    }
}
