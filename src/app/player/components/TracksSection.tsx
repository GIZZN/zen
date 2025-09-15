'use client';

import React from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import '../player.css';

interface TracksSectionProps {
  userTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  draggedTrack: number | null;
  dragOverIndex: number | null;
  isDragEnabled: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveTrack: (trackId: number) => Promise<boolean>;
  onOpenPlaylistModal: () => void;
  onToggleDragMode: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export default function TracksSection({
  userTracks,
  currentTrack,
  isPlaying,
  draggedTrack,
  dragOverIndex,
  isDragEnabled,
  onPlayTrack,
  onRemoveTrack,
  onOpenPlaylistModal,
  onToggleDragMode,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: TracksSectionProps) {
  return (
    <div className="tracks-section">
      <div className="section-header">
        <h2>Ваша музыка</h2>
        <div className="section-controls">
          <button 
            className="control-btn star-btn" 
            onClick={onOpenPlaylistModal}
            disabled={userTracks.length === 0}
            title="Добавить треки в плейлист"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          <button 
            className={`control-btn drag-toggle-btn ${!isDragEnabled ? 'disabled' : ''}`}
            onClick={onToggleDragMode}
            title={isDragEnabled ? "Отключить перетаскивание" : "Включить перетаскивание"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="tracks-list">
        {userTracks.length > 0 ? (
          userTracks.map((track, index) => (
            <div 
              key={track.id} 
              className={`track-item ${currentTrack?.id === track.id && isPlaying ? 'playing' : ''} ${draggedTrack === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${!isDragEnabled ? 'drag-disabled' : ''}`}
              draggable={isDragEnabled}
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => isDragEnabled && onDragOver(e, index)}
              onDragLeave={isDragEnabled ? onDragLeave : undefined}
              onDrop={(e) => isDragEnabled && onDrop(e, index)}
              onDragEnd={isDragEnabled ? onDragEnd : undefined}
            >
              <div className="track-drag-handle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 6h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm6-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"/>
                </svg>
              </div>
              <div className="track-number">
                {currentTrack?.id === track.id && isPlaying ? (
                  <div className="playing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              <div className="track-info">
                <div className="track-cover">
                  <Image 
                    src={track.cover} 
                    alt={track.title}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="play-overlay" onClick={() => track.audioSrc && onPlayTrack(track)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="track-details">
                  <h4 className="track-title">{track.title}</h4>
                  <p className="track-artist">{track.artist}</p>
                </div>
              </div>

              <div className="track-duration">
                <span>{track.duration}</span>
              </div>

              <div className="track-actions">
                <button className="control-btn" onClick={async () => await onRemoveTrack(track.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-tracks">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </div>
            <h3>Ваша библиотека пуста</h3>
            <p>Добавляйте треки из рекомендаций, чтобы создать свою коллекцию</p>
          </div>
        )}
      </div>
    </div>
  );
}
