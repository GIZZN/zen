'use client';

import { useMemo } from 'react';
import { useMemoryMonitor } from './useMemoryMonitor';

// Простой хук для конфигурации эквалайзера с мониторингом памяти
export const useSimpleEqualizerConfig = () => {
  const { memoryPressure, shouldReduceAnimations } = useMemoryMonitor();
  return useMemo(() => {
    // Определяем является ли устройство мобильным по User Agent
    const isMobile = typeof window !== 'undefined' && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Определяем количество ядер (если доступно)
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    
    // Определяем объем памяти (если доступно)
    const memory = typeof navigator !== 'undefined' ? 
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined;
    
    // Более агрессивная логика для предотвращения фризов:
    const isLowMemoryDevice = memory && memory <= 2; // 2GB или меньше
    const isVeryLowEndDevice = cores <= 2 || isLowMemoryDevice;
    const isLowPerformance = isMobile || isVeryLowEndDevice;
    
    // Отладочная информация (только в development)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('Equalizer config:', {
        isMobile,
        cores,
        memory,
        isLowMemoryDevice,
        isVeryLowEndDevice,
        isLowPerformance,
        userAgent: navigator.userAgent
      });
    }
    
    // Многоуровневая оптимизация с учетом давления памяти
    const getOptimizedConfig = () => {
      // Критическое давление памяти - экстремальная оптимизация
      if (memoryPressure === 'high' || shouldReduceAnimations) {
        return {
          barsCount: 35, // Минимальное количество полосок
          animationDelay: 0.2,
          animationDuration: 3.0,
          animationVariation: 0.05,
          disableAnimation: true, // Полное отключение анимации
          useGPUAcceleration: false,
          reducedIntensity: true,
          memoryOptimized: true,
          updateInterval: 500
        };
      }
      
      // Среднее давление памяти или очень слабое устройство
      if (memoryPressure === 'medium' || isVeryLowEndDevice) {
        return {
          barsCount: 35, // Критично уменьшаем количество
          animationDelay: 0.18,
          animationDuration: 2.8,
          animationVariation: 0.08,
          disableAnimation: false,
          useGPUAcceleration: false, // Отключаем GPU для экономии памяти
          reducedIntensity: true,
          memoryOptimized: true,
          updateInterval: 300
        };
      }
      
      if (isLowPerformance) {
        // Обычные слабые устройства: умеренная оптимизация
        return {
          barsCount: 60,
          animationDelay: 0.12,
          animationDuration: 2.2,
          animationVariation: 0.15,
          disableAnimation: false,
          useGPUAcceleration: true,
          reducedIntensity: true,
          memoryOptimized: false,
          updateInterval: 150
        };
      } else {
        // Мощные устройства: полная версия
        return {
          barsCount: 140,
          animationDelay: 0.05,
          animationDuration: 1.2,
          animationVariation: 0.3,
          disableAnimation: false,
          useGPUAcceleration: true,
          reducedIntensity: false,
          memoryOptimized: false,
          updateInterval: 50
        };
      }
    };

    return getOptimizedConfig();
  }, [memoryPressure, shouldReduceAnimations]);
};
