"use client";
import React, { ComponentType, memo, Suspense, lazy } from 'react';
import { usePerformanceOptimization } from '@/app/hooks/usePerformanceOptimization';

interface WithPerformanceOptimizationProps {
  enablePerformanceMonitoring?: boolean;
  fallbackComponent?: ComponentType;
  priority?: boolean;
}

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
    const { getOptimalQuality, isLowPerformanceDevice } = usePerformanceOptimization();

    // Для слабых устройств показываем fallback или упрощенную версию
    if (isLowPerformanceDevice && FallbackComponent && !priority) {
      return <FallbackComponent {...(props as any)} />;
    }

    const optimizedProps = {
      ...props,
      ...(enablePerformanceMonitoring && {
        quality: getOptimalQuality(),
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
    
    return memo((props: T) => (
      <Suspense fallback={
        FallbackComponent ? 
          <FallbackComponent {...(props as any)} /> : 
          <div style={{ background: 'transparent', width: '100%', height: '100%' }} />
      }>
        <LazyComponent {...props} />
      </Suspense>
    ));
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
