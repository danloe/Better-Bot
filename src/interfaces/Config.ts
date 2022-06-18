export interface Config {
    hostUserId: string;
    debug: boolean;
    verboseLogging: boolean;
    disableWriteLog: boolean;
    prefix: string;
    activityName: string;
    activityType: string;
    status: string;
    errorEmbedMessage: string;
    defaultVolume: number;
    voiceVolumeMultiplier: number;
    gameLobbyInteractionTimeout: number;
    ticTacToe_thumbnail: string;
    ticTacToe_charField: string;
    ticTacToe_charX: string;
    ticTacToe_charO: string;
    fourWins_thumbnail: string;
    fourWins_charField: string;
    fourWins_charRed: string;
    fourWins_charYellow: string;
    trivia_thumbnail: string;
    findTheEmoji_thumbnail: string;
    trackDescriptionLengthLimit: number;
    nowPlayingTrackBarSize: number;
    loadingBarSize: number;
    postAnnouncementChance: number;
    announcements: string[];
    postAnnouncements: string[];
    youTubeGeneratedLists: YouTubePlaylist[];
}

interface YouTubePlaylist {
    name: string;
    id: string;
}
