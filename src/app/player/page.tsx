"use client";
import { useEffect, useState, memo, useCallback, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLocalPlayerStates } from '@/app/hooks/useLocalPlayerStates';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';
import { Album } from './modalalbum/modalalbum';
import { createPlayerHandlers, PlayerHandlersProps } from './handlers/playerHandlers';
import { createClickOutsideHandler } from './utils/playerUtils';
import HeroSection from './components/HeroSection';
import AlbumsSection from './components/AlbumsSection';
import TracksSection from './components/TracksSection';
import RecommendationsSection from './components/RecommendationsSection';
import './player.css';
import './modal.css';

// Lazy loading модальных окон для экономии памяти
const LyricsModal = lazy(() => import('./components/LyricsModal'));
const PlaylistModal = lazy(() => import('./components/PlaylistModal'));
const CreateAlbumModal = lazy(() => import('./components/CreateAlbumModal'));
const ModalAlbum = lazy(() => import('./modalalbum/modalalbum'));

const PlayerPage = memo(() => {
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

  // Оптимизированные обработчики drag & drop с useCallback
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isDragEnabled) {
      e.preventDefault();
      return;
    }
    setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [isDragEnabled]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);


  const handleDragEnd = useCallback(() => {
    setDraggedTrack(null);
    setDragOverIndex(null);
  }, []);
  
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

  // Обновляем handleDrop с правильным использованием reorderUserTracks
  const handleDropOptimized = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTrack !== null && draggedTrack !== dropIndex) {
      reorderUserTracks(draggedTrack, dropIndex);
    }
    setDraggedTrack(null);
    setDragOverIndex(null);
  }, [draggedTrack, reorderUserTracks]);

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

  // Мемоизируем setters объект для предотвращения лишних рендеров
  const setters = useMemo(() => ({
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
  }), []);

  // Мемоизируем создание обработчиков
  const handlersProps: PlayerHandlersProps = useMemo(() => ({
    currentTrack,
    globalAudio,
    userTracks,
    addToUserTracks,
    removeFromUserTracks,
    isTrackInUserTracks,
    reorderUserTracks,
    createAlbum,
    volume,
    setters
  }), [currentTrack, globalAudio, userTracks, addToUserTracks, removeFromUserTracks, 
      isTrackInUserTracks, reorderUserTracks, createAlbum, volume, setters]);

  const handlers = useMemo(() => createPlayerHandlers(handlersProps), [handlersProps]);

  // Оптимизированные адаптеры обработчиков с useCallback
  const handleGlobalProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => 
    handlers.handleGlobalProgressClick(e, isDragging, duration, currentTrack), 
    [handlers, isDragging, duration, currentTrack]);
  
  const handleGlobalVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => 
    handlers.handleGlobalVolumeChange(e, isDraggingVolume), 
    [handlers, isDraggingVolume]);
  
  const toggleMute = useCallback(() => handlers.toggleMute(), [handlers]);
  const handleLyricsClick = useCallback(() => handlers.handleLyricsClick(), [handlers]);
  const handleOpenAlbum = useCallback((album: Album) => handlers.handleOpenAlbum(album), [handlers]);
  const handleOpenPlaylistModal = useCallback(() => handlers.handleOpenPlaylistModal(), [handlers]);
  const toggleDragMode = useCallback(() => handlers.toggleDragMode(isDragEnabled), [handlers, isDragEnabled]);
  const handleAddRecommendedTracks = useCallback(() => handlers.handleAddRecommendedTracks(), [handlers]);

  // Оптимизированные коллбэки для закрытия модальных окон
  const closeCreateAlbum = useCallback(() => setShowCreateAlbum(false), []);
  const closeLyricsModal = useCallback(() => setShowLyricsModal(false), []);
  const closePlaylistModal = useCallback(() => setShowPlaylistModal(false), []);
  const closeAlbumModal = useCallback(() => setShowAlbumModal(false), []);
  const openCreateAlbum = useCallback(() => setShowCreateAlbum(true), []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Оптимизированная синхронизация треков с debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      globalAudio.updateTrackList(userTracks);
    }, 100); // Debounce для предотвращения частых обновлений

    return () => clearTimeout(timeoutId);
  }, [userTracks, globalAudio]);

  // Мемоизированный обработчик клика вне элемента
  const clickOutsideHandler = useMemo(() => createClickOutsideHandler(
    showPlayerMenu,
    showLyricsModal,
    showPlaylistModal,
    {
      setShowPlayerMenu,
      setShowLyricsModal,
      setShowPlaylistModal
    }
  ), [showPlayerMenu, showLyricsModal, showPlaylistModal]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    document.addEventListener('mousedown', clickOutsideHandler);
    return () => {
      document.removeEventListener('mousedown', clickOutsideHandler);
    };
  }, [clickOutsideHandler]);

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
          onCreateAlbum={openCreateAlbum}
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
          onDrop={handleDropOptimized}
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
      
      {/* Оптимизированные модальные окна с lazy loading */}
      {showCreateAlbum && (
        <Suspense fallback={<div className="loading-spinner" />}>
          <CreateAlbumModal 
            isOpen={showCreateAlbum}
            userTracks={userTracks}
            onClose={closeCreateAlbum}
            onCreateAlbum={createAlbum}
          />
        </Suspense>
      )}

      {showLyricsModal && (
        <Suspense fallback={<div className="loading-spinner" />}>
          <LyricsModal 
            isOpen={showLyricsModal}
            currentTrack={currentTrack}
            currentLyrics={currentLyrics}
            onClose={closeLyricsModal}
          />
        </Suspense>
      )}

      {showPlaylistModal && (
        <Suspense fallback={<div className="loading-spinner" />}>
          <PlaylistModal 
            isOpen={showPlaylistModal}
            userTracks={userTracks}
            onClose={closePlaylistModal}
          />
        </Suspense>
      )}

      {showAlbumModal && selectedAlbum && (
        <Suspense fallback={<div className="loading-spinner" />}>
          <ModalAlbum 
            isOpen={showAlbumModal}
            album={selectedAlbum}
            onClose={closeAlbumModal}
          />
        </Suspense>
      )}
    </div>
  );
});

PlayerPage.displayName = 'PlayerPage';

export default PlayerPage;