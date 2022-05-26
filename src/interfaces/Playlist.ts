export interface Playlist {
    type: PlaylistType;
    name: string;
    url: string;
    announce: boolean;
    description: string;
    thumbnailUrl: string;
    owner: string;
    publishedAt: string;
    itemCount: number;
}

export enum PlaylistType {
    YouTube,
    SpotifyPlaylist,
    SpotifyAlbum
}
