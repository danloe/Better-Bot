import { createEmbed, createErrorEmbed, determineTrackType, getNewgroundsTrack, getSoundCloudTrack, getYouTubeTrack } from '../helpers';
import { Readable } from 'stream';
import { Channel, CommandInteraction, Interaction, Snowflake } from 'discord.js';
import BetterClient from '../client';
import { MusicSubscription } from './MusicSubscription';
import { Queue } from './Queue';
import { Track, TrackType } from './Track';

export class MusicManager {
    client: BetterClient;
    subscriptions: Map<Snowflake, MusicSubscription> = new Map<Snowflake, MusicSubscription>();
    queues: Map<Snowflake, Queue> = new Map<Snowflake, Queue>();

    constructor(client: BetterClient) {
        this.client = client;
    }

    getSubscription(guildId: Snowflake) {
        return this.subscriptions.get(guildId);
    }

    addMedia(interaction: CommandInteraction, args: string,announce:boolean) {
        return new Promise((done, error) => {
            let type = determineTrackType(args);

            let track: Track;

            switch(type) {
                case TrackType.YouTube:
                    track = await getYouTubeTrack(args,interaction.user.username,announce);
                    break;

                case TrackType.SoundCloud:
                    track = await getSoundCloudTrack(args,interaction.user.username,announce);
                    break;

                case TrackType.Newgrounds:
                    track = await getNewgroundsTrack(args,interaction.user.username,announce);
                    break;

                case TrackType.DirectFile:
                    track = new Track(TrackType.DirectFile,args,'Unknown File', interaction.user.username, announce,0,'','The requestor provided a direct file link. No information available.');
                    break;
            }

            let queue = this.queues.get(interaction.guildId!);
            if(!queue) this.queues.set(interaction.guildId!, new Queue);
            queue = this.queues.get(interaction.guildId!);
            queue!.queue(track);

            await interaction.reply("`➕ " + track.name + " was added to the queue. [" + queue!.length + " total]`");

            })
            .catch((err) => {
                    interaction.reply(createErrorEmbed(`Error adding track: ${err}`));
            });
    }

    at(idx: number) {
        return this.queue[idx];
    }

    remove(item: MediaItem) {
        if (item == this.queue.first && (this.playing || this.paused)) {
            this.stop();
        }
        this.queue.dequeue(item);
        this.determineStatus();
        if (this.channel) {
            this.channel.send(createInfoEmbed(`Track Removed`, `${item.name}`));
        }
    }

    clear() {
        if (this.playing || this.paused) {
            this.stop();
        }
        this.queue.clear();
        this.determineStatus();
        if (this.channel) {
            this.channel.send(createInfoEmbed(`Playlist Cleared`));
        }
    }

    dispatchStream(stream: Readable, item: MediaItem) {
        if (this.dispatcher) {
            this.dispatcher.end();
            this.dispatcher = null;
        }
        this.dispatcher = this.connection.play(stream, {
            seek: this.config.stream.seek,
            volume: this.config.stream.volume,
            bitrate: this.config.stream.bitrate,
            fec: this.config.stream.forwardErrorCorrection,
            plp: this.config.stream.packetLossPercentage,
            highWaterMark: 1 << 25
        });
        this.dispatcher.on('start', async () => {
            this.playing = true;
            this.determineStatus();
            if (this.channel) {
                const msg = await this.channel.send(
                    createEmbed()
                        .setTitle('▶️ Now playing')
                        .setDescription(`${item.name}`)
                        .addField('Requested By', `${item.requestor}`)
                );
                msg.react(this.config.emojis.stopSong);
                msg.react(this.config.emojis.playSong);
                msg.react(this.config.emojis.pauseSong);
                msg.react(this.config.emojis.skipSong);
            }
        });
        this.dispatcher.on('debug', (info: string) => {
            this.logger.debug(info);
        });
        this.dispatcher.on('error', (err) => {
            this.skip();
            this.logger.error(err);
            if (this.channel) {
                this.channel.send(createErrorEmbed(`Error Playing Song: ${err}`));
            }
        });
        this.dispatcher.on('close', () => {
            this.logger.debug(`Stream Closed`);
            if (this.dispatcher) {
                this.playing = false;
                this.dispatcher = null;
                this.determineStatus();
                if (!this.stopping) {
                    let track = this.queue.dequeue();
                    if (this.config.queue.repeat) {
                        this.queue.enqueue(track);
                    }
                    setTimeout(() => {
                        this.play();
                    }, 1000);
                }
                this.stopping = false;
            }
        });
        this.dispatcher.on('finish', () => {
            this.logger.debug('Stream Finished');
            if (this.dispatcher) {
                this.playing = false;
                this.dispatcher = null;
                this.determineStatus();
                if (!this.stopping) {
                    let track = this.queue.dequeue();
                    if (this.config.queue.repeat) {
                        this.queue.enqueue(track);
                    }
                    setTimeout(() => {
                        this.play();
                    }, 1000);
                }
                this.stopping = false;
            }
        });
        this.dispatcher.on('end', (reason: string) => {
            this.logger.debug(`Stream Ended: ${reason}`);
        });
    }

