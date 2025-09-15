import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

// Проверяем наличие JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Валидация
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Поиск пользователя в базе данных
    const userResult = await query(
      'SELECT id, email, password_hash, name, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Проверка активности аккаунта
    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Аккаунт деактивирован' },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Обновляем last_login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'zenplayer'
      } as jwt.SignOptions
    );

    return NextResponse.json({
      message: 'Успешный вход',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    // Логируем ошибки только в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    } else {
      console.error('Login failed');
    }
    
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}