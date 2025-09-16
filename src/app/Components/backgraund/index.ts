// Оптимизированные экспорты для PrismaticBurst
export { default as PrismaticBurst } from './PrismaticBurst';
export { withPerformanceOptimization, PrismaticBurstFallback } from './withPerformanceOptimization';
export type { PrismaticBurstProps } from './PrismaticBurst';

// Готовые оптимизированные компоненты
import PrismaticBurstComponent from './PrismaticBurst';
import { withPerformanceOptimization, PrismaticBurstFallback } from './withPerformanceOptimization';

// Мгновенная версия без задержек для главной страницы
import React from 'react';

export const PrismaticBurstInstant = (props: any) => 
  React.createElement(PrismaticBurstComponent, { ...props, lazy: false, priority: true });

// Максимально оптимизированная версия для слабых устройств
export const PrismaticBurstOptimized = withPerformanceOptimization(
  PrismaticBurstComponent,
  {
    enablePerformanceMonitoring: true,
    fallbackComponent: PrismaticBurstFallback,
    priority: false
  }
);

// Приоритетная версия для критически важных элементов
export const PrismaticBurstPriority = withPerformanceOptimization(
  PrismaticBurstComponent,
  {
    enablePerformanceMonitoring: true,
    fallbackComponent: PrismaticBurstFallback,
    priority: true
  }
);
