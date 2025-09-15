"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';
import PrismaticBurst from '../Components/backgraund/PrismaticBurst';
import { ProfileData, ProfileAlbum } from './types/profileTypes';
import { createProfileHandlers, ProfileHandlersProps } from './handlers/profileHandlers';
import ProfileHeader from './components/ProfileHeader';
import ProfileDetails from './components/ProfileDetails';
import ActivitySection from './components/ActivitySection';
import PlaylistsSection from './components/PlaylistsSection';
import ProfileAlbumModal from './components/ProfileAlbumModal';
import './profile.css';

const ProfilePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const globalAudio = useGlobalAudio();
  const router = useRouter();
  
  // Состояния
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<ProfileAlbum | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });

  // Создаем экземпляр обработчиков
  const handlersProps: ProfileHandlersProps = {
    router,
    globalAudio,
    setProfileData,
    setEditData,
    setProfileLoading,
    setSaveLoading,
    setError,
    setIsEditing,
    setSelectedAlbum,
    setShowAlbumModal,
  };

  const handlers = createProfileHandlers(handlersProps);

  // Обработчики событий
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSaveProfile = () => {
    handlers.saveProfile(editData, profileData);
  };

  const handleCancelEdit = () => {
    handlers.handleCancelEdit(profileData);
  };

  // Мемоизированная функция загрузки профиля
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки профиля');
      }

      const data = await response.json();
      setProfileData(data.profile);
      setEditData({
        name: data.profile.name,
        bio: data.profile.bio,
        location: data.profile.location,
        website: data.profile.website
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Эффекты
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      fetchProfile();
    }
  }, [isAuthenticated, loading, fetchProfile]);

  // Состояния загрузки
  if (loading || profileLoading) {
    return (
      <div className="profile-page">
        <div className="profile-background">
          <PrismaticBurst 
            colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
            intensity={0.8}
            speed={0.5}
          />
        </div>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="profile-background">
          <PrismaticBurst 
            colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
            intensity={0.8}
            speed={0.5}
          />
        </div>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Ошибка загрузки профиля</p>
          <button onClick={fetchProfile} className="retry-btn">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Фоновый эффект PrismaticBurst */}
      <div className="profile-background">
        <PrismaticBurst 
          colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
          intensity={0.8}
          speed={0.5}
        />
      </div>

      <div className="profile-container">
        {/* Заголовок профиля */}
        <ProfileHeader
          profileData={profileData}
          isEditing={isEditing}
          saveLoading={saveLoading}
          error={error}
          onStartEdit={() => setIsEditing(true)}
          onSaveProfile={handleSaveProfile}
          onCancelEdit={handleCancelEdit}
        />

        {/* Основная информация */}
        <div className="profile-content">
          <ProfileDetails
            profileData={profileData}
            isEditing={isEditing}
            saveLoading={saveLoading}
            editData={editData}
            onInputChange={handleInputChange}
          />

          <ActivitySection activities={profileData.activity} />
        </div>

        {/* Плейлисты и альбомы пользователя */}
        <PlaylistsSection
          playlists={profileData.playlists}
          onCreatePlaylist={handlers.handleCreatePlaylist}
          onOpenAlbum={handlers.handleOpenAlbum}
          onPlayAlbum={handlers.handlePlayAlbum}
        />
      </div>

      {/* Модальное окно альбома */}
      <ProfileAlbumModal
        isOpen={showAlbumModal}
        album={selectedAlbum}
        globalAudio={globalAudio}
        onClose={() => setShowAlbumModal(false)}
      />
    </div>
  );
};

export default ProfilePage;