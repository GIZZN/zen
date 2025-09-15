'use client';

import React from 'react';
import { ProfileData } from '../types/profileTypes';
import '../profile.css';

interface ProfileHeaderProps {
  profileData: ProfileData;
  isEditing: boolean;
  saveLoading: boolean;
  error: string;
  onStartEdit: () => void;
  onSaveProfile: () => void;
  onCancelEdit: () => void;
}

export default function ProfileHeader({
  profileData,
  isEditing,
  saveLoading,
  error,
  onStartEdit,
  onSaveProfile,
  onCancelEdit
}: ProfileHeaderProps) {
  return (
    <>
      {/* Заголовок профиля */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {profileData.name?.charAt(0).toUpperCase()}
          </div>
          <button className="avatar-edit-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-name">{profileData.name}</h1>
          <p className="profile-email">{profileData.email}</p>
          {profileData.lastLogin && (
            <p className="profile-last-login">Последний вход: {profileData.lastLogin}</p>
          )}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profileData.stats.tracks}</span>
              <span className="stat-label">Треков</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profileData.stats.playlists}</span>
              <span className="stat-label">Плейлистов</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profileData.stats.hoursListened}</span>
              <span className="stat-label">Дней с нами</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <button className="edit-profile-btn" onClick={onStartEdit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Редактировать
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="save-btn" 
                onClick={onSaveProfile}
                disabled={saveLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {saveLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                className="cancel-btn" 
                onClick={onCancelEdit}
                disabled={saveLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Отображение ошибок */}
      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {error}
        </div>
      )}
    </>
  );
}
