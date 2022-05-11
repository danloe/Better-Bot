import { Track } from './Track';

export class Queue extends Array<Track> {
    get first(): Track {
        return this[0];
    }

    get last(): Track {
        return this[this.length - 1];
    }

    queue(item: Track): void {
        this.push(item);
    }

    next(item: Track): void {
        this.push(item);
        this.move(this.length - 1, 0);
    }

    dequeue(item?: Track): Track {
        if (item) {
            let idx = this.indexOf(item);
            if (idx > -1) {
                this.splice(idx, 1);
            }
            return item;
        } else {
            return this.shift()!;
        }
    }

    remove(position: number, amount: number = 1) {
        if (position > 0 && this.queue.length >= position) {
            this.splice(position - 1, amount);
        }
    }

    clear() {
        this.length = 0;
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
}
