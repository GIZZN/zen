'use client';

import React from 'react';
import Image from 'next/image';
import { Track, Album } from '../modalalbum/modalalbum';
import '../player.css';

interface AlbumsSectionProps {
  albums: Album[];
  onCreateAlbum: () => void;
  onOpenAlbum: (album: Album) => void;
  onDeleteAlbum: (albumId: number) => Promise<boolean>;
  onPlayTrack: (track: Track) => void;
}

export default function AlbumsSection({
  albums,
  onCreateAlbum,
  onOpenAlbum,
  onDeleteAlbum,
  onPlayTrack
}: AlbumsSectionProps) {
  return (
    <div className="albums-section">
      <div className="section-header">
        <h2>Ваши альбомы</h2>
        <button className="create-album-btn" onClick={onCreateAlbum}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>Создать альбом</span>
        </button>
      </div>

      <div className={`albums-grid ${albums.length === 0 ? 'empty-state' : ''}`}>
        {albums.length > 0 ? (
          albums.map((album) => (
            <div 
              key={album.id} 
              className="album-card"
              onClick={() => onOpenAlbum(album)}
            >
              <div className="album-cover">
                <Image 
                  src={album.cover} 
                  alt={album.title}
                  width={200}
                  height={200}
                  style={{ objectFit: 'cover' }}
                />
                <div 
                  className="album-play-overlay" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (album.tracks[0]?.audioSrc) {
                      onPlayTrack(album.tracks[0]);
                    }
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="album-actions">
                  <button 
                    className="album-delete-btn" 
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onDeleteAlbum(album.id);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="album-info">
                <h4 className="album-title">{album.title}</h4>
                <p className="album-meta">{album.trackCount} треков</p>
                <span className="album-date">{new Date(album.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-albums">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>У вас пока нет альбомов</h3>
            <p>Создайте свой первый альбом из любимых треков</p>
            <button className="create-first-album-btn" onClick={onCreateAlbum}>
              Создать альбом
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
