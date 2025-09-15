"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLocalPlayerStates } from '@/app/hooks/useLocalPlayerStates';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';
import ModalAlbum, { Album } from './modalalbum/modalalbum';
import { createPlayerHandlers, PlayerHandlersProps } from './handlers/playerHandlers';
import { createClickOutsideHandler } from './utils/playerUtils';
import LyricsModal from './components/LyricsModal';
import PlaylistModal from './components/PlaylistModal';
import CreateAlbumModal from './components/CreateAlbumModal';
import HeroSection from './components/HeroSection';
import AlbumsSection from './components/AlbumsSection';
import TracksSection from './components/TracksSection';
import RecommendationsSection from './components/RecommendationsSection';
import './player.css';
import './modal.css';

export default function PlayerPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // Состояния UI
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [, setVolumeBeforeMute] = useState(0.6);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<string | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(true);

  // Обработчики drag & drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isDragEnabled) {
      e.preventDefault();
      return;
    }
    setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTrack !== null && draggedTrack !== dropIndex) {
      reorderUserTracks(draggedTrack, dropIndex);
    }
    setDraggedTrack(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTrack(null);
    setDragOverIndex(null);
  };
  
  // Глобальный аудио контекст
  const globalAudio = useGlobalAudio();
  
  // Локальные состояния и функции из useLocalPlayerStates
  const {
    isDragging,
    dragTime,
    isDraggingVolume,
    dragVolume,
    userTracks,
    albums,
    handleProgressMouseDown,
    handleProgressMouseMove,
    handleProgressMouseUp,
    handleVolumeMouseDown,
    handleVolumeMouseMove,
    handleVolumeMouseUp,
    addToUserTracks,
    removeFromUserTracks,
    isTrackInUserTracks,
    reorderUserTracks,
    createAlbum,
    deleteAlbum,
  } = useLocalPlayerStates();

  // Используем глобальные состояния для воспроизведения
  const currentTrack = globalAudio.currentTrack;
  const isPlaying = globalAudio.isPlaying;
  const currentTime = globalAudio.currentTime;
  const duration = globalAudio.duration;
  const volume = globalAudio.volume;
  const repeatMode = globalAudio.repeatMode;

  // Используем глобальные функции управления
  const handleTrackPlay = globalAudio.playTrack;
  const toggleRepeat = globalAudio.toggleRepeat;
  const handlePreviousTrack = globalAudio.previousTrack;
  const handleNextTrack = globalAudio.nextTrack;

  // Создаем экземпляр обработчиков
  const handlersProps: PlayerHandlersProps = {
    currentTrack,
    globalAudio,
    userTracks,
    addToUserTracks,
    removeFromUserTracks,
    isTrackInUserTracks,
    reorderUserTracks,
    createAlbum,
    volume,
    setters: {
      setIsMuted,
      setVolumeBeforeMute,
      setShowLyricsModal,
      setCurrentLyrics,
      setShowPlaylistModal,
      setShowPlayerMenu,
      setSelectedAlbum,
      setShowAlbumModal,
      setShowCreateAlbum,
      setIsDragEnabled,
      setDraggedTrack,
      setDragOverIndex,
    }
  };

  const handlers = createPlayerHandlers(handlersProps);

  // Адаптеры обработчиков для совместимости
  const handleGlobalProgressClick = (e: React.MouseEvent<HTMLDivElement>) => 
    handlers.handleGlobalProgressClick(e, isDragging, duration, currentTrack);
  
  const handleGlobalVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => 
    handlers.handleGlobalVolumeChange(e, isDraggingVolume);
  
  const toggleMute = handlers.toggleMute;
  const handleLyricsClick = handlers.handleLyricsClick;
  const handleOpenAlbum = handlers.handleOpenAlbum;
  const handleOpenPlaylistModal = handlers.handleOpenPlaylistModal;
  const toggleDragMode = () => handlers.toggleDragMode(isDragEnabled);
  const handleAddRecommendedTracks = handlers.handleAddRecommendedTracks;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Синхронизируем список треков с глобальным контекстом
  useEffect(() => {
    globalAudio.updateTrackList(userTracks);
  }, [userTracks, globalAudio]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = createClickOutsideHandler(
      showPlayerMenu,
      showLyricsModal,
      showPlaylistModal,
      {
        setShowPlayerMenu,
        setShowLyricsModal,
        setShowPlaylistModal
      }
    );

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlayerMenu, showLyricsModal, showPlaylistModal]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Пока происходит редирект
  }

  return (
    <div className="player-page">
      {/* Hero секция */}
      <HeroSection
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        repeatMode={repeatMode}
        isDragging={isDragging}
        dragTime={dragTime}
        isDraggingVolume={isDraggingVolume}
        dragVolume={dragVolume}
        isMuted={isMuted}
        showPlayerMenu={showPlayerMenu}
        onPreviousTrack={handlePreviousTrack}
        onPlayTrack={handleTrackPlay}
        onNextTrack={handleNextTrack}
        onToggleRepeat={toggleRepeat}
        onAddToPlaylist={handlers.handleAddToPlaylist}
        onTogglePlayerMenu={handlers.togglePlayerMenu}
        onToggleMute={toggleMute}
        onLyricsClick={handleLyricsClick}
        onProgressClick={handleGlobalProgressClick}
        onProgressMouseDown={handleProgressMouseDown}
        onProgressMouseMove={handleProgressMouseMove}
        onProgressMouseUp={handleProgressMouseUp}
        onVolumeClick={handleGlobalVolumeChange}
        onVolumeMouseDown={handleVolumeMouseDown}
        onVolumeMouseMove={handleVolumeMouseMove}
        onVolumeMouseUp={handleVolumeMouseUp}
        onCopyTrackInfo={handlers.handleCopyTrackInfo}
        onShareTrack={handlers.handleShareTrack}
        onOpenCreateAlbum={handlers.handleOpenCreateAlbumFromMenu}
        isTrackInUserTracks={isTrackInUserTracks}
      />

      <main className="player-content">
        {/* Секция альбомов */}
        <AlbumsSection
          albums={albums}
          onCreateAlbum={() => setShowCreateAlbum(true)}
          onOpenAlbum={handleOpenAlbum}
          onDeleteAlbum={deleteAlbum}
          onPlayTrack={handleTrackPlay}
        />

        {/* Секция треков */}
        <TracksSection
          userTracks={userTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          draggedTrack={draggedTrack}
          dragOverIndex={dragOverIndex}
          isDragEnabled={isDragEnabled}
          onPlayTrack={handleTrackPlay}
          onRemoveTrack={removeFromUserTracks}
          onOpenPlaylistModal={handleOpenPlaylistModal}
          onToggleDragMode={toggleDragMode}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />

        {/* Секция рекомендаций */}
        <RecommendationsSection
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={handleTrackPlay}
          onAddRecommendedTracks={handleAddRecommendedTracks}
          onAddToUserTracks={addToUserTracks}
          onRemoveFromUserTracks={removeFromUserTracks}
          isTrackInUserTracks={isTrackInUserTracks}
        />
      </main>
      
      {/* Модальные окна */}
      <CreateAlbumModal 
        isOpen={showCreateAlbum}
        userTracks={userTracks}
        onClose={() => setShowCreateAlbum(false)}
        onCreateAlbum={createAlbum}
      />

      <LyricsModal 
        isOpen={showLyricsModal}
        currentTrack={currentTrack}
        currentLyrics={currentLyrics}
        onClose={() => setShowLyricsModal(false)}
      />

      <PlaylistModal 
        isOpen={showPlaylistModal}
        userTracks={userTracks}
        onClose={() => setShowPlaylistModal(false)}
      />

      <ModalAlbum 
        isOpen={showAlbumModal}
        album={selectedAlbum}
        onClose={() => setShowAlbumModal(false)}
      />
    </div>
  );
}