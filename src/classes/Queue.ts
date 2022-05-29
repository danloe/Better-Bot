import { MessageActionRow, MessageButton, MessageEmbed, MessagePayload } from 'discord.js';
import { MusicSubscription } from './MusicSubscription';
import { Track } from './Track';

export class Queue extends Array<Track> {
    public currentPage: number = 1;
    public totalPages: number = 1;

    get first(): Track {
        return this[0];
    }

    get last(): Track {
        return this[this.length - 1];
    }

    queue(item: Track): void {
        this.push(item);
        this.updateQueuePages();
    }

    next(item: Track): void {
        this.push(item);
        this.move(this.length - 1, 0);
        this.updateQueuePages();
    }

    dequeue(item?: Track): Track {
        if (item) {
            let idx = this.indexOf(item);
            if (idx > -1) {
                this.splice(idx, 1);
            }
            this.updateQueuePages();
            return item;
        } else {
            let i = this.shift()!;
            this.updateQueuePages();
            return i;
        }
    }

    remove(position: number, amount: number = 1) {
        if (position > 0 && this.queue.length >= position) {
            this.splice(position - 1, amount);
        }
        this.updateQueuePages();
    }

    clear() {
        this.length = 0;
        this.updateQueuePages();
    }

    shuffle() {
        let currentIndex = this.length,
            temporaryValue,
            randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = this[currentIndex];
            this[currentIndex] = this[randomIndex];
            this[randomIndex] = temporaryValue;
        }
    }

    move(key1: number, key2: number) {
        if (key1 != key2) {
            this.splice(key2, 0, this.splice(key1, 1)[0]);
        }
    }

    getQueueMessageEmbed(subscription: MusicSubscription): MessageEmbed {
        let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Queue');

        if (subscription) {
            if (subscription.currentTrack) {
                embedmsg
                    .addField(
                        'Now playing:',
                        '`' +
                            subscription.currentTrack.name +
                            '`\n' +
                            subscription.currentTrack.requestor +
                            ' | ' +
                            subscription.currentTrack.displayUrl
                    )
                    .setThumbnail(subscription.currentTrack.artworkUrl);
            }
        }

        if (this.length > 0) {
            embedmsg.addField('\u200B', '**Tracks in queue:**');

            for (let i = this.currentPage * 10 - 10; i < this.currentPage * 10; i++) {
                if (i == this.length) break;
                embedmsg.addField(
                    i + 1 + ': `' + this[i].name + '`',
                    this[i].requestor + (this[i].announce ? ' 📣' : '') + ' | ' + this[i].displayUrl
                );
            }

            if (this.length > 10) {
                embedmsg.addField('\u200B', '`∑ ' + String(this.length) + ' Tracks`');
            }
        } else {
            embedmsg.addField('\u200B', '`The queue is empty.`');
        }
        return embedmsg;
    }

    getQueueMessageRow(): MessageActionRow {
        const row = new MessageActionRow().addComponents([
            new MessageButton()
                .setCustomId('queue_previous')
                .setEmoji('⬅️')
                .setStyle('SECONDARY')
                .setDisabled(this.currentPage <= 1),
            new MessageButton().setCustomId('queue_skip').setEmoji('⏭️').setStyle('SECONDARY'),
            new MessageButton().setCustomId('queue_clear').setEmoji('🚮').setStyle('DANGER'),
            new MessageButton().setCustomId('queue_shuffle').setEmoji('🔀').setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('queue_next')
                .setEmoji('➡️')
                .setStyle('SECONDARY')
                .setDisabled(this.currentPage >= this.totalPages)
        ]);
        return row;
    }

    private updateQueuePages() {
        this.totalPages = Math.ceil(this.length / 10);
    }

    hasTracks(): boolean {
        return this.length > 0;
    }
}
