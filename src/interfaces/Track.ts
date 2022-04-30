export interface Track {
  type: TrackType;
  url: string;
  name: string;
  requestor: string;
  duration: number;
  announce: boolean;
}

export enum TrackType {
  DirectFile,
  YouTube,
  SoundCloud,
  Newgrounds,
}
