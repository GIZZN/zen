"use client";
import React, { ComponentType, memo, Suspense, lazy, useMemo } from 'react';

interface WithPerformanceOptimizationProps {
  enablePerformanceMonitoring?: boolean;
  fallbackComponent?: ComponentType;
  priority?: boolean;
}

// Статическое определение производительности устройства (БЕЗ ререндеров)
const getDeviceQuality = (): 'low' | 'medium' | 'high' => {
  if (typeof window === 'undefined') return 'medium';
  
  const navigator = window.navigator as any;
  const cores = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Простая классификация БЕЗ постоянного мониторинга
  if (memory && memory <= 2) return 'low';
  if (isMobile || cores <= 4) return 'low';
  if (memory && memory <= 4) return 'medium';
  if (cores <= 6) return 'medium';
  return 'high';
};

export function withPerformanceOptimization<T extends object>(
  WrappedComponent: ComponentType<T>,
  options: WithPerformanceOptimizationProps = {}
) {
  const {
    enablePerformanceMonitoring = true,
    fallbackComponent: FallbackComponent,
    priority = false
  } = options;

  const OptimizedComponent = memo((props: T) => {
    // Статическое определение качества (вычисляется ОДИН раз)
    const deviceQuality = useMemo(() => getDeviceQuality(), []);
    const isLowPerformanceDevice = deviceQuality === 'low';

    // Для слабых устройств показываем fallback или упрощенную версию
    if (isLowPerformanceDevice && FallbackComponent && !priority) {
      return <FallbackComponent {...(props as any)} />;
    }

    const optimizedProps = {
      ...props,
      ...(enablePerformanceMonitoring && {
        quality: deviceQuality,
        lazy: !priority,
        priority
      })
    } as T;

    return <WrappedComponent {...optimizedProps} />;
  });

  OptimizedComponent.displayName = `withPerformanceOptimization(${WrappedComponent.displayName || WrappedComponent.name})`;

  // Если не приоритетный компонент, делаем его lazy
  if (!priority) {
    const LazyComponent = lazy(() => Promise.resolve({ default: OptimizedComponent }));
    
    const LazyWrapper = memo((props: T) => (
      <Suspense fallback={
        FallbackComponent ? 
          <FallbackComponent {...(props as any)} /> : 
          <div style={{ background: 'transparent', width: '100%', height: '100%' }} />
      }>
        <LazyComponent {...props} />
      </Suspense>
    ));
    
    LazyWrapper.displayName = `LazyWrapper(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return LazyWrapper;
  }

  return OptimizedComponent;
}

// Простой fallback компонент для PrismaticBurst
export const PrismaticBurstFallback: React.FC<any> = ({ colors }) => {
  const gradientColors = colors?.slice(0, 3) || ['#1e90ff', '#9370db', '#20b2aa'];
  
  return (
    <div 
      className="prismatic-burst-container prismatic-burst-fallback"
      style={{
        background: `linear-gradient(45deg, ${gradientColors.join(', ')})`,
        opacity: 0.2,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        animation: 'pulse 3s ease-in-out infinite'
      }}
    />
  );
};
