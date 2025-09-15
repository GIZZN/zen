import { NextRequest, NextResponse } from 'next/server';

// Разрешенные домены для CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Добавьте ваши production домены
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[];

// Rate limiting store (в production используйте Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Функция для rate limiting
function rateLimit(ip: string, limit: number = 100, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `${ip}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: limit - current.count };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent') || '';
  
  // Получаем IP адрес
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  // CORS настройки
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Проверяем origin для API запросов
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      // В development разрешаем localhost
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    
    // Обработка preflight запросов
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    // Rate limiting для API
    const { allowed, remaining } = rateLimit(ip, 100, 15 * 60 * 1000);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '900', // 15 минут
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString()
          }
        }
      );
    }

    // Добавляем заголовки rate limit
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
  }

  // Безопасность заголовки для всех запросов
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP для production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "media-src 'self' data: blob:;"
    );
  }

  // Блокируем подозрительные User-Agent
  const suspiciousAgents = [
    'curl', 'wget', 'python-requests', 'postman', 'insomnia'
  ];
  
  if (process.env.NODE_ENV === 'production' && 
      suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};