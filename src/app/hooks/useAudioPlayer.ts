import { useState, useRef, useEffect } from 'react';

export interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  audioSrc?: string;
  genre?: string;
  saved?: boolean;
  isPlaying?: boolean;
  lyrics?: string;
}

export interface Album {
  id: number;
  title: string;
  cover: string;
  trackCount: number;
  tracks: Track[];
  createdAt: Date;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [dragVolume, setDragVolume] = useState(0.6);
  const [userTracks, setUserTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'repeat' | 'double'>(('off'));
  const [currentRepeats, setCurrentRepeats] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Инициализация громкости
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Глобальные обработчики для drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && duration > 0) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
          setDragTime(newTime);
        }
      }
      
      if (isDraggingVolume) {
        const volumeBar = document.querySelector('.volume-bar') as HTMLElement;
        if (volumeBar) {
          const rect = volumeBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newVolume = Math.max(0, Math.min(1, clickX / width));
          setDragVolume(newVolume);
        }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging && audioRef.current) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
        setIsDragging(false);
        setDragTime(0);
      }
      
      if (isDraggingVolume && audioRef.current) {
        const volumeBar = document.querySelector('.volume-bar') as HTMLElement;
        if (volumeBar) {
          const rect = volumeBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newVolume = Math.max(0, Math.min(1, clickX / width));
          setVolume(newVolume);
          audioRef.current.volume = newVolume;
        }
        setIsDraggingVolume(false);
        setDragVolume(0.6);
      }
    };

    if (isDragging || isDraggingVolume) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isDraggingVolume, duration]);

  // Форматирование времени
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Обработчик обновления времени
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Обработчик загрузки метаданных
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
    }
  };

  // Вычисление времени по позиции мыши
  const getTimeFromMousePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    return Math.max(0, Math.min(duration, (clickX / width) * duration));
  };

  // Обработчик начала перетаскивания
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0 && currentTrack) {
      setIsDragging(true);
      const newTime = getTimeFromMousePosition(e);
      setDragTime(newTime);
      e.preventDefault();
    }
  };

  // Обработчик перемещения при перетаскивании
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && duration > 0) {
      const newTime = getTimeFromMousePosition(e);
      setDragTime(newTime);
    }
  };

  // Обработчик окончания перетаскивания
  const handleProgressMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && audioRef.current) {
      const newTime = getTimeFromMousePosition(e);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setIsDragging(false);
      setDragTime(0);
    }
  };

  // Обработчик клика по прогресс-бару (для быстрого перехода)
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && audioRef.current && duration > 0 && currentTrack) {
      const newTime = getTimeFromMousePosition(e);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Вычисление громкости по позиции мыши
  const getVolumeFromMousePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    return Math.max(0, Math.min(1, clickX / width));
  };

  // Обработчик начала перетаскивания громкости
  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    const newVolume = getVolumeFromMousePosition(e);
    setDragVolume(newVolume);
    e.preventDefault();
  };

  // Обработчик перемещения при перетаскивании громкости
  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      const newVolume = getVolumeFromMousePosition(e);
      setDragVolume(newVolume);
    }
  };

  // Обработчик окончания перетаскивания громкости
  const handleVolumeMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingVolume && audioRef.current) {
      const newVolume = getVolumeFromMousePosition(e);
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
      setIsDraggingVolume(false);
      setDragVolume(0.6);
    }
  };

  // Обработчик клика по громкости (для быстрого изменения)
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingVolume) {
      const newVolume = getVolumeFromMousePosition(e);
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    }
  };

  // Основная функция воспроизведения
  const handleTrackPlay = (track: Track) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id && isPlaying) {
        // Пауза, если тот же трек уже играет
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentTrack?.id === track.id && !isPlaying) {
        // Возобновление того же трека с сохранением позиции
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Воспроизведение нового трека - сбрасываем счетчик повторов
        setCurrentRepeats(0);
        audioRef.current.src = track.audioSrc || '';
        audioRef.current.load(); // Принудительная загрузка
        audioRef.current.play();
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    }
  };

  // Функции управления пользовательскими треками
  const addToUserTracks = (track: Track) => {
    const isAlreadyAdded = userTracks.some(userTrack => userTrack.id === track.id);
    if (!isAlreadyAdded) {
      const newTrack = { ...track, saved: true };
      setUserTracks(prev => [...prev, newTrack]);
    }
  };

  const removeFromUserTracks = (trackId: number) => {
    setUserTracks(prev => prev.filter(track => track.id !== trackId));
  };

  const isTrackInUserTracks = (trackId: number) => {
    return userTracks.some(track => track.id === trackId);
  };

  // Функция для перестановки треков
  const reorderUserTracks = (fromIndex: number, toIndex: number) => {
    setUserTracks(prev => {
      const newTracks = [...prev];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      return newTracks;
    });
  };

  // Функции управления альбомами
  const createAlbum = (title: string, selectedTracks: Track[]) => {
    const newAlbum: Album = {
      id: Date.now(),
      title: title.trim() || 'Новый альбом',
      cover: selectedTracks[0]?.cover || '/api/placeholder/200/200',
      trackCount: selectedTracks.length,
      tracks: selectedTracks,
      createdAt: new Date()
    };
    setAlbums(prev => [...prev, newAlbum]);
    setShowCreateAlbum(false);
  };

  const deleteAlbum = (albumId: number) => {
    setAlbums(prev => prev.filter(album => album.id !== albumId));
  };

  const addTrackToAlbum = (albumId: number, track: Track) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        const isTrackExists = album.tracks.some(t => t.id === track.id);
        if (!isTrackExists) {
          return {
            ...album,
            tracks: [...album.tracks, track],
            trackCount: album.trackCount + 1
          };
        }
      }
      return album;
    }));
  };

  const removeTrackFromAlbum = (albumId: number, trackId: number) => {
    setAlbums(prev => prev.map(album => {
      if (album.id === albumId) {
        return {
          ...album,
          tracks: album.tracks.filter(track => track.id !== trackId),
          trackCount: album.trackCount - 1
        };
      }
      return album;
    }));
  };

  // Функция переключения повтора
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'repeat';
      if (prev === 'repeat') return 'double';
      return 'off';
    });
    setCurrentRepeats(0); // Сбрасываем счетчик при переключении режима
  };

  // Получение всех доступных треков
  const getAllTracks = () => {
    return [...userTracks];
  };

  // Переключение на предыдущий трек или возврат к началу при двойном клике
  const handlePreviousTrack = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    // Если двойной клик (менее 300ms между кликами)
    if (timeSinceLastClick < 300 && currentTrack && audioRef.current) {
      // Возвращаем трек в начало
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setCurrentRepeats(0); // Сбрасываем счетчик повторов
      setLastClickTime(0); // Сбрасываем время клика
      return;
    }
    
    setLastClickTime(now);
    
    // Если прошло менее 3 секунд с начала трека, переключаемся на предыдущий
    if (audioRef.current && audioRef.current.currentTime < 3) {
      const allTracks = getAllTracks();
      if (allTracks.length === 0 || !currentTrack) return;

      const currentIndex = allTracks.findIndex(track => track.id === currentTrack.id);
      if (currentIndex === -1) return;

      const previousIndex = currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
      const previousTrack = allTracks[previousIndex];
      
      if (previousTrack?.audioSrc) {
        handleTrackPlay(previousTrack);
      }
    } else {
      // Иначе возвращаем текущий трек в начало
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setCurrentRepeats(0);
      }
    }
  };

  // Переключение на следующий трек
  const handleNextTrack = () => {
    const allTracks = getAllTracks();
    if (allTracks.length === 0 || !currentTrack) return;

    const currentIndex = allTracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex === allTracks.length - 1 ? 0 : currentIndex + 1;
    const nextTrack = allTracks[nextIndex];
    
    if (nextTrack?.audioSrc) {
      handleTrackPlay(nextTrack);
    }
  };

  // Обработчики событий аудио
  const audioEventHandlers = {
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onCanPlay: () => {
      // Трек готов к воспроизведению
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    },
    onEnded: () => {
      if (repeatMode === 'off') {
        // Режим выключен - переключаемся на следующий трек
        const allTracks = getAllTracks();
        if (allTracks.length > 1 && currentTrack) {
          const currentIndex = allTracks.findIndex(track => track.id === currentTrack.id);
          if (currentIndex !== -1) {
            const nextIndex = currentIndex === allTracks.length - 1 ? 0 : currentIndex + 1;
            const nextTrack = allTracks[nextIndex];
            if (nextTrack?.audioSrc) {
              handleTrackPlay(nextTrack);
              return;
            }
          }
        }
        // Если нет следующего трека, останавливаем
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      } else if (repeatMode === 'repeat') {
        // Бесконечный повтор - начинаем сначала
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          setCurrentTime(0);
        }
      } else if (repeatMode === 'double') {
        // Двойное проигрывание - играем максимум 2 раза
        if (currentRepeats < 1) {
          setCurrentRepeats(prev => prev + 1);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setCurrentTime(0);
          }
        } else {
          // После второго проигрывания останавливаем
          setIsPlaying(false);
          setCurrentTime(0);
          setCurrentRepeats(0);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
      }
    },
    onPause: () => setIsPlaying(false),
    onPlay: () => setIsPlaying(true),
    onLoadStart: () => {
      // Сбрасываем время только для новых треков
      if (audioRef.current && audioRef.current.currentTime === 0) {
        setCurrentTime(0);
        setDuration(0);
      }
    }
  };

  return {
    // Состояние
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isDragging,
    dragTime,
    isDraggingVolume,
    dragVolume,
    userTracks,
    albums,
    showCreateAlbum,
    repeatMode,
    currentRepeats,
    
    // Функции
    formatTime,
    handleTrackPlay,
    handleProgressClick,
    handleProgressMouseDown,
    handleProgressMouseMove,
    handleProgressMouseUp,
    handleVolumeChange,
    handleVolumeMouseDown,
    handleVolumeMouseMove,
    handleVolumeMouseUp,
    addToUserTracks,
    removeFromUserTracks,
    isTrackInUserTracks,
    reorderUserTracks,
    createAlbum,
    deleteAlbum,
    addTrackToAlbum,
    removeTrackFromAlbum,
    setShowCreateAlbum,
    toggleRepeat,
    handlePreviousTrack,
    handleNextTrack,
    
    // Обработчики событий
    audioEventHandlers
  };
};
