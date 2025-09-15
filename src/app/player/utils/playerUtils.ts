import { Track } from '../modalalbum/modalalbum';
import { EQUALIZER_CONFIG } from '../constants/playerConstants';

// Утилиты для эквалайзера
export const generateEqualizerBars = () => {
  return Array.from({ length: EQUALIZER_CONFIG.BARS_COUNT }, (_, i) => ({
    key: i,
    animationDelay: `${(i * EQUALIZER_CONFIG.BASE_ANIMATION_DELAY)}s`,
    animationDuration: `${EQUALIZER_CONFIG.BASE_ANIMATION_DURATION + (i % EQUALIZER_CONFIG.ANIMATION_VARIATION_STEPS) * EQUALIZER_CONFIG.ANIMATION_VARIATION}s`
  }));
};

// Утилиты для обработки событий
export const createClickOutsideHandler = (
  showPlayerMenu: boolean,
  showLyricsModal: boolean,
  showPlaylistModal: boolean,
  setters: {
    setShowPlayerMenu: (show: boolean) => void;
    setShowLyricsModal: (show: boolean) => void;
    setShowPlaylistModal: (show: boolean) => void;
  }
) => {
  return (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    if (!target.closest('.menu-btn') && showPlayerMenu) {
      setters.setShowPlayerMenu(false);
    }
    
    if (!target.closest('.lyrics-modal-content') && showLyricsModal) {
      setters.setShowLyricsModal(false);
    }
    
    if (showPlaylistModal && !target.closest('.modal-content')) {
      setters.setShowPlaylistModal(false);
    }
  };
};

// Утилиты для работы с треками
export const getTrackDisplayInfo = (track: Track | null) => {
  return {
    title: track?.title || "Выберите трек",
    artist: track?.artist || "Неизвестный исполнитель",
    cover: track?.cover || "/api/placeholder/40/40"
  };
};

// Утилиты для повтора
export const getRepeatDisplayInfo = (repeatMode: 'off' | 'repeat' | 'double') => {
  if (repeatMode === 'off') return { isActive: false, symbol: '' };
  return {
    isActive: true,
    symbol: repeatMode === 'double' ? '2' : '∞'
  };
};

// Утилиты для прогресса
export const calculateProgressPercentage = (currentTime: number, duration: number, isDragging: boolean, dragTime: number) => {
  if (duration <= 0) return 0;
  const time = isDragging ? dragTime : currentTime;
  return (time / duration) * 100;
};

// Утилиты для громкости
export const calculateVolumePercentage = (volume: number, isDraggingVolume: boolean, dragVolume: number) => {
  return (isDraggingVolume ? dragVolume : volume) * 100;
};

// Утилиты для классов CSS
export const getTrackItemClasses = (
  currentTrack: Track | null,
  track: Track,
  isPlaying: boolean,
  draggedTrack: number | null,
  index: number,
  dragOverIndex: number | null,
  isDragEnabled: boolean
) => {
  const classes = ['track-item'];
  
  if (currentTrack?.id === track.id && isPlaying) {
    classes.push('playing');
  }
  
  if (draggedTrack === index) {
    classes.push('dragging');
  }
  
  if (dragOverIndex === index) {
    classes.push('drag-over');
  }
  
  if (!isDragEnabled) {
    classes.push('drag-disabled');
  }
  
  return classes.join(' ');
};

export const getControlButtonClasses = (baseClass: string, isActive: boolean, additionalClasses: string[] = []) => {
  const classes = ['control-btn', baseClass];
  
  if (isActive) {
    classes.push('active');
  }
  
  classes.push(...additionalClasses);
  
  return classes.join(' ');
};

// Утилиты для альбомов
export const getAlbumGridClasses = (albumsCount: number) => {
  return `albums-grid ${albumsCount === 0 ? 'empty-state' : ''}`;
};

// Утилиты для форматирования
export const formatTime = (time: number): string => {
  if (isNaN(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTrackCount = (count: number) => {
  return `${count} ${count === 1 ? 'трек' : 'треков'}`;
};

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU');
};

// Утилиты для валидации
export const validateAlbumCreation = (title: string, tracks: Track[]) => {
  const errors: string[] = [];
  
  if (!title.trim()) {
    errors.push('Введите название альбома');
  }
  
  if (tracks.length === 0) {
    errors.push('Выберите хотя бы один трек');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

