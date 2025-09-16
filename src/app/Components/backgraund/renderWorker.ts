// Web Worker для оптимизации вычислений PrismaticBurst
interface WorkerMessage {
  type: 'OPTIMIZE_UNIFORMS' | 'CALCULATE_LOD' | 'SMOOTH_NOISE';
  data: any;
}

interface WorkerResponse {
  type: string;
  data: any;
}

// Оптимизированные математические функции
const fastSin = (x: number): number => {
  // Быстрая аппроксимация синуса для Web Worker
  const x2 = x * x;
  return x * (1 - x2 / 6 + x2 * x2 / 120);
};

const fastCos = (x: number): number => {
  const x2 = x * x;
  return 1 - x2 / 2 + x2 * x2 / 24;
};

// Сглаживание шума в отдельном потоке
const smoothNoise = (noiseData: Float32Array, width: number, height: number): Float32Array => {
  const result = new Float32Array(noiseData.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      result[idx] = (
        noiseData[idx - width - 1] * 0.0625 + // top-left
        noiseData[idx - width] * 0.125 +     // top
        noiseData[idx - width + 1] * 0.0625 + // top-right
        noiseData[idx - 1] * 0.125 +         // left
        noiseData[idx] * 0.25 +              // center
        noiseData[idx + 1] * 0.125 +         // right
        noiseData[idx + width - 1] * 0.0625 + // bottom-left
        noiseData[idx + width] * 0.125 +     // bottom
        noiseData[idx + width + 1] * 0.0625   // bottom-right
      );
    }
  }
  
  return result;
};

// Вычисление уровня детализации
const calculateLOD = (distance: number, performance: 'low' | 'medium' | 'high'): number => {
  const baseLOD = Math.max(0, Math.min(1, distance / 10));
  
  switch (performance) {
    case 'low':
      return Math.max(0.3, baseLOD * 0.7);
    case 'medium':
      return Math.max(0.5, baseLOD * 0.85);
    case 'high':
    default:
      return baseLOD;
  }
};

// Оптимизация uniform'ов
const optimizeUniforms = (uniforms: any, deltaTime: number) => {
  const optimized = { ...uniforms };
  
  // Квантование времени для экономии обновлений
  optimized.time = Math.round(uniforms.time * 30) / 30;
  
  // Сглаживание позиции мыши
  if (uniforms.mouse) {
    optimized.mouse = [
      Math.round(uniforms.mouse[0] * 100) / 100,
      Math.round(uniforms.mouse[1] * 100) / 100
    ];
  }
  
  return optimized;
};

// Главный обработчик сообщений
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;
  let response: WorkerResponse;
  
  try {
    switch (type) {
      case 'OPTIMIZE_UNIFORMS':
        response = {
          type: 'UNIFORMS_OPTIMIZED',
          data: optimizeUniforms(data.uniforms, data.deltaTime)
        };
        break;
        
      case 'CALCULATE_LOD':
        response = {
          type: 'LOD_CALCULATED',
          data: calculateLOD(data.distance, data.performance)
        };
        break;
        
      case 'SMOOTH_NOISE':
        response = {
          type: 'NOISE_SMOOTHED',
          data: smoothNoise(data.noiseData, data.width, data.height)
        };
        break;
        
      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
    
    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};

// Экспортируем для TypeScript
export {};
