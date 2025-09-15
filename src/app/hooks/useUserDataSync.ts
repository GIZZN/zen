'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  audioSrc?: string;
  genre?: string;
  saved?: boolean;
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

export const useUserDataSync = () => {
  const [userTracks, setUserTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Функция для получения токена
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };


  // Загрузка треков пользователя
  const fetchUserTracks = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/user-tracks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching user tracks:', error);
    }
  }, []);

  // Загрузка альбомов пользователя
  const fetchUserAlbums = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/user-albums', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error fetching user albums:', error);
    }
  }, []);

  // Добавление трека в библиотеку
  const addTrackToLibrary = useCallback(async (track: Track) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        setError('Необходима авторизация');
        return false;
      }

      console.log('Adding track to library:', track.title);
      
      const response = await fetch('/api/user-tracks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ track })
      });

      if (response.ok) {
        const data = await response.json();
        setUserTracks(prev => [...prev, data.track]);
        console.log('Track added successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setError(errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Error adding track:', error);
      setError('Ошибка добавления трека');
      return false;
    }
  }, []);

  // Удаление трека из библиотеки
  const removeTrackFromLibrary = useCallback(async (trackId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/user-tracks?trackId=${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUserTracks(prev => prev.filter(track => track.id !== trackId));
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Error removing track:', error);
      setError('Ошибка удаления трека');
      return false;
    }
  }, []);

  // Создание альбома
  const createAlbum = useCallback(async (title: string, selectedTracks: Track[]) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        setError('Необходима авторизация');
        return false;
      }

      console.log('Creating album:', title, 'with', selectedTracks.length, 'tracks');
      console.log('Selected tracks:', selectedTracks);

      const response = await fetch('/api/user-albums', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, tracks: selectedTracks })
      });

      if (response.ok) {
        const data = await response.json();
        setAlbums(prev => [...prev, data.album]);
        console.log('Album created successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setError(errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Error creating album:', error);
      setError('Ошибка создания альбома');
      return false;
    }
  }, []);

  // Удаление альбома
  const deleteAlbum = useCallback(async (albumId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/user-albums?albumId=${albumId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAlbums(prev => prev.filter(album => album.id !== albumId));
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      setError('Ошибка удаления альбома');
      return false;
    }
  }, []);

  // Проверка, добавлен ли трек в библиотеку
  const isTrackInLibrary = useCallback((trackId: number) => {
    return userTracks.some(track => track.id === trackId);
  }, [userTracks]);

  // Перестановка треков в библиотеке (пока локально, можно добавить API позже)
  const reorderUserTracks = useCallback((fromIndex: number, toIndex: number) => {
    setUserTracks(prev => {
      const newTracks = [...prev];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      return newTracks;
    });
  }, []);

  // Инициализация данных
  useEffect(() => {
    const initializeData = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchUserTracks(),
          fetchUserAlbums()
        ]);
      } catch (error) {
        console.error('Error initializing user data:', error);
        setError('Ошибка загрузки данных пользователя');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchUserTracks, fetchUserAlbums]);

  // Очистка ошибок
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Данные
    userTracks,
    albums,
    isLoading,
    error,

    // Функции для треков
    addTrackToLibrary,
    removeTrackFromLibrary,
    isTrackInLibrary,
    reorderUserTracks,

    // Функции для альбомов
    createAlbum,
    deleteAlbum,

    // Утилиты
    clearError,
    refetchData: () => {
      fetchUserTracks();
      fetchUserAlbums();
    }
  };
};
