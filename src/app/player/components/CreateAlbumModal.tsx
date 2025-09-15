'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Track } from '../modalalbum/modalalbum';
import { CloseIcon } from './Icons';
import { USER_MESSAGES } from '../constants/playerConstants';
import '../modal.css';

interface CreateAlbumModalProps {
  isOpen: boolean;
  userTracks: Track[];
  onClose: () => void;
  onCreateAlbum: (title: string, tracks: Track[]) => Promise<boolean>;
}

export default function CreateAlbumModal({ 
  isOpen, 
  userTracks, 
  onClose,
  onCreateAlbum
}: CreateAlbumModalProps) {
  const [albumTitle, setAlbumTitle] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    handleCancel();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTrackToggle = (track: Track, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTracks(prev => [...prev, track]);
    } else {
      setSelectedTracks(prev => prev.filter(t => t.id !== track.id));
    }
  };

  const handleCancel = () => {
    setAlbumTitle('');
    setSelectedTracks([]);
    onClose();
  };

  const handleCreate = async () => {
    if (selectedTracks.length > 0 && albumTitle.trim()) {
      const success = await onCreateAlbum(albumTitle, selectedTracks);
      if (success) {
        setAlbumTitle('');
        setSelectedTracks([]);
        onClose();
      }
    } else {
      alert(USER_MESSAGES.SELECT_AT_LEAST_ONE_TRACK);
    }
  };

  const isCreateDisabled = selectedTracks.length === 0 || !albumTitle.trim();

  return (
    <div className="create-album-modal">
      <div className="modal-overlay" onClick={handleOverlayClick}></div>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h2>Создать альбом</h2>
          <button className="modal-close" onClick={handleCancel}>
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="album-title-input">
            <label>Название альбома</label>
            <input
              type="text"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Введите название альбома"
            />
          </div>

          <div className="track-selection">
            <label>Выберите треки для альбома</label>
            <div className="track-selection-list">
              {userTracks.map((track) => (
                <div key={track.id} className="track-selection-item">
                  <input
                    type="checkbox"
                    id={`track-${track.id}`}
                    checked={selectedTracks.some(t => t.id === track.id)}
                    onChange={(e) => handleTrackToggle(track, e.target.checked)}
                  />
                  <label htmlFor={`track-${track.id}`}>
                    <div className="track-selection-info">
                      <Image 
                        src={track.cover} 
                        alt={track.title}
                        width={40}
                        height={40}
                        style={{ objectFit: 'cover' }}
                      />
                      <div>
                        <span className="track-selection-title">{track.title}</span>
                        <span className="track-selection-artist">{track.artist}</span>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
              {userTracks.length === 0 && (
                <div className="no-tracks-message">
                  <p>{USER_MESSAGES.NO_TRACKS_FOR_ALBUM}</p>
                  <p>{USER_MESSAGES.ADD_TRACKS_TO_CREATE_ALBUM}</p>
                </div>
              )}
            </div>
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
            Создать альбом
          </button>
        </div>
      </div>
    </div>
  );
}
