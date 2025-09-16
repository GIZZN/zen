'use client';

import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  isLowEndDevice: boolean;
  hardwareConcurrency: number;
  memory?: number;
  connectionType?: string;
  shouldReduceAnimations: boolean;
}

export const usePerformanceDetection = (): PerformanceMetrics => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isLowEndDevice: false,
    hardwareConcurrency: 4,
    shouldReduceAnimations: false
  });

  useEffect(() => {
    const detectPerformance = () => {
      // Получаем количество ядер процессора
      const cores = navigator.hardwareConcurrency || 4;
      
      // Получаем информацию о памяти (если доступно)
      const memory = (navigator as any).deviceMemory;
      
      // Получаем информацию о соединении (если доступно)
      const connection = (navigator as any).connection;
      const connectionType = connection?.effectiveType || 'unknown';
      
      // Определяем слабое устройство по критериям (более мягкие критерии):
      const isLowEndDevice = 
        cores <= 2 || // 2 ядра или меньше
        (memory && memory <= 1) || // только 1GB RAM или меньше
        connectionType === 'slow-2g';

      // Проверяем предпочтения пользователя по анимациям
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Полностью отключаем анимации только при явном запросе пользователя
      const shouldReduceAnimations = prefersReducedMotion;

      setMetrics({
        isLowEndDevice,
        hardwareConcurrency: cores,
        memory,
        connectionType,
        shouldReduceAnimations
      });
    };

    // Запускаем детекцию после загрузки страницы
    if (typeof window !== 'undefined') {
      // Добавляем небольшую задержку для корректной инициализации
      const timeoutId = setTimeout(() => {
        detectPerformance();
      }, 100);
      
      // Слушаем изменения предпочтений анимации
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = () => detectPerformance();
      
      if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      } else {
        // Fallback для старых браузеров
        mediaQuery.addEventListener('change', handleChange);
      }
      
      return () => {
        clearTimeout(timeoutId);
        if (mediaQuery.removeListener) {
          mediaQuery.removeListener(handleChange);
        } else {
          mediaQuery.removeEventListener('change', handleChange);
        }
      };
    }
  }, []);

  return metrics;
};

// Хук для адаптивной конфигурации эквалайзера
export const useAdaptiveEqualizerConfig = () => {
  const { isLowEndDevice, shouldReduceAnimations } = usePerformanceDetection();
  
  return {
    // Уменьшаем количество полосок для слабых устройств, но не критично
    barsCount: isLowEndDevice ? 100 : 140,
    // Увеличиваем задержку анимации для плавности
    animationDelay: isLowEndDevice ? 0.08 : 0.05,
    // Упрощаем анимацию, но не слишком сильно
    animationDuration: isLowEndDevice ? 1.6 : 1.2,
    // Отключаем анимацию только при явном запросе пользователя
    disableAnimation: shouldReduceAnimations,
    // Уменьшаем вариативность анимации
    animationVariation: isLowEndDevice ? 0.25 : 0.3,
    // Используем GPU ускорение на всех устройствах, но с разной интенсивностью
    useGPUAcceleration: true,
    // Дополнительное снижение интенсивности для слабых устройств
    reducedIntensity: isLowEndDevice
  };
};
