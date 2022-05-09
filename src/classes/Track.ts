import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import scdl from 'soundcloud-downloader';
import ytdl from 'ytdl-core';

export class Track {
    type: TrackType;
    url: string;
    name: string;
    requestor: string;
    announce: boolean;
    displayUrl: string;
    duration: string;
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
        duration: string = '',
        artworkUrl: string = '',
        description: string = '',
        genre: string = '',
        uploaded: string = ''
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
                        break;

                    case TrackType.SoundCloud:
                        stream = await scdl.downloadFormat(
                            this.url,
                            scdl.FORMATS.MP3
                            //process.env.SC_CLIENTID
                        );
                        break;

                    case TrackType.Newgrounds:
                        stream = this.url;
                        break;

                    case TrackType.DirectFile:
                        stream = this.url;
                        break;
                }
                demuxProbe(stream).then((probe: { stream: any; type: any }) => {
                    resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type }));
                });
            } catch (error) {
                console.log(error);
                reject();
            }
        });
    }
}

export enum TrackType {
    DirectFile,
    YouTube,
    SoundCloud,
    Newgrounds
}
