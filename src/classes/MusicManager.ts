import {
    safeDeferReply,
    determineInputType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack,
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
import { Track, TrackType } from './Track';
import { createAudioResource, entersState, StreamType, VoiceConnectionStatus } from '@discordjs/voice';
import { Playlist } from '../interfaces';
//import discordTTS from 'discord-tts';
const discordTTS = require('discord-tts');

export class MusicManager {
    client: BotterinoClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();

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
                    case TrackType.YouTube:
                        track = await getYouTubeTrack(this.client, input, interaction.user.username, announce);
                        break;

                    case TrackType.YouTubePlaylist:
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

                    case TrackType.SoundCloud:
                        track = await getSoundCloudTrack(input, interaction.user.username, announce);
                        break;

                    case TrackType.Newgrounds:
                        track = await getNewgroundsTrack(input, interaction.user.username, announce);
                        break;

                    case TrackType.SpotifyTrack:
                        track = await getSpotifyTrack(input, this.client, interaction.user.username, announce);
                        break;

                    case TrackType.SpotifyAlbum:
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

                    case TrackType.SpotifyPlaylist:
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

                    case TrackType.DirectFile:
                        const imageUrl = await getLogoUrlfromUrl(this.client, input);

                        track = new Track(
                            TrackType.DirectFile,
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

                const subscription = this.getSubscription(interaction);
                const queue = subscription.queue;

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

                if (!subscription.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        subscription.createVoiceConnection(interaction.member.voice.channel);
                    } else {
                        reject(
                            'Could not join a voice channel: You must first join a voice channel for me to follow you. ➡️ Then try the resume command.'
                        );
                        if (playlist) {
                            resolve(playlist!);
                        } else {
                            resolve(track!);
                        }
                        return;
                    }
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
                const subscription = this.getSubscription(interaction);

                if (!subscription.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        subscription.createVoiceConnection(interaction.member.voice.channel);
                    } else {
                        error(
                            'Could not join a voice channel: You must first join a voice channel for me to follow you. ➡️ Then try the say command.'
                        );
                        return;
                    }
                }

                try {
                    await entersState(subscription.voiceConnection!, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    this.client.logger.warn("Could not enter voice connection state 'ready'.");
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                if (!subscription.voiceConnection) {
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
                const subscription = this.getSubscription(interaction);

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
                const subscription = this.getSubscription(interaction);

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
                const subscription = this.getSubscription(interaction);
                const queue = subscription.queue;

                if (!queue.hasTracks() && !subscription.isPaused()) {
                    error('Nothing to play.');
                    return;
                }

                if (!subscription.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        subscription.createVoiceConnection(interaction.member.voice.channel);
                    }
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
                const subscription = this.getSubscription(interaction);
                const queue = subscription.queue;

                if (!subscription.voiceConnection) {
                    error('Not playing anything.');
                    return;
                }

                if (amount > 0 && amount > queue!.length - 1) {
                    error('Not enough tracks in queue.');
                    return;
                }

                if (amount > 0) queue.remove(1, amount);

                if (!subscription.isVoiceConnectionReady()) {
                    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                        subscription.createVoiceConnection(interaction.member.voice.channel);
                    }
                }

                try {
                    await entersState(subscription.voiceConnection!, VoiceConnectionStatus.Ready, 20e3);
                } catch (err) {
                    this.client.logger.warn("Could not enter voice connection state 'ready'.");
                    error('Failed to join voice channel within 20 seconds, please try again later!');
                    return;
                }

                if (!queue.hasTracks()) {
                    subscription.skip();
                    subscription.stop();
                } else {
                    subscription.skip();
                }

                done(queue);
            } catch (err) {
                error(err);
            }
        });
    }

    restart(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(interaction);

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
                const queue = this.getSubscription(interaction).queue;

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
                const queue = this.getSubscription(interaction).queue;

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
                const queue = this.getSubscription(interaction).queue;

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
                const subscription = this.getSubscription(interaction);

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
                const queue = this.getSubscription(interaction).queue;

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

    getSubscription(interaction: CommandInteraction | ButtonInteraction): MusicSubscription {
        let subscription = this.subscriptions.get(interaction.guildId!);
        if (!subscription) {
            subscription = new MusicSubscription(this.client, interaction.guildId!);
            this.subscriptions.set(interaction.guildId!, subscription);
        }
        return subscription;
    }
}
