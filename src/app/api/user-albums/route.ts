import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

interface JwtPayload extends jwt.JwtPayload {
  userId: string;
}


// Функция проверки токена
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Токен авторизации не предоставлен');
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('Ошибка конфигурации сервера');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded.userId;
  } catch {
    throw new Error('Недействительный токен');
  }
}

// GET - получить альбомы пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);

    // Создаем таблицу если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        album_id BIGINT NOT NULL,
        album_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, album_id)
      )
    `);

    // Получаем альбомы пользователя
    const result = await query(
      `SELECT 
        ua.album_id, ua.album_data, ua.created_at
       FROM user_albums ua
       WHERE ua.user_id = $1
       ORDER BY ua.created_at DESC`,
      [userId]
    );

    const userAlbums = result.rows.map(row => {
      let albumData;
      try {
        // Проверяем, является ли album_data уже объектом или строкой
        albumData = typeof row.album_data === 'string' ? JSON.parse(row.album_data) : row.album_data;
      } catch (error) {
        console.error('Error parsing album data:', error, 'Raw data:', row.album_data);
        // Если не удается распарсить, используем базовую структуру
        albumData = {
          id: row.album_id,
          title: 'Unknown Album',
          cover: '/api/placeholder/200/200',
          trackCount: 0,
          tracks: []
        };
      }
      
      return {
        ...albumData,
        createdAt: new Date(row.created_at)
      };
    });

    return NextResponse.json({ albums: userAlbums });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('User albums fetch error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка получения альбомов' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}

// POST - создать новый альбом
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();
    const { title, tracks } = body;

    console.log('Creating album request:', { userId, title, tracksCount: tracks?.length });

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      console.log('Validation failed - no tracks:', { tracks, isArray: Array.isArray(tracks), tracksLength: tracks?.length });
      return NextResponse.json(
        { message: 'Треки обязательны для создания альбома' },
        { status: 400 }
      );
    }

    // Создаем таблицу если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        album_id BIGINT NOT NULL,
        album_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, album_id)
      )
    `);

    // Миграция: изменяем тип album_id с INTEGER на BIGINT если нужно
    try {
      await query(`ALTER TABLE user_albums ALTER COLUMN album_id TYPE BIGINT`);
    } catch (error: unknown) {
      void error;
      // Игнорируем ошибку, если колонка уже BIGINT или таблица не существует
      console.log('Migration note: album_id column type change skipped or already applied');
    }

    const albumId = Date.now(); // Простой ID на основе времени
    const album = {
      id: albumId,
      title: (title?.trim()) || 'Новый альбом',
      cover: tracks[0]?.cover || '/api/placeholder/200/200',
      trackCount: tracks.length,
      tracks: tracks,
      createdAt: new Date()
    };

    console.log('Album object to save:', album);

    // Сохраняем альбом
    const albumDataString = JSON.stringify(album);
    console.log('Album data string:', albumDataString);
    
    await query(
      `INSERT INTO user_albums (user_id, album_id, album_data) 
       VALUES ($1, $2, $3)`,
      [userId, albumId, albumDataString]
    );

    console.log('Album saved successfully with ID:', albumId);

    return NextResponse.json({ 
      message: 'Альбом создан',
      album: album
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Create album error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка создания альбома' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}

// DELETE - удалить альбом
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');

    if (!albumId) {
      return NextResponse.json(
        { message: 'ID альбома не предоставлен' },
        { status: 400 }
      );
    }

    // Удаляем альбом
    const result = await query(
      `DELETE FROM user_albums 
       WHERE user_id = $1 AND album_id = $2`,
      [userId, BigInt(albumId)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'Альбом не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Альбом удален'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete album error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка удаления альбома' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}
