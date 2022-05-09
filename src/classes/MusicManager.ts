import {
    createEmbed,
    createErrorEmbed,
    determineTrackType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack
} from '../helpers';
import { CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import BetterClient from '../client';
import { MusicSubscription } from './MusicSubscription';
import { Queue } from './Queue';
import { Track, TrackType } from './Track';
import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';

export class MusicManager {
    client: BetterClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();
    queues: Map<Snowflake, Queue> = new Map<Snowflake, Queue>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    addMedia(interaction: CommandInteraction, args: string, announce: boolean) {
        return new Promise<Track>(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction!');
                return;
            }
            interaction.deferReply();

            let type = determineTrackType(args);

            let track: Track;

            switch (type) {
                case TrackType.YouTube:
                    track = await getYouTubeTrack(args, interaction.user.username, announce);
                    break;

                case TrackType.SoundCloud:
                    track = await getSoundCloudTrack(args, interaction.user.username, announce);
                    break;

                case TrackType.Newgrounds:
                    track = await getNewgroundsTrack(args, interaction.user.username, announce);
                    break;

                case TrackType.DirectFile:
                    track = new Track(
                        TrackType.DirectFile,
                        args,
                        'Unknown File',
                        interaction.user.username,
                        announce,
                        0,
                        '',
                        'The requestor provided a direct file link. No information available.'
                    );
                    break;
            }

            let queue = this.queues.get(interaction.guildId);
            if (!queue) this.queues.set(interaction.guildId, new Queue());
            queue = this.queues.get(interaction.guildId);
            queue!.queue(track);

            let subscription = this.subscriptions.get(interaction.guildId);

            if (!subscription) {
                if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                    const channel = interaction.member.voice.channel;
                    subscription = new MusicSubscription(
                        joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                        }),
                        queue!
                    );
                    subscription.voiceConnection.on('error', console.warn);
                    this.subscriptions.set(interaction.guildId, subscription);
                }
            }

            if (!subscription) {
                await interaction.followUp(
                    createErrorEmbed(
                        '🚩 Could not join a voice channel: `You need to join a voice channel for me to follow ➡️ Then try the resume command.`'
                    )
                );
                done(track);
                return;
            }

            try {
                await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
            } catch (err) {
                console.warn(err);
                error('Failed to join voice channel within 20 seconds, please try again later!');
                return;
            }
            done(track);
        }).catch((err) => {
            interaction.editReply(createErrorEmbed('🚩 Error adding track: `' + err + '`'));
        });
    }

    stop(interaction: CommandInteraction) {
        return new Promise(async (done, error) => {
            if (!this.generalCheck) {
                error('Not possible right now.');
                return;
            }
            let subscription = this.subscriptions.get(interaction.guildId!);
            subscription!.audioPlayer.stop();
            done;
            await interaction.reply(createEmbed('Stopped', '⏹️ Audio was stopped.'));
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error stopping track: `' + err + '`'));
        });
    }

    pause(interaction: CommandInteraction) {
        return new Promise(async (done, error) => {
            if (!this.generalCheck) {
                error('Not possible right now.');
                return;
            }
            let subscription = this.subscriptions.get(interaction.guildId!);
            subscription!.audioPlayer.pause();
            done;
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error pausing track: `' + err + '`'));
        });
    }

    resume(interaction: CommandInteraction) {
        return new Promise(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction!');
                return;
            }

            interaction.deferReply();

            let queue = this.queues.get(interaction.guildId);
            if (!queue) {
                await interaction.followUp(
                    createErrorEmbed('There is nothing to play! Add a track with the play command.')
                );
                error('No queue.');
                return;
            }

            let subscription = this.subscriptions.get(interaction.guildId);

            if (!subscription) {
                if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                    const channel = interaction.member.voice.channel;
                    subscription = new MusicSubscription(
                        joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
                        }),
                        queue
                    );
                    subscription.voiceConnection.on('error', console.warn);
                    this.subscriptions.set(interaction.guildId, subscription);
                }
            }

            if (!subscription) {
                await interaction.followUp(createErrorEmbed('You need to join a voice channel first!'));
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
            done;
        }).catch((err) => {
            interaction.editReply(createErrorEmbed('🚩 Error resuming track: `' + err + '`'));
        });
    }

    skip(interaction: CommandInteraction, amount: number) {
        return new Promise(async (done, error) => {
            if (!this.generalCheck) {
                error('Not possible right now.');
                return;
            }
            let subscription = this.subscriptions.get(interaction.guildId!);
            subscription!.audioPlayer.stop();
            done;
            //await interaction.reply('Skipped song!'); //TODO remove
        }).catch((err) => {
            interaction.editReply(createErrorEmbed('🚩 Error skipping track: `' + err + '`'));
        });
    }

    remove(interaction: CommandInteraction, positions: number[]) {
        return new Promise(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction.');
                return;
            }

            let queue = this.queues.get(interaction.guildId!);
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
            done;
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error removing track: `' + err + '`'));
        });
    }

    showQueue(interaction: CommandInteraction) {
        return new Promise<Queue>(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction.');
                return;
            }

            let queue = this.queues.get(interaction.guildId!);
            if (!queue || queue.length < 1) {
                error('Queue is empty.');
                return;
            }

            done(queue);
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error showing the queue: `' + err + '`'));
        });
    }

    clear(interaction: CommandInteraction) {
        return new Promise(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction.');
                return;
            }

            let queue = this.queues.get(interaction.guildId!);
            if (!queue || queue.length <= 1) {
                error('Queue is empty.');
                return;
            }

            queue.clear();
            done;
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
        });
    }

    shuffle(interaction: CommandInteraction) {
        return new Promise(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction.');
                return;
            }

            let queue = this.queues.get(interaction.guildId!);
            if (!queue) {
                error('Queue is empty.');
                return;
            }
            if (queue.length <= 1) {
                error('Queue has not enough tracks.');
                return;
            }

            queue.shuffle();
            done;
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error shuffling queue: `' + err + '`'));
        });
    }

    move(interaction: CommandInteraction, currentPos: number, targetPos: number) {
        return new Promise(async (done, error) => {
            if (!interaction.guildId) {
                error('Not a guild interaction.');
                return;
            }

            let queue = this.queues.get(interaction.guildId!);
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
            done;
        }).catch((err) => {
            interaction.reply(createErrorEmbed('🚩 Error moving tracks: `' + err + '`'));
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
     * Checks for guildId, subscription, queue, queue empty
     * @param interaction
     * @returns boolean
     */
    generalCheck(interaction: CommandInteraction): boolean {
        if (!interaction.guildId) return false;
        if (!this.subscriptions.get(interaction.guildId)) return false;
        if (!this.queues.get(interaction.guildId)) return false;
        if (this.queues.get(interaction.guildId)?.length == 0) return false;
        return true;
    }
}

export enum PlayerStatus {
    Playing,
    Paused,
    Stopped,
    Empty
}
