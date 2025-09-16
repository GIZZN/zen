'use client';

import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import { Playlist } from '../types/profileTypes';
import '../profile.css';

interface PlaylistsSectionProps {
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onOpenAlbum: (playlistId: string) => void;
  onPlayAlbum: (playlistId: string) => void;
}

// Мемоизированный компонент для отдельного элемента плейлиста
const PlaylistCard = memo(function PlaylistCard({
  playlist,
  onOpenAlbum,
  onPlayAlbum
}: {
  playlist: Playlist;
  onOpenAlbum: (playlistId: string) => void;
  onPlayAlbum: (playlistId: string) => void;
}) {
  const handleCardClick = useCallback(() => {
    onOpenAlbum(playlist.id);
  }, [playlist.id, onOpenAlbum]);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAlbum(playlist.id);
  }, [playlist.id, onPlayAlbum]);

  return (
    <div 
      className="playlist-card"
      onClick={handleCardClick}
    >
      <div className="playlist-cover">
        {playlist.coverUrl ? (
          <Image 
            src={playlist.coverUrl} 
            alt={playlist.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover' }}
            loading="lazy"
            sizes="60px"
          />
        ) : (
          <div className="playlist-cover-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
        )}
        <div 
          className="playlist-play-overlay"
          onClick={handlePlayClick}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
      </div>
      
      <div className="playlist-info">
        <h3 className="playlist-title">{playlist.name}</h3>
        {playlist.description && (
          <p className="playlist-description">{playlist.description}</p>
        )}
        <div className="playlist-meta">
          <span className="playlist-track-count">
            {playlist.trackCount} {playlist.trackCount === 1 ? 'трек' : 'треков'}
          </span>
          <span className="playlist-privacy">
            {playlist.isPublic ? 'Публичный' : 'Приватный'}
          </span>
        </div>
        <div className="playlist-dates">
          <span>Создан: {playlist.createdAt}</span>
          {playlist.updatedAt !== playlist.createdAt && (
            <span>Обновлен: {playlist.updatedAt}</span>
          )}
        </div>
      </div>

      <div className="playlist-actions">
        <button className="playlist-action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

const PlaylistsSection = memo(function PlaylistsSection({
  playlists,
  onCreatePlaylist,
  onOpenAlbum,
  onPlayAlbum
}: PlaylistsSectionProps) {
  return (
    <div className="profile-playlists">
      <h2>Мои плейлисты и альбомы ({playlists.length})</h2>
      
      {playlists.length > 0 ? (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onOpenAlbum={onOpenAlbum}
              onPlayAlbum={onPlayAlbum}
            />
          ))}
        </div>
      ) : (
        <div className="playlists-empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3>У вас пока нет плейлистов и альбомов</h3>
          <p>Создайте свой первый плейлист или альбом, чтобы организовать любимую музыку</p>
          <button className="create-playlist-btn" onClick={onCreatePlaylist}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Перейти к плееру
          </button>
        </div>
      )}
    </div>
  );
});

export default PlaylistsSection;
