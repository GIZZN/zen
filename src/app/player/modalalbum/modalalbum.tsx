'use client';

import React from 'react';
import Image from 'next/image';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';
import '../player.css';
import '../modal.css';

// Типы данных
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

interface ModalAlbumProps {
  isOpen: boolean;
  album: Album | null;
  onClose: () => void;
}

export default function ModalAlbum({ isOpen, album, onClose }: ModalAlbumProps) {
  const globalAudio = useGlobalAudio();

  if (!isOpen || !album) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTrackClick = (track: Track) => {
    console.log('Track clicked:', track.title);
    if (globalAudio && globalAudio.playTrack && globalAudio.updateTrackList) {
      globalAudio.updateTrackList(album.tracks);
      globalAudio.playTrack(track);
      onClose();
    }
  };

  return (
    <div className="album-modal-overlay" onClick={handleOverlayClick}>
      <div className="album-modal-content" onClick={handleContentClick}>
        <div className="album-modal-header">
          <div className="album-modal-info">
            <Image 
              src={album.cover} 
              alt={album.title}
              className="album-modal-cover"
              width={60}
              height={60}
              style={{ objectFit: 'cover' }}
            />
            <div>
              <h2>{album.title}</h2>
              <p>{album.tracks.length} треков</p>
            </div>
          </div>
          <button 
            className="album-modal-close"
            onClick={onClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
        
        <div className="album-modal-body">
          <div className="album-tracks-list">
            {album.tracks.map((track: Track, index: number) => (
              <div 
                key={track.id} 
                className="album-track-item"
                onClick={() => handleTrackClick(track)}
              >
                <div className="track-number">{index + 1}</div>
                <Image 
                  src={track.cover} 
                  alt={track.title}
                  className="track-cover"
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover' }}
                />
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                <div className="track-duration">{track.duration}</div>
                <button className="track-play-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}