"use client";
import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './Hero.css';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';
import AuthModal from '@/app/Components/Auth/AuthModal';

const Hero = memo(() => {
  const { isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, currentTime, duration, pauseTrack, resumeTrack } = useGlobalAudio();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Функция для форматирования времени в mm:ss
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Вычисляем прогресс воспроизведения в процентах
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Обработчик клика на плеер для управления воспроизведением
  const handlePlayerClick = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      pauseTrack();
    } else {
      if (currentTrack) {
        resumeTrack();
      }
    }
  };

  const handleStartListening = () => {
    if (!isAuthenticated) {
      // Открываем модал авторизации для неавторизованных пользователей
      setIsAuthModalOpen(true);
    } else {
      // Перенаправляем к плееру
      router.push('/player');
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            <span className="hero-title-main">Zēn Player</span>
            <span className="hero-title-sub">Ваша музыка, Ваш путь</span>
          </h1>
          <p className="hero-description">
            Опыт музыки как никогда раньше с нашим иммерсивным аудио плеером. 
            Откройте для себя новые звуки, создайте идеальные плейлисты и погрузитесь в ритм.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={handleStartListening}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="5,3 19,12 5,21" fill="currentColor"/>
              </svg>
              {isAuthenticated ? 'Открыть плеер' : 'Начать слушать'}
            </button>
          </div>
        </div>
        
        <div className="hero-player">
          <div className="hero-player-card">
            <div className={`hero-album-art ${currentTrack ? 'has-track' : ''}`} onClick={handlePlayerClick}>
              {currentTrack && currentTrack.cover ? (
                <Image 
                  src={currentTrack.cover} 
                  alt={`${currentTrack.title} - ${currentTrack.artist}`}
                  className="hero-album-image"
                  width={400}
                  height={400}
                  priority
                />
              ) : (
                <div className="hero-album-gradient"></div>
              )}
              <div className="hero-play-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isPlaying ? (
                    // Иконка паузы
                    <>
                      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                    </>
                  ) : (
                    // Иконка воспроизведения
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                  )}
                </svg>
              </div>
            </div>
            <div className="hero-track-info">
              <h3 className="hero-track-title">{currentTrack ? currentTrack.title : "Выберите трек"}</h3>
              <p className="hero-track-artist">{currentTrack ? currentTrack.artist : "Zēn Player"}</p>
              <div className="hero-progress-bar">
                <div 
                  className="hero-progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="hero-time-info">
                <span>{formatTime(currentTime)}</span>
                <span>{currentTrack ? formatTime(duration) : '0:00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
