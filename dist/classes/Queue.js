"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue extends Array {
    get first() {
        return this[0];
    }
    get last() {
        return this[this.length - 1];
    }
    queue(item) {
        this.push(item);
    }
    dequeue(item) {
        if (item) {
            let idx = this.indexOf(item);
            if (idx > -1) {
                this.splice(idx, 1);
            }
            return item;
        }
        else {
            return this.shift();
        }
    }
    clear() {
        this.length = 0;
    }
    shuffle() {
        let currentIndex = this.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = this[currentIndex];
            this[currentIndex] = this[randomIndex];
            this[randomIndex] = temporaryValue;
        }
    }
    move(key1, key2) {
        if (key1 != key2) {
            this.splice(key2, 0, this.splice(key1, 1)[0]);
        }
    }
}
exports.Queue = Queue;
//# sourceMappingURL=Queue.js.map