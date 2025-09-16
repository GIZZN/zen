'use client';

import { useEffect, useState, useCallback } from 'react';

interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  memoryPressure: 'low' | 'medium' | 'high';
  shouldReduceAnimations: boolean;
}

// Хук для мониторинга памяти и автоматического отключения анимаций при нехватке
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo>({
    memoryPressure: 'low',
    shouldReduceAnimations: false
  });

  const checkMemory = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Проверяем доступность API памяти
    interface MemoryInfo {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }
    
    const performance = (window as Window & { 
      performance: Performance & { memory?: MemoryInfo } 
    }).performance;
    const memory = performance?.memory;

    if (memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memory;
      
      // Вычисляем процент использования памяти
      const memoryUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
      
      let memoryPressure: 'low' | 'medium' | 'high' = 'low';
      let shouldReduceAnimations = false;

      if (memoryUsagePercent > 80) {
        memoryPressure = 'high';
        shouldReduceAnimations = true;
      } else if (memoryUsagePercent > 60) {
        memoryPressure = 'medium';
        shouldReduceAnimations = false;
      }

      setMemoryInfo({
        usedJSHeapSize,
        totalJSHeapSize,
        jsHeapSizeLimit,
        memoryPressure,
        shouldReduceAnimations
      });

      // Отладочная информация
      if (process.env.NODE_ENV === 'development') {
        console.log('Memory usage:', {
          used: Math.round(usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(jsHeapSizeLimit / 1024 / 1024) + 'MB',
          percentage: Math.round(memoryUsagePercent) + '%',
          pressure: memoryPressure
        });
      }
    }
  }, []);

  useEffect(() => {
    // Проверяем память при монтировании
    checkMemory();

    // Проверяем память каждые 5 секунд
    const interval = setInterval(checkMemory, 5000);

    // Проверяем память при изменении видимости страницы
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkMemory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkMemory]);

  return memoryInfo;
};

// Принудительная очистка памяти (если доступно)
export const forceGarbageCollection = () => {
  if (typeof window !== 'undefined') {
    const windowWithGC = window as Window & { gc?: () => void };
    if (windowWithGC.gc) {
      try {
        windowWithGC.gc();
        console.log('Forced garbage collection completed');
      } catch (error) {
        console.warn('Garbage collection failed:', error);
      }
    }
  }
};
