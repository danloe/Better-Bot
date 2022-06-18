import {
    determineInputType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack,
    getYoutubePlaylistTracks,
    getYoutubePlaylist,
    getLogoUrlfromUrl,
    getSpotifyAlbumOrPlaylistTracks,
    getSpotifyTrack,
    getVoiceStream
} from '../helpers';
import { CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import BotterinoClient from '../client';
import { MusicSubscription } from './MusicSubscription';
import { Track, TrackType } from './Track';
import { createAudioResource, entersState, StreamType, VoiceConnectionStatus } from '@discordjs/voice';
import { Playlist } from '../interfaces';

export class MusicManager {
    client: BotterinoClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();

    constructor(client: BotterinoClient) {
        this.client = client;
    }

    play(
        guildId: Snowflake,
        member: GuildMember,
        input: string,
        announce: boolean,
        skip: boolean,
        next: boolean,
        reverse: boolean,
        shuffle: boolean,
        offset: number,
        limit: number,
        interaction?: CommandInteraction
    ) {
        return new Promise<Track | Playlist>(async (resolve, reject) => {
            try {
                let track: Track;
                let tracks: Track[] = [];
                let playlist: Playlist | null = null;
                let inputType = determineInputType(input);

                switch (inputType) {
                    case TrackType.YouTube:
                        track = await getYouTubeTrack(this.client, input, member.user.username, announce);
                        break;

                    case TrackType.YouTubePlaylist:
                        playlist = await getYoutubePlaylist(input, announce);
                        tracks = await getYoutubePlaylistTracks(
                            this.client,
                            input,
                            offset,
                            limit,
                            member.user.username,
                            announce,
                            reverse,
                            shuffle
                        );
                        break;

                    case TrackType.SoundCloud:
                        track = await getSoundCloudTrack(input, member.user.username, announce);
                        break;

                    case TrackType.Newgrounds:
                        track = await getNewgroundsTrack(input, member.user.username, announce);
                        break;

                    case TrackType.SpotifyTrack:
                        track = await getSpotifyTrack(input, this.client, member.user.username, announce);
                        break;

                    case TrackType.SpotifyAlbum:
                        [playlist, tracks] = await getSpotifyAlbumOrPlaylistTracks(
                            input,
                            this.client,
                            guildId,
                            member,
                            announce,
                            reverse,
                            shuffle,
                            skip || next,
                            offset,
                            limit,
                            interaction
                        );
                        break;

                    case TrackType.SpotifyPlaylist:
                        [playlist, tracks] = await getSpotifyAlbumOrPlaylistTracks(
                            input,
                            this.client,
                            guildId,
                            member,
                            announce,
                            reverse,
                            shuffle,
                            skip || next,
                            offset,
                            limit,
                            interaction
                        );
                        break;

                    case TrackType.DirectFile:
                        const imageUrl = await getLogoUrlfromUrl(this.client, input);

                        track = new Track(
                            TrackType.DirectFile,
                            TrackType.DirectFile,
                            input,
                            'Unknown File',
                            member.user.username,
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

                const subscription = this.getSubscription(guildId);
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
                    if (member instanceof GuildMember && member.voice.channel) {
                        subscription.createVoiceConnection(member.voice.channel);
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

    say(guildId: Snowflake, member: GuildMember, phrase: string, lang: string = 'en') {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);

                if (!subscription.isVoiceConnectionReady()) {
                    if (member instanceof GuildMember && member.voice.channel) {
                        subscription.createVoiceConnection(member.voice.channel);
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

                const stream = await getVoiceStream(phrase, {
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

    stop(guildId: Snowflake) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);

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

    pause(guildId: Snowflake) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);

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

    resume(guildId: Snowflake, member: GuildMember) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);
                const queue = subscription.queue;

                if (!queue.hasTracks() && !subscription.isPaused()) {
                    error('Nothing to play.');
                    return;
                }

                if (!subscription.isVoiceConnectionReady()) {
                    if (member instanceof GuildMember && member.voice.channel) {
                        subscription.createVoiceConnection(member.voice.channel);
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

    skip(guildId: Snowflake, member: GuildMember, amount: number) {
        return new Promise<MusicSubscription>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);
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
                    if (member instanceof GuildMember && member.voice.channel) {
                        subscription.createVoiceConnection(member.voice.channel);
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

                done(subscription);
            } catch (err) {
                error(err);
            }
        });
    }

    restart(guildId: Snowflake) {
        return new Promise<void>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);

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

    remove(guildId: Snowflake, positions: number[]) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getSubscription(guildId).queue;

                if (queue.length <= 1) {
                    error('Queue not long enough.');
                    return;
                }

                if (positions.length === 0) {
                    error('No positions specified.');
                    return;
                }

                if (positions.some((position) => position < 0 || position > queue.length)) {
                    error('Invalid position provided.');
                    return;
                }

                // remove all positions from the queue in descending order
                positions.sort((a, b) => b - a);
                for (const position of positions) {
                    queue.remove(position);
                }

                done();
            } catch (err) {
                error(err);
            }
        });
    }

    clear(guildId: Snowflake) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getSubscription(guildId).queue;

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

    shuffle(guildId: Snowflake) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getSubscription(guildId).queue;

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

    repeat(guildId: Snowflake, enable: boolean | null) {
        return new Promise<boolean>(async (done, error) => {
            try {
                const subscription = this.getSubscription(guildId);

                if (enable !== null) {
                    subscription.repeat = enable;
                    done(enable);
                } else {
                    done(subscription.repeat);
                }
            } catch (err) {
                error(err);
            }
        });
    }

    move(guildId: Snowflake, currentPos: number, targetPos: number) {
        return new Promise<void>(async (done, error) => {
            try {
                const queue = this.getSubscription(guildId).queue;

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

    getSubscription(guildId: Snowflake): MusicSubscription {
        let subscription = this.subscriptions.get(guildId!);
        if (!subscription) {
            subscription = new MusicSubscription(this.client, guildId!);
            this.subscriptions.set(guildId!, subscription);
        }
        return subscription;
    }
}
