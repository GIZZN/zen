'use client';

import React from 'react';
import { ProfileData } from '../types/profileTypes';
import '../profile.css';

interface ProfileDetailsProps {
  profileData: ProfileData;
  isEditing: boolean;
  saveLoading: boolean;
  editData: {
    name: string;
    bio: string;
    location: string;
    website: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function ProfileDetails({
  profileData,
  isEditing,
  saveLoading,
  editData,
  onInputChange
}: ProfileDetailsProps) {
  return (
    <div className="profile-details">
      <h2>Информация о профиле</h2>
      
      <div className="detail-group">
        <label htmlFor="name">Имя</label>
        {isEditing ? (
          <input
            type="text"
            id="name"
            name="name"
            value={editData.name}
            onChange={onInputChange}
            className="profile-input"
            disabled={saveLoading}
          />
        ) : (
          <p className="detail-value">{profileData.name}</p>
        )}
      </div>

      <div className="detail-group">
        <label htmlFor="email">Email</label>
        <p className="detail-value">{profileData.email}</p>
        <span className="detail-note">Email нельзя изменить</span>
      </div>

      <div className="detail-group">
        <label htmlFor="bio">О себе</label>
        {isEditing ? (
          <textarea
            id="bio"
            name="bio"
            value={editData.bio}
            onChange={onInputChange}
            className="profile-textarea"
            rows={3}
            disabled={saveLoading}
          />
        ) : (
          <p className="detail-value">{profileData.bio || 'Не указано'}</p>
        )}
      </div>

      <div className="detail-group">
        <label htmlFor="location">Местоположение</label>
        {isEditing ? (
          <input
            type="text"
            id="location"
            name="location"
            value={editData.location}
            onChange={onInputChange}
            className="profile-input"
            disabled={saveLoading}
          />
        ) : (
          <p className="detail-value">{profileData.location || 'Не указано'}</p>
        )}
      </div>

      <div className="detail-group">
        <label htmlFor="website">Веб-сайт</label>
        {isEditing ? (
          <input
            type="url"
            id="website"
            name="website"
            value={editData.website}
            onChange={onInputChange}
            className="profile-input"
            disabled={saveLoading}
          />
        ) : (
          profileData.website ? (
            <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="detail-link">
              {profileData.website}
            </a>
          ) : (
            <p className="detail-value">Не указано</p>
          )
        )}
      </div>

      <div className="detail-group">
        <label>Дата регистрации</label>
        <p className="detail-value">{profileData.joinDate}</p>
      </div>
    </div>
  );
}
