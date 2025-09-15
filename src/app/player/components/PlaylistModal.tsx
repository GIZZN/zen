'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import { CloseIcon } from './Icons';
import { USER_MESSAGES } from '../constants/playerConstants';
import '../modal.css';

interface PlaylistModalProps {
  isOpen: boolean;
  userTracks: Track[];
  onClose: () => void;
  onCreatePlaylist?: (name: string, selectedTracks: Track[]) => void;
}

export default function PlaylistModal({ 
  isOpen, 
  userTracks, 
  onClose,
  onCreatePlaylist
}: PlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<number>>(
    new Set(userTracks.map(track => track.id))
  );

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTrackToggle = (trackId: number) => {
    setSelectedTrackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const handleCancel = () => {
    setPlaylistName('');
    setSelectedTrackIds(new Set(userTracks.map(track => track.id)));
    onClose();
  };

  const handleCreate = () => {
    const selectedTracks = userTracks.filter(track => selectedTrackIds.has(track.id));
    
    if (onCreatePlaylist) {
      onCreatePlaylist(playlistName, selectedTracks);
    } else {
      console.log('Плейлист создан:', { name: playlistName, tracks: selectedTracks });
    }
    
    setPlaylistName('');
    setSelectedTrackIds(new Set(userTracks.map(track => track.id)));
    onClose();
  };

  const selectedCount = selectedTrackIds.size;
  const isCreateDisabled = userTracks.length === 0 || selectedCount === 0 || !playlistName.trim();

  return (
    <div className="create-album-modal">
      <div className="modal-overlay" onClick={handleOverlayClick}></div>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h2>Создать плейлист</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="album-title-input">
            <label htmlFor="playlistName">Название плейлиста</label>
            <input 
              type="text" 
              id="playlistName"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Введите название плейлиста"
            />
          </div>
          
          <div className="track-selection">
            <label>
              Выберите треки ({userTracks.length} доступно, {selectedCount} выбрано)
            </label>
            {userTracks.length > 0 ? (
              <div className="track-selection-list">
                {userTracks.map((track) => (
                  <div key={track.id} className="track-selection-item">
                    <input 
                      type="checkbox" 
                      id={`playlist-track-${track.id}`}
                      checked={selectedTrackIds.has(track.id)}
                      onChange={() => handleTrackToggle(track.id)}
                    />
                    <label htmlFor={`playlist-track-${track.id}`}>
                      <div className="track-selection-info">
                        <Image 
                          src={track.cover} 
                          alt={track.title}
                          width={40}
                          height={40}
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <div className="track-selection-title">{track.title}</div>
                          <div className="track-selection-artist">{track.artist}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tracks-message">
                <p>{USER_MESSAGES.NO_TRACKS_FOR_PLAYLIST}</p>
                <p>{USER_MESSAGES.ADD_TRACKS_TO_CREATE_PLAYLIST}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
          >
            Отмена
          </button>
          <button 
            className="create-btn"
            onClick={handleCreate}
            disabled={isCreateDisabled}
          >
            Создать плейлист
          </button>
        </div>
      </div>
    </div>
  );
}
