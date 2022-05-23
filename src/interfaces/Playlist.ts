import { Track } from "../classes";

export interface Playlist {
    name: string;
    url: string;
    announce: boolean;
    description: string;
    thumbnailUrl: string;
    channelTitle: string;
    publishedAt: string;
    itemCount: number;
}