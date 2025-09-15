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

// GET - получить треки пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);

    // Получаем треки пользователя
    const result = await query(
      `SELECT 
        ut.track_id, ut.track_data, ut.added_at
       FROM user_tracks ut
       WHERE ut.user_id = $1
       ORDER BY ut.added_at DESC`,
      [userId]
    );

    const userTracks = result.rows.map(row => {
      console.log('Raw row data:', {
        track_id: row.track_id,
        track_data: row.track_data,
        track_data_type: typeof row.track_data,
        added_at: row.added_at
      });
      
      let trackData;
      try {
        // Проверяем, является ли track_data уже объектом или строкой
        if (typeof row.track_data === 'string') {
          trackData = JSON.parse(row.track_data);
        } else if (typeof row.track_data === 'object' && row.track_data !== null) {
          trackData = row.track_data;
        } else {
          throw new Error('Invalid track_data format');
        }
      } catch (error) {
        console.error('Error parsing track data:', error, 'Raw data:', row.track_data);
        // Если не удается распарсить, используем базовую структуру
        trackData = {
          id: row.track_id,
          title: 'Unknown Track',
          artist: 'Unknown Artist',
          duration: '0:00',
          cover: '/api/placeholder/48/48'
        };
      }
      
      return {
        ...trackData,
        saved: true,
        addedAt: row.added_at
      };
    });

    return NextResponse.json({ tracks: userTracks });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('отношение "user_tracks" не существует')) {
      // Если таблица не существует, возвращаем пустой массив
      return NextResponse.json({ tracks: [] });
    }

    console.error('User tracks fetch error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка получения треков' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}

// POST - добавить трек в библиотеку пользователя
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();
    const { track } = body;

    if (!track || !track.id) {
      return NextResponse.json(
        { message: 'Данные трека не предоставлены' },
        { status: 400 }
      );
    }

    // Создаем таблицу если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id INTEGER NOT NULL,
        track_data JSONB NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, track_id)
      )
    `);

    // Проверяем, не добавлен ли уже трек
    const existingTrack = await query(
      `SELECT id FROM user_tracks WHERE user_id = $1 AND track_id = $2`,
      [userId, track.id]
    );

    if (existingTrack.rows.length > 0) {
      return NextResponse.json(
        { message: 'Трек уже добавлен в библиотеку' },
        { status: 409 }
      );
    }

    // Добавляем трек
    const trackDataString = JSON.stringify(track);
    console.log('Saving track data:', trackDataString);
    
    await query(
      `INSERT INTO user_tracks (user_id, track_id, track_data) 
       VALUES ($1, $2, $3)`,
      [userId, track.id, trackDataString]
    );

    return NextResponse.json({ 
      message: 'Трек добавлен в библиотеку',
      track: { ...track, saved: true }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Add track error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка добавления трека' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}

// DELETE - удалить трек из библиотеки пользователя
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { message: 'ID трека не предоставлен' },
        { status: 400 }
      );
    }

    // Удаляем трек
    const result = await query(
      `DELETE FROM user_tracks 
       WHERE user_id = $1 AND track_id = $2`,
      [userId, parseInt(trackId)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'Трек не найден в библиотеке' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Трек удален из библиотеки'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Remove track error:', error);
    return NextResponse.json(
      { message: errorMessage || 'Ошибка удаления трека' },
      { status: errorMessage.includes('Токен') ? 401 : 500 }
    );
  }
}