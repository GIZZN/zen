'use client';

import React from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import { RECOMMENDED_TRACKS } from '../constants/playerConstants';
import '../player.css';

interface RecommendationsSectionProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onAddRecommendedTracks: () => void;
  onAddToUserTracks: (track: Track) => Promise<boolean>;
  onRemoveFromUserTracks: (trackId: number) => Promise<boolean>;
  isTrackInUserTracks: (trackId: number) => boolean;
}

export default function RecommendationsSection({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onAddRecommendedTracks,
  onAddToUserTracks,
  onRemoveFromUserTracks,
  isTrackInUserTracks
}: RecommendationsSectionProps) {
  return (
    <div className="recommendations-section">
      <div className="section-header">
        <h2>Рекомендации для вас</h2>
        <div className="section-controls">
          <button 
            className="control-btn add-all-recommendations-btn" 
            onClick={onAddRecommendedTracks}
            title="Добавить все рекомендации в мои треки"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="recommendations-grid">
        {RECOMMENDED_TRACKS.map((track) => (
          <div key={track.id} className="recommendation-card">
            <div className="card-cover">
              <Image 
                src={track.cover} 
                alt={track.title}
                width={200}
                height={200}
                style={{ objectFit: 'cover' }}
              />
              <div className="play-button" onClick={() => track.audioSrc && onPlayTrack(track)}>
                {currentTrack?.id === track.id && isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="card-info">
              <h4 className="card-title">{track.title}</h4>
              <p className="card-artist">{track.artist}</p>
              <div className="card-meta">
                <span className="card-genre">{track.genre}</span>
                <span className="card-duration">{track.duration}</span>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className={`control-btn add-btn ${isTrackInUserTracks(track.id) ? 'added' : ''}`}
                onClick={async () => {
                  if (isTrackInUserTracks(track.id)) {
                    await onRemoveFromUserTracks(track.id);
                  } else {
                    await onAddToUserTracks(track);
                  }
                }}
              >
                {isTrackInUserTracks(track.id) ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="load-more">
        <button className="load-more-btn">
          <span>Показать еще</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
