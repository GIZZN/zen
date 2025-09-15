import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

interface JwtPayload extends jwt.JwtPayload {
  userId: string;
}

interface PlaylistData {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  coverUrl: string | null;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

// GET - получить профиль пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Токен авторизации не предоставлен' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        { message: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    // Верификация токена
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      return NextResponse.json(
        { message: 'Недействительный токен' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Получаем профиль пользователя
    const result = await query(
      `SELECT 
        id, name, email, bio, location, website, 
        created_at, updated_at, last_login
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Получаем статистику пользователя и плейлисты
    const statsResult = await query(
      `SELECT 
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 as days_since_registration
       FROM users
       WHERE id = $1`,
      [userId]
    );

    // Получаем плейлисты и альбомы пользователя
    let playlists: PlaylistData[] = [];
    let playlistCount = 0;
    let trackCount = 0;

    // Получаем плейлисты (если таблица существует)
    try {
      const playlistResult = await query(
        `SELECT 
          p.id, p.name, p.description, p.is_public, p.cover_url, p.created_at, p.updated_at,
          COUNT(pt.track_id) as track_count
         FROM playlists p
         LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
         WHERE p.user_id = $1
         GROUP BY p.id, p.name, p.description, p.is_public, p.cover_url, p.created_at, p.updated_at
         ORDER BY p.updated_at DESC`,
        [userId]
      );

      playlists = playlistResult.rows.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.is_public,
        coverUrl: playlist.cover_url,
        trackCount: parseInt(playlist.track_count) || 0,
        createdAt: new Date(playlist.created_at).toLocaleDateString('ru-RU'),
        updatedAt: new Date(playlist.updated_at).toLocaleDateString('ru-RU')
      }));
    } catch (error: unknown) {
      void error;
      console.log('Playlists table not found');
    }

    // Получаем альбомы пользователя
    try {
      const albumsResult = await query(
        `SELECT 
          ua.album_id, ua.album_data, ua.created_at
         FROM user_albums ua
         WHERE ua.user_id = $1
         ORDER BY ua.created_at DESC`,
        [userId]
      );

      const albums = albumsResult.rows.map(row => {
        let albumData;
        try {
          albumData = typeof row.album_data === 'string' ? JSON.parse(row.album_data) : row.album_data;
        } catch (error) {
          console.error('Error parsing album data:', error);
          albumData = {
            id: row.album_id,
            title: 'Unknown Album',
            cover: '/api/placeholder/200/200',
            trackCount: 0,
            tracks: []
          };
        }
        
        return {
          id: `album_${row.album_id}`,
          name: albumData.title,
          description: `Альбом с ${albumData.trackCount} треками`,
          isPublic: false,
          coverUrl: albumData.cover,
          trackCount: albumData.trackCount,
          createdAt: new Date(row.created_at).toLocaleDateString('ru-RU'),
          updatedAt: new Date(row.created_at).toLocaleDateString('ru-RU')
        };
      });

      // Объединяем плейлисты и альбомы
      playlists = [...playlists, ...albums];
    } catch (error: unknown) {
      void error;
      console.log('Albums table not found');
    }

    playlistCount = playlists.length;
    trackCount = playlists.reduce((sum, playlist) => sum + playlist.trackCount, 0);

    const stats = statsResult.rows[0] || {
      days_since_registration: 0
    };

    // Создаем простую активность на основе данных пользователя
    const activity = [
      {
        type: 'registration',
        text: 'Регистрация в системе',
        time: getRelativeTime(user.created_at),
        ip: null
      }
    ];

    // Добавляем активность последнего входа, если есть
    if (user.last_login) {
      activity.unshift({
        type: 'login',
        text: 'Последний вход в систему',
        time: getRelativeTime(user.last_login),
        ip: null
      });
    }

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio || 'Меломан и любитель хорошей музыки',
      location: user.location || '',
      website: user.website || '',
      joinDate: new Date(user.created_at).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long'
      }),
      lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString('ru-RU') : null,
      stats: {
        tracks: trackCount,
        playlists: playlistCount,
        hoursListened: Math.floor(parseInt(stats.days_since_registration) || 0) // Дни с регистрации
      },
      playlists: playlists,
      activity: activity
    };

    return NextResponse.json({ profile: profileData });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { message: 'Ошибка получения профиля' },
      { status: 500 }
    );
  }
}

// PUT - обновить профиль пользователя
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Токен авторизации не предоставлен' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        { message: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    // Верификация токена
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      return NextResponse.json(
        { message: 'Недействительный токен' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const body = await request.json();
    const { name, bio, location, website } = body;

    // Валидация данных
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: 'Имя должно содержать минимум 2 символа' },
        { status: 400 }
      );
    }

    if (website && !isValidUrl(website)) {
      return NextResponse.json(
        { message: 'Некорректный URL веб-сайта' },
        { status: 400 }
      );
    }

    // Обновляем профиль пользователя
    const result = await query(
      `UPDATE users 
       SET name = $1, bio = $2, location = $3, website = $4, updated_at = NOW()
       WHERE id = $5 AND is_active = true
       RETURNING id, name, email, bio, location, website, updated_at`,
      [name.trim(), bio?.trim() || null, location?.trim() || null, website?.trim() || null, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Пользователь не найден или не может быть обновлен' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: 'Профиль успешно обновлен',
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Ошибка обновления профиля' },
      { status: 500 }
    );
  }
}

// Вспомогательные функции
function getRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} мин назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч назад`;
  } else if (diffDays < 7) {
    return `${diffDays} д назад`;
  } else {
    return past.toLocaleDateString('ru-RU');
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}