import { NextResponse } from 'next/server';
import { healthCheck, getPoolStats } from '@/lib/db';

export async function GET() {
  try {
    const dbHealth = await healthCheck();
    const poolStats = getPoolStats();
    
    const health = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      connectionPool: poolStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 503 }
    );
  }
}