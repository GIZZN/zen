-- Очистка данных пользователя для исправления проблем с JSON
-- Выполните эти команды в PostgreSQL Query Tool

-- Удаляем существующие таблицы с поврежденными данными
DROP TABLE IF EXISTS user_tracks CASCADE;
DROP TABLE IF EXISTS user_albums CASCADE;

-- Создаем таблицы заново с правильной структурой
CREATE TABLE user_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL,
    track_data JSONB NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

CREATE TABLE user_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL,
    album_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, album_id)
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_tracks_user_id ON user_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_added_at ON user_tracks(added_at);
CREATE INDEX IF NOT EXISTS idx_user_albums_user_id ON user_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_user_albums_created_at ON user_albums(created_at);

-- Проверяем структуру таблиц
\d user_tracks
\d user_albums
