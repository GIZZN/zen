export interface ProfileStats {
  tracks: number;
  playlists: number;
  hoursListened: number;
}

export interface ActivityItem {
  type: string;
  text: string;
  time: string;
  ip?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  coverUrl: string | null;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  lastLogin: string | null;
  stats: ProfileStats;
  playlists: Playlist[];
  activity: ActivityItem[];
}

export interface ProfileTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioSrc?: string;
  duration: string;
}

export interface ProfileAlbum {
  id: number;
  title: string;
  cover: string;
  trackCount: number;
  tracks: ProfileTrack[];
  createdAt: Date;
}
