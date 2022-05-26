import BetterClient from '../client';
import fetch from 'node-fetch';

export async function getSpotifyAuthorizationToken(client: BetterClient, reject: (reason?: any) => void) {
    await fetch('https://accounts.spotify.com/api/token?grant_type=client_credentials', {
        method: 'POST',
        headers: {
            Authorization:
                'Basic ' +
                Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then((response) => response.json())
        .then((data: any) => {
            if (data?.error) reject('Spotify API Authorization failed.');
            client.SpotifyAuthorization = data.token_type + ' ' + data.access_token;
            client.SpotifyAuthorizationTimeout = new Date(new Date().getTime() + data.expires_in * 1000);
        })
        .catch((reason) => {
            reject(reason);
        });
}

export async function getSpotifyTracksApiResponse(
    client: BetterClient,
    url: string,
    reject: (reason?: any) => void
): Promise<any> {
    if (client.SpotifyAuthorization == '' || client.SpotifyAuthorizationTimeout < new Date()) {
        await getSpotifyAuthorizationToken(client, reject);
    }
    const apiUrl = 'https://api.spotify.com/v1/tracks/';
    const trackId = url.match(/(?<=track\/)([a-zA-Z0-9-_]+)?/)![0];
    const requestUrl = apiUrl + trackId;
    let response: any = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            Authorization: client.SpotifyAuthorization
        }
    });
    response = await response.json();
    if (response!.error) reject('Track not found. Is it available in our market?');
    return response;
}

export async function getSpotifyPlaylistsApiResponse(
    client: BetterClient,
    url: string,
    reject: (reason?: any) => void
): Promise<any> {
    if (client.SpotifyAuthorization == '' || client.SpotifyAuthorizationTimeout < new Date()) {
        await getSpotifyAuthorizationToken(client, reject);
    }
    const apiUrl = 'https://api.spotify.com/v1/playlists/';
    const playlistId = url.match(/(?<=playlist\/)([a-zA-Z0-9-_]+)?/)![0];
    const fields =
        '?fields=name,description,owner,external_urls,id,images,tracks.items(track(album(images),artists,duration_ms,name))';
    const requestUrl = apiUrl + playlistId + fields;
    let response: any = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            Authorization: client.SpotifyAuthorization
        }
    });
    response = await response.json();
    if (response!.error) reject('Playlist not found. Is it private?');
    return response;
}