    play() {
        if (this.queue.length == 0 && this.channel) {
            this.channel.send(createInfoEmbed(`Queue is empty! Add some songs!`));
        }
        if (this.playing && !this.paused) {
            this.channel.send(createInfoEmbed(`Already playing a song!`));
        }
        let item = this.queue.first;
        if (item && this.connection) {
            let type = this.typeRegistry.get(item.type);
            if (type) {
                if (!this.playing) {
                    type.getStream(item).then((stream) => {
                        this.dispatchStream(stream, item);
                    });
                } else if (this.paused && this.dispatcher) {
                    this.dispatcher.resume();
                    this.paused = false;
                    this.determineStatus();
                    if (this.channel) {
                        this.channel.send(createInfoEmbed(`⏯️ "${this.queue.first.name}" resumed`));
                    }
                }
            }
        }
    }

    stop() {
        if (this.playing && this.dispatcher) {
            let item = this.queue.first;
            this.stopping = true;
            this.paused = false;
            this.playing = false;
            this.dispatcher.pause();
            this.dispatcher.destroy();
            this.determineStatus();
            if (this.channel) this.channel.send(createInfoEmbed(`⏹️ "${item.name}" stopped`));
        }
    }

    skip() {
        if (this.playing && this.dispatcher) {
            let item = this.queue.first;
            this.paused = false;
            this.dispatcher.pause();
            this.dispatcher.destroy();
            if (this.channel) {
                this.channel.send(createInfoEmbed(`⏭️ "${item.name}" skipped`));
            }
        } else if (this.queue.length > 0) {
            let item = this.queue.first;
            this.queue.dequeue();
            if (this.channel) {
                this.channel.send(createInfoEmbed(`⏭️ "${item.name}" skipped`));
            }
        }
        this.determineStatus();
    }

    pause() {
        if (this.playing && !this.paused && this.dispatcher) {
            this.dispatcher.pause();
            this.paused = true;
            this.determineStatus();
            if (this.channel) {
                this.channel.send(createInfoEmbed(`⏸️ "${this.queue.first.name}" paused`));
            }
        }
    }

    shuffle() {
        if (this.playing || this.paused) {
            this.stop();
        }
        this.queue.shuffle();
        this.determineStatus();
        if (this.channel) {
            this.channel.send(createInfoEmbed(`🔀 Queue Shuffled`));
        }
    }

    move(currentIdx: number, targetIdx: number) {
        let max = this.queue.length - 1;
        let min = 0;
        currentIdx = Math.min(Math.max(currentIdx, min), max);
        targetIdx = Math.min(Math.max(targetIdx, min), max);

        if (currentIdx != targetIdx) {
            this.queue.move(currentIdx, targetIdx);
            this.determineStatus();
        }
    }

    setVolume(volume: number) {
        volume = Math.min(Math.max(volume / 100 + 0.5, 0.5), 2);
        this.config.stream.volume = volume;
        if (this.dispatcher) {
            this.dispatcher.setVolume(volume);
        }
    }

    getVolume() {
        return (this.config.stream.volume - 0.5) * 100 + '%';
    }
/*
    determineStatus() {
        let item = this.queue.first;
        if (item) {
            if (this.playing) {
                if (this.paused) {
                    this.status.setBanner(`Paused: "${item.name}" Requested by: ${item.requestor}`);
                } else {
                    this.status.setBanner(
                        `Now Playing: "${item.name}" Requested by: ${item.requestor}${
                            this.queue.length > 1 ? `, Up Next "${this.queue[1].name}"` : ''
                        }`
                    );
                }
            } else {
                this.status.setBanner(`Up Next: "${item.name}" Requested by: ${item.requestor}`);
            }
        } else {
            this.status.setBanner(`No Songs In Queue`);
        }
    }
}*/

export enum PlayerStatus {
    Playing,
    Paused,
    Stopped,
    Empty
}