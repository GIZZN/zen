'use client';

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

interface Track {
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

interface GlobalAudioContextType {
  // Состояния
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: 'off' | 'repeat' | 'double';
  currentRepeats: number;
  
  // Функции управления
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  
  // Ref для аудио элемента
  audioRef: React.RefObject<HTMLAudioElement | null>;
  
  // Функции для синхронизации с локальными плеерами
  updateTrackList: (tracks: Track[]) => void;
  trackList: Track[];
  clearAudioState: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.6);
  const [repeatMode, setRepeatMode] = useState<'off' | 'repeat' | 'double'>('off');
  const [currentRepeats, setCurrentRepeats] = useState(0);
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Функции для сохранения и восстановления состояния
  const saveAudioState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const audioState = {
        currentTrack,
        currentTime: audioRef.current?.currentTime || 0,
        volume,
        repeatMode,
        trackList,
        isPlaying // Сохраняем текущее состояние воспроизведения
      };
      localStorage.setItem('zenPlayerAudioState', JSON.stringify(audioState));
    }
  }, [currentTrack, volume, repeatMode, trackList, isPlaying]);

  const loadAudioState = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('zenPlayerAudioState');
        if (savedState) {
          const audioState = JSON.parse(savedState);
          if (audioState.currentTrack) {
            setCurrentTrack(audioState.currentTrack);
            setVolumeState(audioState.volume || 0.6);
            setRepeatMode(audioState.repeatMode || 'off');
            setTrackList(audioState.trackList || []);
            setIsPlaying(audioState.isPlaying || false);
            
            // Восстанавливаем аудио источник только если он отличается или не установлен
            if (audioRef.current && audioState.currentTrack.audioSrc) {
              const needsReload = !audioRef.current.src || 
                                  audioRef.current.src !== audioState.currentTrack.audioSrc ||
                                  Math.abs(audioRef.current.currentTime - (audioState.currentTime || 0)) > 2;
              
              if (needsReload) {
                audioRef.current.src = audioState.currentTrack.audioSrc;
                audioRef.current.currentTime = audioState.currentTime || 0;
              }
              
              audioRef.current.volume = audioState.volume || 0.6;
              
              // Восстанавливаем воспроизведение если оно должно быть активно
              if (audioState.isPlaying) {
                // Проверяем состояние аудио элемента
                const restorePlayback = () => {
                  if (audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().then(() => {
                      setIsPlaying(true);
                    }).catch(error => {
                      console.log('Autoplay prevented on load:', error);
                      setIsPlaying(false);
                      
                      // Попытаемся восстановить при первом взаимодействии
                      const resumeOnInteraction = () => {
                        if (audioRef.current && audioRef.current.paused) {
                          audioRef.current.play().then(() => {
                            setIsPlaying(true);
                          }).catch(() => {
                            console.log('Still cannot resume playback');
                          });
                        }
                        document.removeEventListener('click', resumeOnInteraction);
                        document.removeEventListener('keydown', resumeOnInteraction);
                      };
                      
                      document.addEventListener('click', resumeOnInteraction, { once: true });
                      document.addEventListener('keydown', resumeOnInteraction, { once: true });
                    });
                  }
                };
                
                if (needsReload) {
                  // Если нужна перезагрузка, ждем готовности
                  audioRef.current.addEventListener('canplay', restorePlayback, { once: true });
                } else {
                  // Иначе пытаемся сразу
                  setTimeout(restorePlayback, 100);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading audio state:', error);
      }
    }
    setIsInitialized(true);
  };

  // Инициализация при загрузке компонента
  useEffect(() => {
    loadAudioState();
  }, []);

  // Сохранение состояния при изменениях
  useEffect(() => {
    if (isInitialized) {
      saveAudioState();
    }
  }, [currentTrack, volume, repeatMode, trackList, isInitialized, saveAudioState]);

  // Предотвращение остановки аудио при навигации
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Сохраняем состояние перед переходом
      if (isInitialized) {
        saveAudioState();
      }
      
      // НЕ останавливаем аудио - позволяем ему играть
      // Браузер сам решит, что делать с аудио при переходе
    };

    const handlePageHide = () => {
      // Сохраняем состояние, но НЕ останавливаем воспроизведение
      if (isInitialized) {
        saveAudioState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isInitialized) {
        // Только сохраняем состояние
        saveAudioState();
      } else if (document.visibilityState === 'visible' && isInitialized) {
        // При возвращении фокуса проверяем, нужно ли восстановить воспроизведение
        setTimeout(() => {
          const savedState = localStorage.getItem('zenPlayerAudioState');
          if (savedState && audioRef.current) {
            try {
              const audioState = JSON.parse(savedState);
              if (audioState.isPlaying && audioState.currentTrack?.id === currentTrack?.id && audioRef.current.paused) {
                audioRef.current.play().catch(error => {
                  console.log('Failed to resume after visibility change:', error);
                });
              }
            } catch (error) {
              console.error('Error checking state on visibility change:', error);
            }
          }
        }, 100);
      }
    };

    // Обработка кнопок мыши (назад/вперед)
    const handleMouseButtons = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) { // Кнопки назад/вперед
        // Сохраняем состояние перед навигацией кнопками мыши
        if (isInitialized) {
          saveAudioState();
        }
      }
    };

    // Обработка событий popstate (навигация назад/вперед)
    const handlePopState = () => {
      if (isInitialized) {
        // Сохраняем текущее состояние
        saveAudioState();
        
        // Через небольшую задержку проверяем, нужно ли восстановить воспроизведение
        setTimeout(() => {
          const savedState = localStorage.getItem('zenPlayerAudioState');
          if (savedState && audioRef.current) {
            try {
              const audioState = JSON.parse(savedState);
              if (audioState.isPlaying && audioState.currentTrack?.id === currentTrack?.id && audioRef.current.paused) {
                audioRef.current.play().catch(error => {
                  console.log('Failed to resume after popstate:', error);
                });
              }
            } catch (error) {
              console.error('Error restoring state on popstate:', error);
            }
          }
        }, 150);
      }
    };

    // Периодическое сохранение состояния во время воспроизведения
    const saveInterval = setInterval(() => {
      if (isInitialized && isPlaying && currentTrack) {
        saveAudioState();
      }
    }, 500); // Сохраняем каждые полсекунды для большей точности

    // Обработка фокуса окна (дополнительная защита)
    const handleWindowFocus = () => {
      if (isInitialized) {
        setTimeout(() => {
          const savedState = localStorage.getItem('zenPlayerAudioState');
          if (savedState && audioRef.current) {
            try {
              const audioState = JSON.parse(savedState);
              if (audioState.isPlaying && audioState.currentTrack?.id === currentTrack?.id && audioRef.current.paused) {
                audioRef.current.play().catch(error => {
                  console.log('Failed to resume on window focus:', error);
                });
              }
            } catch (error) {
              console.error('Error restoring state on window focus:', error);
            }
          }
        }, 200);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousedown', handleMouseButtons);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousedown', handleMouseButtons);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(saveInterval);
    };
  }, [isInitialized, saveAudioState, isPlaying, currentTrack]);

  // Инициализация громкости
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

      // Экспорт глобальных переменных через window для drag обработчиков
      useEffect(() => {
        (window as unknown as { globalAudioDuration: number; globalCurrentTrack: Track | null }).globalAudioDuration = duration;
        (window as unknown as { globalAudioDuration: number; globalCurrentTrack: Track | null }).globalCurrentTrack = currentTrack;
      }, [duration, currentTrack]);

  // Слушаем события от drag обработчиков
  useEffect(() => {
    const handleSetGlobalTime = (e: CustomEvent) => {
      setCurrentTimeHandler(e.detail);
    };

    const handleSetGlobalVolume = (e: CustomEvent) => {
      setVolume(e.detail);
    };

    window.addEventListener('setGlobalTime', handleSetGlobalTime as EventListener);
    window.addEventListener('setGlobalVolume', handleSetGlobalVolume as EventListener);

    return () => {
      window.removeEventListener('setGlobalTime', handleSetGlobalTime as EventListener);
      window.removeEventListener('setGlobalVolume', handleSetGlobalVolume as EventListener);
    };
  }, []);

  // Обработчики событий аудио
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
      
      // Синхронизируем время только если есть значительное расхождение
      if (isInitialized) {
        const savedState = localStorage.getItem('zenPlayerAudioState');
        if (savedState) {
          try {
            const audioState = JSON.parse(savedState);
            if (audioState.currentTrack?.id === currentTrack?.id && audioState.currentTime) {
              const timeDiff = Math.abs(audioRef.current.currentTime - audioState.currentTime);
              if (timeDiff > 1) { // Только если разница больше секунды
                audioRef.current.currentTime = audioState.currentTime;
                setCurrentTime(audioState.currentTime);
              }
            }
          } catch (error) {
            console.error('Error syncing current time:', error);
          }
        }
      }
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'off') {
      // Переключаемся на следующий трек
      nextTrack();
    } else if (repeatMode === 'repeat') {
      // Бесконечный повтор
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setCurrentTime(0);
      }
    } else if (repeatMode === 'double') {
      // Двойное проигрывание
      if (currentRepeats < 1) {
        setCurrentRepeats(prev => prev + 1);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          setCurrentTime(0);
        }
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentRepeats(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Функции управления
  const playTrack = (track: Track) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id && isPlaying) {
        // Пауза
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentTrack?.id === track.id && !isPlaying) {
        // Возобновление
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Resume failed:', error);
        });
      } else {
        // Новый трек - проверяем, нужно ли действительно менять источник
        const needsNewSource = !audioRef.current.src || audioRef.current.src !== (track.audioSrc || '');
        
        setCurrentRepeats(0);
        setCurrentTrack(track);
        
        if (needsNewSource) {
          audioRef.current.src = track.audioSrc || '';
          audioRef.current.load();
        }
        
        // Запускаем воспроизведение
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
      }
    }
  };

  const pauseTrack = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current && !isPlaying && currentTrack) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const setCurrentTimeHandler = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'repeat';
      if (prev === 'repeat') return 'double';
      return 'off';
    });
    setCurrentRepeats(0);
  };

  const nextTrack = () => {
    console.log('nextTrack called', { trackListLength: trackList.length, currentTrack: currentTrack?.title });
    
    if (trackList.length === 0 || !currentTrack) {
      console.log('nextTrack: No tracks or current track');
      return;
    }

    const currentIndex = trackList.findIndex(track => track.id === currentTrack.id);
    console.log('nextTrack: currentIndex', currentIndex);
    
    if (currentIndex === -1) {
      console.log('nextTrack: Current track not found in trackList');
      return;
    }

    const nextIndex = currentIndex === trackList.length - 1 ? 0 : currentIndex + 1;
    const nextTrackItem = trackList[nextIndex];
    console.log('nextTrack: nextTrackItem', nextTrackItem?.title);
    
    if (nextTrackItem?.audioSrc) {
      setCurrentRepeats(0); // Сбрасываем счетчик повторов
      playTrack(nextTrackItem);
    } else {
      console.log('nextTrack: No audio source for next track');
    }
  };

  const previousTrack = () => {
    console.log('previousTrack called', { trackListLength: trackList.length, currentTrack: currentTrack?.title });
    
    if (trackList.length === 0 || !currentTrack) {
      console.log('previousTrack: No tracks or current track');
      return;
    }

    const currentIndex = trackList.findIndex(track => track.id === currentTrack.id);
    console.log('previousTrack: currentIndex', currentIndex);
    
    if (currentIndex === -1) {
      console.log('previousTrack: Current track not found in trackList');
      return;
    }

    const now = Date.now();
    const lastClickTime = (window as unknown as { lastClickTime?: number }).lastClickTime || 0;
    const timeSinceLastClick = now - lastClickTime;

    // Двойной клик (менее 300мс) - возвращаем трек в начало
    if (timeSinceLastClick < 300 && audioRef.current) {
      console.log('previousTrack: Double click detected, resetting to start');
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setCurrentRepeats(0);
      (window as unknown as { lastClickTime?: number }).lastClickTime = 0;
      return;
    }

    // Запоминаем время клика
    (window as unknown as { lastClickTime?: number }).lastClickTime = now;

    // Если трек играет менее 3 секунд - переключаемся на предыдущий
    if (audioRef.current && audioRef.current.currentTime < 3) {
      const previousIndex = currentIndex === 0 ? trackList.length - 1 : currentIndex - 1;
      const previousTrackItem = trackList[previousIndex];
      console.log('previousTrack: switching to previous track', previousTrackItem?.title);
      
      if (previousTrackItem?.audioSrc) {
        setCurrentRepeats(0); // Сбрасываем счетчик повторов
        playTrack(previousTrackItem);
      } else {
        console.log('previousTrack: No audio source for previous track');
      }
    } else {
      // Иначе возвращаем текущий трек в начало
      console.log('previousTrack: Resetting current track to start');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setCurrentRepeats(0);
      }
    }
  };

  const updateTrackList = (tracks: Track[]) => {
    setTrackList(tracks);
  };

  const clearAudioState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zenPlayerAudioState');
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentRepeats(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const value: GlobalAudioContextType = {
    // Состояния
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    currentRepeats,
    
    // Функции управления
    playTrack,
    pauseTrack,
    resumeTrack,
    setVolume,
    setCurrentTime: setCurrentTimeHandler,
    toggleRepeat,
    nextTrack,
    previousTrack,
    
    // Ref
    audioRef,
    
    // Список треков
    updateTrackList,
    trackList,
    clearAudioState,
  };

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}
      {/* Глобальный аудио элемент */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={handlePlay}
        onLoadStart={() => {
          if (audioRef.current && audioRef.current.currentTime === 0) {
            setCurrentTime(0);
            setDuration(0);
          }
        }}
        style={{ display: 'none' }}
      />
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider');
  }
  return context;
};
