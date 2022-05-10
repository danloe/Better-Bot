import {
    createErrorEmbed,
    replyDefer as deferReply,
    determineTrackType,
    getNewgroundsTrack,
    getSoundCloudTrack,
    getYouTubeTrack,
    replyInteraction
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
const discordTTS = require("discord-tts");
//import discordTTS from 'discord-tts';

export class MusicManager {
    client: BetterClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();
    queues: Map<Snowflake, Queue> = new Map<Snowflake, Queue>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    play(interaction: CommandInteraction | ButtonInteraction, args: string, announce: boolean) {
        return new Promise<Track>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

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
                    let domainName = args.replace(/.+\/\/|www.|\..+/g, '');
                    let images = await google.image(domainName, { safe: false });
                    const imageUrl = images[0].url;

                    track = new Track(
                        TrackType.DirectFile,
                        args,
                        'Unknown File',
                        interaction.user.username,
                        announce,
                        args,
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
            queue!.queue(track);

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
                    this.subscriptions.set(interaction.guildId!, subscription);
                }
            }

            if (!subscription) {
                await replyInteraction(
                    interaction,
                    createErrorEmbed(
                        '🚩 Could not join a voice channel: `You must first join a voice channel for me to follow you. ➡️ Then try the resume command.`'
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
            
            subscription.play();
            done(track);
        });
    }

    say(interaction: CommandInteraction | ButtonInteraction, phrase: string) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!queue) this.queues.set(interaction.guildId!, new Queue());
            queue = this.queues.get(interaction.guildId!);

            if (!subscription) {
                if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
                    const channel = interaction.member.voice.channel;
                    subscription = new MusicSubscription(
                        joinVoiceChannel({
                            channelId: channel.id,
                            guildId: channel.guild.id,
                            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
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
                lang: 'en',
                slow: false
            });

            const audioResource = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
            subscription!.playVoice(audioResource);
            done();
        });
    }

    stop(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!subscription) {
                error('Not playing anything.');
                return;
            }

            subscription!.audioPlayer.stop();
            done();
        });
    }

    pause(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!subscription) {
                error('Not playing anything.');
                return;
            }

            subscription!.audioPlayer.pause();
            done();
        });
    }

    resume(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!subscription) {
                error('Not playing anything.');
                return;
            }

            if (!subscription) {
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
                            adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // TODO: remove cast when fixed
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
        });
    }

    skip(interaction: CommandInteraction | ButtonInteraction, amount: number) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
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
            done();
        });
    }

    remove(interaction: CommandInteraction | ButtonInteraction, positions: number[]) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
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
        });
    }

    showQueue(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<Queue>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!queue || queue.length < 1) {
                error('Queue is empty.');
                return;
            }

            done(queue);
        });
    }

    clear(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
            let [subscription, queue] = this.getSubscriptionAndQueue(interaction);

            if (!queue || queue.length < 1) {
                error('Queue is empty.');
                return;
            }

            queue.clear();
            done();
        });
    }

    shuffle(interaction: CommandInteraction | ButtonInteraction) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
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
        });
    }

    move(interaction: CommandInteraction | ButtonInteraction, currentPos: number, targetPos: number) {
        return new Promise<void>(async (done, error) => {
            await deferReply(interaction);
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
    getSubscriptionAndQueue(
        interaction: CommandInteraction | ButtonInteraction
    ): [MusicSubscription | undefined, Queue | undefined] {
        if (!interaction.guildId) return [undefined, undefined];
        const subscription = this.subscriptions.get(interaction.guildId);
        if (!subscription) return [undefined, undefined];
        const queue = this.queues.get(interaction.guildId);
        if (!queue) return [subscription, undefined];
        subscription.lastChannel = interaction.channel;
        return [subscription, queue];
    }
}

export enum PlayerStatus {
    Playing,
    Paused,
    Stopped,
    Empty
}
