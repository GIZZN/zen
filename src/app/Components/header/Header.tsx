"use client";
import React, { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import './Header.css';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGlobalAudio } from '@/app/contexts/GlobalAudioContext';

const Header = memo(() => {
  const { user, isAuthenticated, logout } = useAuth();
  const { clearAudioState } = useGlobalAudio();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    }
    // Для неавторизованных пользователей ничего не делаем
  };

  const handleLogout = () => {
    clearAudioState();
    logout();
    setShowUserMenu(false);
  };

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Закрываем меню при изменении состояния аутентификации
  useEffect(() => {
    if (!isAuthenticated) {
      setShowUserMenu(false);
    }
  }, [isAuthenticated]);

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
            </svg>
          </div>
          <span className="logo-text">Zēn Player</span>
        </Link>
        
        <div className="nav-section">
          
          <div className="profile-section" ref={menuRef}>
            <div 
              className={`profile-icon ${isAuthenticated ? 'authenticated' : 'disabled'}`}
              onClick={handleProfileClick}
            >
              {isAuthenticated ? (
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            
            {showUserMenu && isAuthenticated && (
              <div className="user-menu">
                <div className="user-info">
                  <p className="user-name">{user?.name}</p>
                  <p className="user-email">{user?.email}</p>
                </div>
                <div className="menu-divider"></div>
                <button className="menu-item" onClick={() => { setShowUserMenu(false); window.location.href = '/player'; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                  </svg>
                  Открыть плеер
                </button>
                <Link href="/profile" className="menu-item" onClick={() => setShowUserMenu(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Профиль
                </Link>
                <div className="menu-divider"></div>
                <button className="menu-item logout" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
