import { Track } from "../interfaces/Track";
export declare class Queue extends Array<Track> {
    get first(): Track;
    get last(): Track;
    queue(item: Track): void;
    dequeue(item?: Track): Track;
    clear(): void;
    shuffle(): void;
    move(key1: number, key2: number): void;
}
