export interface Track {
    type: TrackType;
    url: string;
    name: string;
    requestor: string;
    duration: number;
    announce: boolean;
}
export declare enum TrackType {
    DirectFile = 0,
    YouTube = 1,
    SoundCloud = 2,
    Newgrounds = 3
}
