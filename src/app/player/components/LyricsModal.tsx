'use client';

import React from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import { CloseIcon } from './Icons';
import '../modal.css';

interface LyricsModalProps {
  isOpen: boolean;
  currentTrack: Track | null;
  currentLyrics: string | null;
  onClose: () => void;
}

export default function LyricsModal({ 
  isOpen, 
  currentTrack, 
  currentLyrics, 
  onClose 
}: LyricsModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="lyrics-modal-overlay" onClick={handleOverlayClick}>
      <div className="lyrics-modal-content" onClick={handleContentClick}>
        <div className="lyrics-modal-header">
          <h3>
            {currentLyrics ? 'Текст песни' : 'Текст недоступен'}
          </h3>
          <button 
            className="lyrics-modal-close" 
            onClick={onClose}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        
        <div className="lyrics-modal-body">
          {currentLyrics ? (
            <div className="lyrics-content">
              {currentLyrics.split('\n').map((line, index) => (
                <p key={index} className="lyrics-line">{line || '\u00A0'}</p>
              ))}
            </div>
          ) : (
            <div className="no-lyrics-message">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="no-lyrics-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM7.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S10.33 10.5 9.5 10.5 8 11.17 8 12zm7 0c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
              </svg>
              <h4>Исполнитель не добавил текст</h4>
              <p>К сожалению, текст этой песни недоступен</p>
            </div>
          )}
        </div>
        
        {currentTrack && (
          <div className="lyrics-modal-footer">
            <div className="track-info-footer">
              <Image 
                src={currentTrack.cover} 
                alt="Track cover" 
                className="footer-cover"
                width={48}
                height={48}
                style={{ objectFit: 'cover' }}
              />
              <div className="footer-details">
                <span className="footer-title">{currentTrack.title}</span>
                <span className="footer-artist">{currentTrack.artist}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
