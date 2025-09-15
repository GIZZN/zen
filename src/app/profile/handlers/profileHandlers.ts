import { ProfileData, ProfileAlbum } from '../types/profileTypes';

interface Router {
  push: (path: string) => void;
}

interface GlobalAudio {
  playTrack: (track: { id: number; title: string; artist: string; cover: string; audioSrc?: string; duration: string }) => void;
  updateTrackList: (tracks: { id: number; title: string; artist: string; cover: string; audioSrc?: string; duration: string }[]) => void;
}

export interface ProfileHandlersProps {
  router: Router;
  globalAudio: GlobalAudio;
  setProfileData: (data: ProfileData | null) => void;
  setEditData: (data: { name: string; bio: string; location: string; website: string }) => void;
  setProfileLoading: (loading: boolean) => void;
  setSaveLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setIsEditing: (editing: boolean) => void;
  setSelectedAlbum: (album: ProfileAlbum | null) => void;
  setShowAlbumModal: (show: boolean) => void;
}

export class ProfileHandlers {
  private props: ProfileHandlersProps;

  constructor(props: ProfileHandlersProps) {
    this.props = props;
  }

  // Функция загрузки профиля
  fetchProfile = async () => {
    try {
      this.props.setProfileLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки профиля');
      }

      const data = await response.json();
      this.props.setProfileData(data.profile);
      this.props.setEditData({
        name: data.profile.name,
        bio: data.profile.bio,
        location: data.profile.location,
        website: data.profile.website
      });
    } catch (err) {
      this.props.setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      this.props.setProfileLoading(false);
    }
  };

  // Функция сохранения профиля
  saveProfile = async (editData: { name: string; bio: string; location: string; website: string }, profileData: ProfileData | null) => {
    try {
      this.props.setSaveLoading(true);
      this.props.setError('');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения профиля');
      }

      const data = await response.json();
      
      // Обновляем локальные данные
      if (profileData) {
        this.props.setProfileData({
          ...profileData,
          name: data.profile.name,
          bio: data.profile.bio,
          location: data.profile.location,
          website: data.profile.website
        });
      }
      
      this.props.setIsEditing(false);
    } catch (err) {
      this.props.setError(err instanceof Error ? err.message : 'Ошибка сохранения профиля');
    } finally {
      this.props.setSaveLoading(false);
    }
  };

  // Функция для воспроизведения альбома
  handlePlayAlbum = async (playlistId: string) => {
    try {
      if (!playlistId.startsWith('album_')) {
        console.log('Not an album, skipping playback');
        return;
      }

      const albumId = playlistId.replace('album_', '');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/user-albums', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch albums');
        return;
      }

      const data = await response.json();
      const album = data.albums.find((a: { id: number }) => a.id.toString() === albumId);
      
      if (!album || !album.tracks || album.tracks.length === 0) {
        console.error('Album not found or has no tracks');
        return;
      }

      console.log('Playing album:', album.title, 'with', album.tracks.length, 'tracks');
      
      if (this.props.globalAudio && this.props.globalAudio.playTrack && this.props.globalAudio.updateTrackList) {
        console.log('Setting track list and playing first track...');
        this.props.globalAudio.updateTrackList(album.tracks);
        this.props.globalAudio.playTrack(album.tracks[0]);
      } else {
        console.error('GlobalAudio not available for overlay play');
      }
      
      this.props.router.push('/player');
    } catch (error) {
      console.error('Error playing album:', error);
    }
  };

  // Функция для открытия альбома
  handleOpenAlbum = async (playlistId: string) => {
    try {
      if (!playlistId.startsWith('album_')) {
        console.log('Not an album, skipping');
        return;
      }

      const albumId = playlistId.replace('album_', '');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/user-albums', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch albums');
        return;
      }

      const data = await response.json();
      const album = data.albums.find((a: { id: number }) => a.id.toString() === albumId);
      
      if (!album || !album.tracks || album.tracks.length === 0) {
        console.error('Album not found or has no tracks');
        return;
      }

      this.props.setSelectedAlbum(album);
      this.props.setShowAlbumModal(true);
    } catch (error) {
      console.error('Error opening album:', error);
    }
  };

  handleCreatePlaylist = () => {
    this.props.router.push('/player');
  };

  handleCancelEdit = (profileData: ProfileData | null) => {
    if (profileData) {
      this.props.setEditData({
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website
      });
    }
    this.props.setIsEditing(false);
    this.props.setError('');
  };
}

export const createProfileHandlers = (props: ProfileHandlersProps) => {
  return new ProfileHandlers(props);
};
