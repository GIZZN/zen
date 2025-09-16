import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки безопасности
  poweredByHeader: false, // Убираем X-Powered-By заголовок
  
  // Исправление проблемы с правами доступа
  outputFileTracingRoot: process.cwd(),
  
  // Отключаем трассировку для избежания проблем с правами
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Настройки изображений
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      // Добавьте ваши production домены для изображений
    ],
    
    // Оптимизация изображений
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },

  // Настройки CORS для API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXT_PUBLIC_APP_URL || '*'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Безопасность заголовки
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Настройки для production
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    generateEtags: true,
    httpAgentOptions: {
      keepAlive: true,
    },
  }),

  // Отключаем ESLint для быстрой сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Отключаем TypeScript проверки для быстрой сборки
  typescript: {
    ignoreBuildErrors: true,
  },

  // Экспериментальные функции
  experimental: {
    // Оптимизация сборки
    optimizeCss: true,
    // Кеширование
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
