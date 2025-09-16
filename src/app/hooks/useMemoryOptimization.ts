"use client";
import { useEffect, useCallback, useRef } from 'react';

interface MemoryOptimizationOptions {
  enableGarbageCollection?: boolean;
  memoryThreshold?: number;
  gcInterval?: number;
}

export const useMemoryOptimization = ({
  enableGarbageCollection = true,
  memoryThreshold = 0.85,
  gcInterval = 10000
}: MemoryOptimizationOptions = {}) => {
  const gcTimeoutRef = useRef<number | undefined>(undefined);
  const lastGCRef = useRef<number>(Date.now());

  // Принудительная сборка мусора (если доступна)
  const forceGarbageCollection = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    if (now - lastGCRef.current < 5000) return; // Не чаще раза в 5 секунд
    
    try {
      // Современные браузеры
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
      
      // Альтернативные методы
      if ('webkitRequestAnimationFrame' in window) {
        (window as any).webkitRequestAnimationFrame(() => {
          // Принуждаем браузер к очистке
        });
      }
      
      lastGCRef.current = now;
    } catch (e) {
      // Игнорируем ошибки GC
    }
  }, []);

  // Проверка использования памяти
  const checkMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return false;
    
    const memory = (performance as any).memory;
    const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    if (memoryUsage > memoryThreshold) {
      forceGarbageCollection();
      return true;
    }
    
    return false;
  }, [memoryThreshold, forceGarbageCollection]);

  // Оптимизация изображений в памяти
  const optimizeImageMemory = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Очищаем неиспользуемые canvas
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (!canvas.parentElement || canvas.width === 0 || canvas.height === 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  }, []);

  // Автоматическая оптимизация памяти
  useEffect(() => {
    if (!enableGarbageCollection) return;
    
    const runOptimization = () => {
      const highMemoryUsage = checkMemoryUsage();
      
      if (highMemoryUsage) {
        optimizeImageMemory();
      }
      
      gcTimeoutRef.current = window.setTimeout(runOptimization, gcInterval);
    };
    
    gcTimeoutRef.current = window.setTimeout(runOptimization, gcInterval);
    
    return () => {
      if (gcTimeoutRef.current) {
        clearTimeout(gcTimeoutRef.current);
      }
    };
  }, [enableGarbageCollection, gcInterval, checkMemoryUsage, optimizeImageMemory]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      forceGarbageCollection();
    };
  }, [forceGarbageCollection]);

  return {
    forceGarbageCollection,
    checkMemoryUsage,
    optimizeImageMemory
  };
};
