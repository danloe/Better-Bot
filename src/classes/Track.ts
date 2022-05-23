import { AudioResource, createAudioResource, demuxProbe, StreamType } from '@discordjs/voice';
import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';

export class Track {
    type: TrackType;
    url: string;
    name: string;
    requestor: string;
    announce: boolean;
    displayUrl: string;
    duration: number;
    artworkUrl: string;
    description: string;
    genre: string;
    uploaded: string;

    constructor(
        type: TrackType,
        url: string,
        name: string,
        requestor: string,
        announce: boolean,
        displayUrl: string = '',
        duration: number = 0,
        artworkUrl: string = '',
        description: string = 'Not available.',
        genre: string = 'Unknown',
        uploaded: string = 'Unknown'
    ) {
        this.type = type;
        this.url = url;
        this.name = name;
        this.requestor = requestor;
        this.announce = announce;
        this.displayUrl = displayUrl;
        this.duration = duration;
        this.artworkUrl = artworkUrl;
        this.description = description;
        this.genre = genre;
        this.uploaded = uploaded;
    }

    public createAudioResource(): Promise<AudioResource<Track>> {
        return new Promise(async (resolve, reject) => {
            try {
                let stream: any;
                switch (this.type) {
                    case TrackType.YouTube:
                        stream = ytdl(this.url, {
                            filter: 'audioonly',
                            highWaterMark: 1 << 22
                        });
                        demuxProbe(stream).then((probe: { stream: any; type: any }) => {
                            resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type }));
                        });
                        return;

                    case TrackType.SoundCloud:
                        stream = await scdl.downloadFormat(
                            this.url,
                            scdl.FORMATS.MP3
                            //process.env.SC_CLIENTID
                        );
                        demuxProbe(stream).then((probe: { stream: any; type: any }) => {
                            resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type }));
                        });
                        return;

                    case TrackType.Newgrounds:
                        stream = this.url;
                        break;

                    case TrackType.DirectFile:
                        stream = this.url;
                        break;
                }
                const resource = createAudioResource(stream, { metadata: this, inputType: StreamType.Arbitrary });
                resolve(resource);
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }
}

export enum TrackType {
    DirectFile,
    YouTube,
    YouTubePlaylist,
    SoundCloud,
    Newgrounds
}
