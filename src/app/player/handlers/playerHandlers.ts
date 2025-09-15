import { Track, Album } from '../modalalbum/modalalbum';
import { RECOMMENDED_TRACKS } from '../constants/playerConstants';

// Типы для обработчиков
// Интерфейс для глобального аудио контекста
interface GlobalAudioContext {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
}

export interface PlayerHandlersProps {
  currentTrack: Track | null;
  globalAudio: GlobalAudioContext;
  userTracks: Track[];
  addToUserTracks: (track: Track) => Promise<boolean>;
  removeFromUserTracks: (trackId: number) => Promise<boolean>;
  isTrackInUserTracks: (trackId: number) => boolean;
  reorderUserTracks: (fromIndex: number, toIndex: number) => void;
  createAlbum: (title: string, tracks: Track[]) => Promise<boolean>;
  volume: number;
  setters: {
    setIsMuted: (muted: boolean) => void;
    setVolumeBeforeMute: (volume: number) => void;
    setShowLyricsModal: (show: boolean) => void;
    setCurrentLyrics: (lyrics: string | null) => void;
    setShowPlaylistModal: (show: boolean) => void;
    setShowPlayerMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
    setSelectedAlbum: (album: Album | null) => void;
    setShowAlbumModal: (show: boolean) => void;
    setShowCreateAlbum: (show: boolean) => void;
    setIsDragEnabled: (enabled: boolean) => void;
    setDraggedTrack: (index: number | null) => void;
    setDragOverIndex: (index: number | null) => void;
  };
}

export class PlayerHandlers {
  private props: PlayerHandlersProps;

  constructor(props: PlayerHandlersProps) {
    this.props = props;
  }

  // Обработчики плеера
  handleAddToPlaylist = async () => {
    if (this.props.currentTrack) {
      const success = await this.props.addToUserTracks(this.props.currentTrack);
      if (success) {
        console.log('Трек добавлен в плейлист:', this.props.currentTrack.title);
      }
    }
  };

  togglePlayerMenu = () => {
    this.props.setters.setShowPlayerMenu((prev: boolean) => !prev);
  };

  toggleMute = () => {
    if (this.props.globalAudio.audioRef.current) {
      const { setIsMuted, setVolumeBeforeMute } = this.props.setters;
      
      if (this.props.globalAudio.volume === 0) {
        // Включаем звук
        setIsMuted(false);
        this.props.globalAudio.setVolume(this.props.volume || 0.6);
      } else {
        // Выключаем звук
        setIsMuted(true);
        setVolumeBeforeMute(this.props.volume);
        this.props.globalAudio.setVolume(0);
      }
    }
  };

  handleLyricsClick = () => {
    if (!this.props.currentTrack) return;

    const lyrics = (this.props.currentTrack as Track & { lyrics?: string })?.lyrics || null;
    
    if (lyrics) {
      this.props.setters.setCurrentLyrics(lyrics);
      this.props.setters.setShowLyricsModal(true);
    } else {
      this.props.setters.setCurrentLyrics(null);
      this.props.setters.setShowLyricsModal(true);
    }
  };

  // Обработчики рекомендаций
  handleAddRecommendedTracks = async () => {
    let addedCount = 0;
    
    for (const track of RECOMMENDED_TRACKS) {
      if (!this.props.isTrackInUserTracks(track.id)) {
        const success = await this.props.addToUserTracks(track);
        if (success) {
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      console.log(`Добавлено ${addedCount} рекомендованных треков в "Мои треки"`);
    } else {
      console.log('Все рекомендованные треки уже есть в "Мои треки"');
    }
  };

  // Обработчики модальных окон
  handleOpenPlaylistModal = () => {
    if (this.props.userTracks.length === 0) {
      console.log('Нет треков для добавления в плейлист');
      return;
    }
    this.props.setters.setShowPlaylistModal(true);
  };

  handleOpenAlbum = (album: Album) => {
    console.log('Opening album:', album.title);
    this.props.setters.setSelectedAlbum(album);
    this.props.setters.setShowAlbumModal(true);
  };

  // Обработчики Drag & Drop
  handleDragStart = (e: React.DragEvent, index: number, isDragEnabled: boolean) => {
    if (!isDragEnabled) {
      e.preventDefault();
      return;
    }
    this.props.setters.setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.props.setters.setDragOverIndex(index);
  };

  handleDragLeave = () => {
    this.props.setters.setDragOverIndex(null);
  };

  handleDrop = (e: React.DragEvent, dropIndex: number, draggedTrack: number | null) => {
    e.preventDefault();
    if (draggedTrack !== null && draggedTrack !== dropIndex) {
      this.props.reorderUserTracks(draggedTrack, dropIndex);
    }
    this.props.setters.setDraggedTrack(null);
    this.props.setters.setDragOverIndex(null);
  };

  handleDragEnd = () => {
    this.props.setters.setDraggedTrack(null);
    this.props.setters.setDragOverIndex(null);
  };

  // Утилитарные обработчики
  toggleDragMode = (isDragEnabled: boolean) => {
    this.props.setters.setIsDragEnabled(!isDragEnabled);
    console.log(isDragEnabled ? 'Перетаскивание отключено' : 'Перетаскивание включено');
  };


  // Обработчики меню плеера
  handleCopyTrackInfo = () => {
    if (this.props.currentTrack) {
      navigator.clipboard.writeText(`${this.props.currentTrack.title} - ${this.props.currentTrack.artist}`);
      console.log('Информация о треке скопирована');
    }
    this.props.setters.setShowPlayerMenu(false);
  };

  handleShareTrack = () => {
    console.log('Поделиться треком');
    this.props.setters.setShowPlayerMenu(false);
  };

  handleOpenCreateAlbumFromMenu = () => {
    this.props.setters.setShowCreateAlbum(true);
    this.props.setters.setShowPlayerMenu(false);
  };

  // Обработчики прогресса и громкости
  handleGlobalProgressClick = (e: React.MouseEvent<HTMLDivElement>, isDragging: boolean, duration: number, currentTrack: Track | null) => {
    if (!isDragging && this.props.globalAudio.audioRef.current && duration > 0 && currentTrack) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
      this.props.globalAudio.setCurrentTime(newTime);
    }
  };

  handleGlobalVolumeChange = (e: React.MouseEvent<HTMLDivElement>, isDraggingVolume: boolean) => {
    if (!isDraggingVolume) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, clickX / width));
      this.props.globalAudio.setVolume(newVolume);
    }
  };
}

// Фабрика для создания обработчиков
export const createPlayerHandlers = (props: PlayerHandlersProps) => {
  return new PlayerHandlers(props);
};
