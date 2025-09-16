"use client";
import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  isLowPerformance: boolean;
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    isLowPerformance: false
  });

  const [shouldReduceQuality, setShouldReduceQuality] = useState(false);

  // Мониторинг FPS
  const measureFPS = useCallback(() => {
    let frames = 0;
    let lastTime = performance.now();
    
    const measureFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          isLowPerformance: fps < 30
        }));
        
        // Автоматическое снижение качества при низком FPS
        if (fps < 25) {
          setShouldReduceQuality(true);
        } else if (fps > 45) {
          setShouldReduceQuality(false);
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }, []);

  // Мониторинг памяти
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage
      }));
      
      // Снижение качества при высоком использовании памяти
      if (memoryUsage > 0.8) {
        setShouldReduceQuality(true);
      }
    }
  }, []);

  useEffect(() => {
    // Запускаем мониторинг только в браузере
    if (typeof window === 'undefined') return;
    
    measureFPS();
    
    const memoryInterval = setInterval(measureMemory, 2000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory]);

  // Функция для получения оптимального качества
  const getOptimalQuality = useCallback((): 'low' | 'medium' | 'high' => {
    if (shouldReduceQuality || metrics.isLowPerformance) {
      return 'low';
    }
    
    if (metrics.fps < 45 || metrics.memoryUsage > 0.6) {
      return 'medium';
    }
    
    return 'high';
  }, [shouldReduceQuality, metrics]);

  return {
    metrics,
    shouldReduceQuality,
    getOptimalQuality,
    isLowPerformanceDevice: metrics.isLowPerformance || shouldReduceQuality
  };
};
