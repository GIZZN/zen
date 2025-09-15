'use client';

import { useState, useEffect } from 'react';
import { useUserDataSync } from './useUserDataSync';

// Расширяем интерфейс Window для глобальных свойств аудио
declare global {
  interface Window {
    globalAudioDuration?: number;
    globalCurrentTrack?: Track;
  }
}

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

export const useLocalPlayerStates = () => {
  // Состояния для drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [dragVolume, setDragVolume] = useState(0.6);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  // Используем хук синхронизации с БД
  const {
    userTracks,
    albums,
    isLoading: dataLoading,
    error: dataError,
    addTrackToLibrary,
    removeTrackFromLibrary,
    isTrackInLibrary,
    reorderUserTracks: reorderTracksInDB,
    createAlbum: createAlbumInDB,
    deleteAlbum: deleteAlbumFromDB,
    clearError,
    refetchData
  } = useUserDataSync();

  // Глобальные обработчики для drag (нужно будет адаптировать для глобального аудио)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          // Получаем duration из глобального контекста через window или другой способ
          const duration = window.globalAudioDuration || 0;
          if (duration > 0) {
            const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
            setDragTime(newTime);
          }
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
      if (isDragging) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const duration = window.globalAudioDuration || 0;
          if (duration > 0) {
            const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
            // Обновляем глобальное время через событие
            window.dispatchEvent(new CustomEvent('setGlobalTime', { detail: newTime }));
          }
        }
        setIsDragging(false);
        setDragTime(0);
      }
      
      if (isDraggingVolume) {
        const volumeBar = document.querySelector('.volume-bar') as HTMLElement;
        if (volumeBar) {
          const rect = volumeBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const newVolume = Math.max(0, Math.min(1, clickX / width));
          // Обновляем глобальную громкость через событие
          window.dispatchEvent(new CustomEvent('setGlobalVolume', { detail: newVolume }));
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
  }, [isDragging, isDraggingVolume]);

  // Форматирование времени
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Вычисление времени по позиции мыши
  const getTimeFromMousePosition = (e: React.MouseEvent<HTMLDivElement>, duration: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    return Math.max(0, Math.min(duration, (clickX / width) * duration));
  };

  // Обработчик начала перетаскивания прогресса
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const duration = window.globalAudioDuration || 0;
    const currentTrack = window.globalCurrentTrack;
    if (duration > 0 && currentTrack) {
      setIsDragging(true);
      const newTime = getTimeFromMousePosition(e, duration);
      setDragTime(newTime);
      e.preventDefault();
    }
  };

  // Обработчик перемещения при перетаскивании прогресса
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const duration = window.globalAudioDuration || 0;
      if (duration > 0) {
        const newTime = getTimeFromMousePosition(e, duration);
        setDragTime(newTime);
      }
    }
  };

  // Обработчик окончания перетаскивания прогресса
  const handleProgressMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const duration = window.globalAudioDuration || 0;
      if (duration > 0) {
        const newTime = getTimeFromMousePosition(e, duration);
        window.dispatchEvent(new CustomEvent('setGlobalTime', { detail: newTime }));
      }
      setIsDragging(false);
      setDragTime(0);
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
    if (isDraggingVolume) {
      const newVolume = getVolumeFromMousePosition(e);
      window.dispatchEvent(new CustomEvent('setGlobalVolume', { detail: newVolume }));
      setIsDraggingVolume(false);
      setDragVolume(0.6);
    }
  };

  // Обертки для функций БД с дополнительной логикой
  const addToUserTracks = async (track: Track) => {
    const success = await addTrackToLibrary(track);
    if (success) {
      console.log('Трек добавлен в библиотеку:', track.title);
    } else if (dataError) {
      console.error('Ошибка добавления трека:', dataError);
    }
    return success;
  };

  const removeFromUserTracks = async (trackId: number) => {
    const success = await removeTrackFromLibrary(trackId);
    if (success) {
      console.log('Трек удален из библиотеки');
    } else if (dataError) {
      console.error('Ошибка удаления трека:', dataError);
    }
    return success;
  };

  const isTrackInUserTracks = (trackId: number) => {
    return isTrackInLibrary(trackId);
  };

  // Функция для перестановки треков (пока локально)
  const reorderUserTracks = (fromIndex: number, toIndex: number) => {
    reorderTracksInDB(fromIndex, toIndex);
  };

  // Функции управления альбомами с БД
  const createAlbum = async (title: string, selectedTracks: Track[]) => {
    console.log('useLocalPlayerStates createAlbum called with:', { title, tracksCount: selectedTracks.length });
    
    const success = await createAlbumInDB(title, selectedTracks);
    console.log('createAlbumInDB result:', success);
    
    if (success) {
      setShowCreateAlbum(false);
      console.log('Альбом создан:', title);
    } else if (dataError) {
      console.error('Ошибка создания альбома:', dataError);
    }
    return success;
  };

  const deleteAlbum = async (albumId: number) => {
    const success = await deleteAlbumFromDB(albumId);
    if (success) {
      console.log('Альбом удален');
    } else if (dataError) {
      console.error('Ошибка удаления альбома:', dataError);
    }
    return success;
  };

  return {
    // Drag состояния
    isDragging,
    dragTime,
    isDraggingVolume,
    dragVolume,
    
    // Данные пользователя (из БД)
    userTracks,
    albums,
    showCreateAlbum,
    dataLoading,
    dataError,
    
    // Утилиты
    formatTime,
    
    // Обработчики drag
    handleProgressMouseDown,
    handleProgressMouseMove,
    handleProgressMouseUp,
    handleVolumeMouseDown,
    handleVolumeMouseMove,
    handleVolumeMouseUp,
    
    // Функции управления данными (с БД)
    addToUserTracks,
    removeFromUserTracks,
    isTrackInUserTracks,
    reorderUserTracks,
    createAlbum,
    deleteAlbum,
    setShowCreateAlbum,
    
    // Утилиты БД
    clearError,
    refetchData
  };
};
