'use client';

import React from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import { generateEqualizerBars, formatTime } from '../utils/playerUtils';
import '../player.css';

interface HeroSectionProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: 'off' | 'repeat' | 'double';
  isDragging: boolean;
  dragTime: number;
  isDraggingVolume: boolean;
  dragVolume: number;
  isMuted: boolean;
  showPlayerMenu: boolean;
  onPreviousTrack: () => void;
  onPlayTrack: (track: Track) => void;
  onNextTrack: () => void;
  onToggleRepeat: () => void;
  onAddToPlaylist: () => void;
  onTogglePlayerMenu: () => void;
  onToggleMute: () => void;
  onLyricsClick: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCopyTrackInfo: () => void;
  onShareTrack: () => void;
  onOpenCreateAlbum: () => void;
  isTrackInUserTracks: (id: number) => boolean;
}

export default function HeroSection({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  repeatMode,
  isDragging,
  dragTime,
  isDraggingVolume,
  dragVolume,
  isMuted,
  showPlayerMenu,
  onPreviousTrack,
  onPlayTrack,
  onNextTrack,
  onToggleRepeat,
  onAddToPlaylist,
  onTogglePlayerMenu,
  onToggleMute,
  onLyricsClick,
  onProgressClick,
  onProgressMouseDown,
  onProgressMouseMove,
  onProgressMouseUp,
  onVolumeClick,
  onVolumeMouseDown,
  onVolumeMouseMove,
  onVolumeMouseUp,
  onCopyTrackInfo,
  onShareTrack,
  onOpenCreateAlbum,
  isTrackInUserTracks
}: HeroSectionProps) {
  const equalizerBars = generateEqualizerBars();

  return (
    <section className="hero-section">
      {/* Фоновый эквалайзер */}
      <div className="hero-equalizer">
        {equalizerBars.map((bar) => (
          <div 
            key={bar.key} 
            className="hero-eq-bar" 
            style={{
              animationDelay: bar.animationDelay,
              animationDuration: bar.animationDuration
            }}
          />
        ))}
      </div>
      
      {/* Плашка плеера */}
      <div className="player-bar">
        <div className="player-left">
          <button className="control-btn" onClick={onPreviousTrack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button className="control-btn play-btn" onClick={() => currentTrack && onPlayTrack(currentTrack)}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <button className="control-btn" onClick={onNextTrack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button className={`control-btn repeat-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={onToggleRepeat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
            {repeatMode !== 'off' && (
              <span className="repeat-count">
                {repeatMode === 'double' ? '2' : '∞'}
              </span>
            )}
          </button>
        </div>

        <div className="player-center">
          <div className="track-info">
            <div className="track-cover">
              <Image 
                src={currentTrack?.cover || "/api/placeholder/40/40"} 
                alt="Track cover"
                width={40}
                height={40}
                style={{ objectFit: 'cover' }}
              />
              <div className="now-playing-icon">
                <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
              </div>
            </div>
            <div className="track-details">
              <h4 className="track-title">{currentTrack?.title || "Выберите трек"}</h4>
              <p className="track-artist">{currentTrack?.artist || "Неизвестный исполнитель"}</p>
            </div>
          </div>
          
          <div className="progress-section">
            <span className="progress-time">{formatTime(isDragging ? dragTime : currentTime)}</span>
            <div 
              className="progress-bar" 
              onClick={onProgressClick}
              onMouseDown={onProgressMouseDown}
              onMouseMove={onProgressMouseMove}
              onMouseUp={onProgressMouseUp}
            >
              <div 
                className="progress-fill" 
                style={{width: duration > 0 ? `${((isDragging ? dragTime : currentTime) / duration) * 100}%` : '0%'}}
              >
                <div className={`progress-thumb ${isDragging ? 'dragging' : ''}`}></div>
              </div>
            </div>
            <span className="progress-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <button 
            className={`control-btn add-to-playlist-btn ${currentTrack && isTrackInUserTracks(currentTrack.id) ? 'added' : ''}`}
            onClick={onAddToPlaylist}
            disabled={!currentTrack}
            title="Добавить в плейлист"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </button>
          <button 
            className={`control-btn menu-btn ${showPlayerMenu ? 'active' : ''}`}
            onClick={onTogglePlayerMenu}
            title="Меню плеера"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {showPlayerMenu && (
              <div className="player-menu-dropdown">
                <div className="menu-item" onClick={onCopyTrackInfo}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Копировать информацию о треке
                </div>
                <div className="menu-item" onClick={onShareTrack}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                  </svg>
                  Поделиться
                </div>
                <div className="menu-item" onClick={onOpenCreateAlbum}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Создать альбом
                </div>
              </div>
            )}
          </button>
          <button 
            className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {isMuted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              )}
            </svg>
          </button>
          <div 
            className="volume-bar" 
            onClick={onVolumeClick}
            onMouseDown={onVolumeMouseDown}
            onMouseMove={onVolumeMouseMove}
            onMouseUp={onVolumeMouseUp}
          >
            <div className="volume-fill" style={{width: `${(isDraggingVolume ? dragVolume : volume) * 100}%`}}>
              <div className={`volume-thumb ${isDraggingVolume ? 'dragging' : ''}`}></div>
            </div>
          </div>
          <button 
            className="control-btn lyrics-btn" 
            onClick={onLyricsClick}
            disabled={!currentTrack}
            title="Показать текст песни"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </button>
          <button className="control-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
