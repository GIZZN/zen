import { Pool } from 'pg';

// Поддерживаем как DATABASE_URL, так и отдельные переменные
const DATABASE_URL = process.env.DATABASE_URL;
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (!DATABASE_URL && missingEnvVars.length > 0) {
  throw new Error(`Missing DATABASE_URL or required environment variables: ${missingEnvVars.join(', ')}`);
}

// Функция для настройки SSL (оставлена для совместимости)
// const getSSLConfig = () => {
//   if (process.env.NODE_ENV !== 'production') {
//     return false;
//   }

//   // В production требуем SSL
//   const sslConfig: {
//     rejectUnauthorized: boolean;
//     ca?: string;
//     cert?: string;
//     key?: string;
//   } = {
//     rejectUnauthorized: true,
//   };

//   // Если предоставлен CA сертификат
//   if (process.env.DB_CA_CERT) {
//     sslConfig.ca = process.env.DB_CA_CERT;
//   }

//   // Если предоставлены клиентские сертификаты
//   if (process.env.DB_CLIENT_CERT && process.env.DB_CLIENT_KEY) {
//     sslConfig.cert = process.env.DB_CLIENT_CERT;
//     sslConfig.key = process.env.DB_CLIENT_KEY;
//   }

//   return sslConfig;
// };

// Создаем пул соединений с PostgreSQL
const pool = new Pool(
  DATABASE_URL 
    ? {
        connectionString: DATABASE_URL,
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      }
);

// Функция для выполнения запросов
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Логируем только в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    // Подробная информация об ошибке для диагностики
    console.error('Database query error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      query: text.substring(0, 100)
    });
    throw error;
  }
};

// Функция для получения клиента из пула (для транзакций)
export const getClient = () => {
  return pool.connect();
};

// Функция для закрытия пула соединений
export const end = () => {
  return pool.end();
};

// Функция для проверки здоровья БД
export const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now(),
      connection: result.rows.length > 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
};

// Функция для получения статистики пула соединений
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

// Типы для пользователя
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  email_verified: boolean;
}

// Типы для плейлиста
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  cover_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Типы для трека
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_url?: string;
  cover_url?: string;
  created_at: Date;
}