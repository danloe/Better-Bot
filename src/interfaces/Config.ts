export interface Config {
    general: GeneralSettings;
    games: GamesSettings;
    music: MusicSettings;
}

interface GeneralSettings {
    hostUserId: string;
    prefix: string;
    activityName: string;
    activityType: string;
    status: string;
    errorEmbedMessage: string;
    debug: boolean;
    verboseLogging: boolean;
    disableWriteLog: boolean;
}

interface MusicSettings {
    defaultVolume: number;
    minVolume: number;
    maxVolume: number;
    voiceVolumeMultiplier: number;
    trackDescriptionLengthLimit: number;
    nowPlayingMessageInteractionTimeout: number;
    nowPlayingTrackBarSize: number;
    loadingBarSize: number;
    postAnnouncementChance: number;
    preTrackAnnouncements: string[];
    postTrackAnnouncements: string[];
    youTubeGeneratedLists: YouTubePlaylist[];
}

interface GamesSettings {
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
    fastTyper_thumbnail: string;
}

interface YouTubePlaylist {
    name: string;
    id: string;
}
