import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  console.log('Testing database connection...');
  
  try {
    // Простой тест подключения
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('Database connection successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      data: result.rows[0],
      environment: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        NODE_ENV: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
