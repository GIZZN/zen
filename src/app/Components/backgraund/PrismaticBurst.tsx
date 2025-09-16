"use client";
import React, { useEffect, useRef, useMemo, useCallback, memo, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import dynamic from 'next/dynamic';
import { useMemoryOptimization } from '@/app/hooks/useMemoryOptimization';
import './PrismaticBurst.css';

type Offset = { x?: number | string; y?: number | string };
type AnimationType = 'rotate' | 'rotate3d' | 'hover';

export type PrismaticBurstProps = {
  intensity?: number;
  speed?: number;
  animationType?: AnimationType;
  colors?: string[];
  distort?: number;
  paused?: boolean;
  offset?: Offset;
  hoverDampness?: number;
  rayCount?: number;
  mixBlendMode?: React.CSSProperties['mixBlendMode'] | 'none';
  quality?: 'low' | 'medium' | 'high';
  lazy?: boolean;
  priority?: boolean;
  enableIntersectionObserver?: boolean;
};

const vertexShader = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;

uniform float uIntensity;
uniform float uSpeed;
uniform int   uAnimType;
uniform vec2  uMouse;
uniform int   uColorCount;
uniform float uDistort;
uniform vec2  uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int   uRayCount;
uniform int   uMaxIterations;
uniform int   uDynamicIterations;
uniform int   uOptimizationLevel;
uniform float uRaySharpness;
uniform float uNoiseReduction;
uniform vec2  uTemporalOffset;

float hash21(vec2 p){
    p = floor(p);
    float f = 52.9829189 * fract(dot(p, vec2(0.065, 0.005)));
    return fract(f);
}

mat2 rot30(){ return mat2(0.8, -0.5, 0.5, 0.8); }

// Улучшенный шум с уменьшением ряби
float layeredNoise(vec2 fragPx){
    vec2 p = mod(fragPx + vec2(uTime * 30.0, -uTime * 21.0) + uTemporalOffset, 1024.0);
    vec2 q = rot30() * p;
    float n = 0.0;
    
    // Базовые слои с улучшенным качеством
    n += 0.40 * hash21(q);
    n += 0.25 * hash21(q * 2.0 + 17.0);
    n += 0.20 * hash21(q * 4.0 + 47.0);
    
    // Адаптивная детализация
    if (uOptimizationLevel == 0) {
        n += 0.10 * hash21(q * 8.0 + 113.0);
        n += 0.05 * hash21(q * 16.0 + 191.0);
    } else {
        // Для слабых устройств - оптимизированная детализация
        n += 0.15 * hash21(q * 6.0 + 113.0);
    }
    
    // Уменьшение ряби через сглаживание
    if (uNoiseReduction > 0.0) {
        float smoothed = 0.5 * (n + 0.5 * (
            hash21(q + vec2(1.0, 0.0)) + 
            hash21(q + vec2(-1.0, 0.0)) + 
            hash21(q + vec2(0.0, 1.0)) + 
            hash21(q + vec2(0.0, -1.0))
        ) * 0.25);
        n = mix(n, smoothed, uNoiseReduction);
    }
    
    return n;
}

// Функция повышения четкости лучей
float sharpenRay(float rayPattern, float sharpness) {
    if (sharpness <= 0.0) return rayPattern;
    
    // Применяем функцию повышения контраста
    float enhanced = pow(rayPattern, 1.0 - sharpness * 0.3);
    enhanced = smoothstep(0.3 - sharpness * 0.1, 0.8 + sharpness * 0.1, enhanced);
    
    return enhanced;
}

vec3 rayDir(vec2 frag, vec2 res, vec2 offset, float dist){
    float focal = res.y * max(dist, 1e-3);
    return normalize(vec3(2.0 * (frag - offset) - res, focal));
}

float edgeFade(vec2 frag, vec2 res, vec2 offset){
    vec2 toC = frag - 0.5 * res - offset;
    float r = length(toC) / (0.5 * min(res.x, res.y));
    float x = clamp(r, 0.0, 1.0);
    float q = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    float s = q * 0.5;
    s = pow(s, 1.5);
    float tail = 1.0 - pow(1.0 - s, 2.0);
    s = mix(s, tail, 0.2);
    float dn = (layeredNoise(frag * 0.15) - 0.5) * 0.0015 * s;
    return clamp(s + dn, 0.0, 1.0);
}

mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotZ(float a){ float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

vec3 sampleGradient(float t){
    t = clamp(t, 0.0, 1.0);
    return texture(uGradient, vec2(t, 0.5)).rgb;
}

vec2 rot2(vec2 v, float a){
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c) * v;
}

float bendAngle(vec3 q, float t){
    // Оптимизация для слабых устройств - меньше вычислений sin
    if (uOptimizationLevel > 0) {
        float a = 0.8 * sin(q.x * 0.55 + t * 0.6)
                + 0.7 * sin(q.y * 0.50 - t * 0.5);
        return a;
    } else {
        float a = 0.8 * sin(q.x * 0.55 + t * 0.6)
                + 0.7 * sin(q.y * 0.50 - t * 0.5)
                + 0.6 * sin(q.z * 0.60 + t * 0.7);
        return a;
    }
}

void main(){
    vec2 frag = gl_FragCoord.xy;
    float t = uTime * uSpeed;
    float jitterAmp = 0.1 * clamp(uNoiseAmount, 0.0, 1.0);
    vec3 dir = rayDir(frag, uResolution, uOffset, 1.0);
    float marchT = 0.0;
    vec3 col = vec3(0.0);
    float n = layeredNoise(frag);
    vec4 c = cos(t * 0.2 + vec4(0.0, 33.0, 11.0, 0.0));
    mat2 M2 = mat2(c.x, c.y, c.z, c.w);
    float amp = clamp(uDistort, 0.0, 50.0) * 0.15;

    mat3 rot3dMat = mat3(1.0);
    if(uAnimType == 1){
      vec3 ang = vec3(t * 0.31, t * 0.21, t * 0.17);
      rot3dMat = rotZ(ang.z) * rotY(ang.y) * rotX(ang.x);
    }
    mat3 hoverMat = mat3(1.0);
    if(uAnimType == 2){
      vec2 m = uMouse * 2.0 - 1.0;
      vec3 ang = vec3(m.y * 0.6, m.x * 0.6, 0.0);
      hoverMat = rotY(ang.y) * rotX(ang.x);
    }

    int actualIterations = min(uDynamicIterations, uMaxIterations);
    for (int i = 0; i < actualIterations; ++i) {
        vec3 P = marchT * dir;
        P.z -= 2.0;
        float rad = length(P);
        vec3 Pl = P * (10.0 / max(rad, 1e-6));

        if(uAnimType == 0){
            Pl.xz *= M2;
        } else if(uAnimType == 1){
      Pl = rot3dMat * Pl;
        } else {
      Pl = hoverMat * Pl;
        }

        // Оптимизация stepLen для производительности
        float stepLen = uOptimizationLevel > 0 
            ? min(rad - 0.2, n * jitterAmp * 0.8) + 0.12  // Быстрее
            : min(rad - 0.3, n * jitterAmp) + 0.1;        // Точнее

        float grow = smoothstep(0.35, 3.0, marchT);
        float a1 = amp * grow * bendAngle(Pl * 0.6, t);
        float a2 = 0.5 * amp * grow * bendAngle(Pl.zyx * 0.5 + 3.1, t * 0.9);
        vec3 Pb = Pl;
        Pb.xz = rot2(Pb.xz, a1);
        Pb.xy = rot2(Pb.xy, a2);

        float rayPattern = smoothstep(
            0.5, 0.7,
            sin(Pb.x + cos(Pb.y) * cos(Pb.z)) *
            sin(Pb.z + sin(Pb.y) * cos(Pb.x + t))
        );

        if (uRayCount > 0) {
            float ang = atan(Pb.y, Pb.x);
            float comb = 0.5 + 0.5 * cos(float(uRayCount) * ang);
            comb = pow(comb, 3.0);
            rayPattern *= smoothstep(0.15, 0.95, comb);
        }
        
        // Применяем повышение четкости лучей
        rayPattern = sharpenRay(rayPattern, uRaySharpness);

        vec3 spectralDefault = 1.0 + vec3(
            cos(marchT * 3.0 + 0.0),
            cos(marchT * 3.0 + 1.0),
            cos(marchT * 3.0 + 2.0)
        );

        float saw = fract(marchT * 0.25);
        float tRay = saw * saw * (3.0 - 2.0 * saw);
        vec3 userGradient = 2.0 * sampleGradient(tRay);
        vec3 spectral = (uColorCount > 0) ? userGradient : spectralDefault;
        vec3 base = (0.05 / (0.4 + stepLen))
                  * smoothstep(5.0, 0.0, rad)
                  * spectral;

        col += base * rayPattern;
        marchT += stepLen;
    }

    col *= edgeFade(frag, uResolution, uOffset);
    col *= uIntensity;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const hexToRgb01 = (hex: string): [number, number, number] => {
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) {
    const r = h[0],
      g = h[1],
      b = h[2];
    h = r + r + g + g + b + b;
  }
  const intVal = parseInt(h, 16);
  if (isNaN(intVal) || (h.length !== 6 && h.length !== 8)) return [1, 1, 1];
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;
  return [r, g, b];
};

const toPx = (v: number | string | undefined): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  const num = parseFloat(s.replace('px', ''));
  return isNaN(num) ? 0 : num;
};

// Кеш для производительности устройства
let cachedPerformance: 'low' | 'medium' | 'high' | null = null;

// Кеш для WebGL контекста
let webGLContextCache: WebGL2RenderingContext | null = null;

// Кеш для шейдеров
const shaderCache = new Map<string, WebGLShader>();

// Пул объектов для переиспользования
const objectPool = {
  vectors: [] as Float32Array[],
  matrices: [] as Float32Array[],
  
  getVector(): Float32Array {
    return this.vectors.pop() || new Float32Array(2);
  },
  
  returnVector(vec: Float32Array): void {
    if (this.vectors.length < 10) { // Ограничиваем размер пула
      this.vectors.push(vec);
    }
  },
  
  getMatrix(): Float32Array {
    return this.matrices.pop() || new Float32Array(16);
  },
  
  returnMatrix(mat: Float32Array): void {
    if (this.matrices.length < 5) {
      this.matrices.push(mat);
    }
  }
};

// Агрессивное определение производительности для устройств с малой памятью
const getDevicePerformance = (): 'low' | 'medium' | 'high' => {
  if (cachedPerformance) return cachedPerformance;
  
  const navigator = typeof window !== 'undefined' ? window.navigator : null;
  if (!navigator) {
    cachedPerformance = 'low'; // По умолчанию low для экономии памяти
    return cachedPerformance;
  }

  // Проверка количества ядер процессора
  const cores = (navigator as any).hardwareConcurrency || 2;
  
  // Проверка памяти устройства (если доступно)
  const memory = (navigator as any).deviceMemory;
  
  // Проверка User Agent для мобильных устройств
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Проверка connection для медленного интернета
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  
  // Проверка доступной памяти через performance.memory
  let availableMemory = 0;
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    availableMemory = mem.jsHeapSizeLimit / (1024 * 1024 * 1024); // В ГБ
  }
  
  // АГРЕССИВНАЯ классификация для экономии памяти
  if (memory && memory <= 2) cachedPerformance = 'low';
  else if (availableMemory > 0 && availableMemory <= 1.5) cachedPerformance = 'low';
  else if (isMobile || cores <= 4) cachedPerformance = 'low';
  else if (memory && memory <= 4) cachedPerformance = 'medium';
  else if (cores <= 6 || isSlowConnection) cachedPerformance = 'medium';
  else cachedPerformance = 'high';
  
  console.log(`Device performance: ${cachedPerformance} (cores: ${cores}, memory: ${memory}GB, available: ${availableMemory.toFixed(1)}GB)`);
  
  return cachedPerformance;
};

// Оптимизированная функция для проверки поддержки WebGL2 с кешированием
const checkWebGLSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Используем кеш если уже проверяли
  if (webGLContextCache !== null) return true;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1; // Минимальный размер для теста
    canvas.height = 1;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (gl) {
      webGLContextCache = gl;
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Оптимизированная функция создания шейдера с кешированием
const createShaderCached = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
  const cacheKey = `${type}_${source.length}_${source.substring(0, 50)}`;
  
  if (shaderCache.has(cacheKey)) {
    return shaderCache.get(cacheKey)!;
  }
  
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  shaderCache.set(cacheKey, shader);
  return shader;
};

const PrismaticBurstCore = ({
  intensity = 2,
  speed = 0.5,
  animationType = 'rotate3d',
  colors,
  distort = 0,
  paused = false,
  offset = { x: 0, y: 0 },
  hoverDampness = 0,
  rayCount,
  mixBlendMode = 'lighten',
  quality,
  lazy = true,
  priority = false,
  enableIntersectionObserver = true
}: PrismaticBurstProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const mouseTargetRef = useRef<[number, number]>([0.5, 0.5]);
  const mouseSmoothRef = useRef<[number, number]>([0.5, 0.5]);
  const pausedRef = useRef<boolean>(paused);
  const gradTexRef = useRef<Texture | null>(null);
  const hoverDampRef = useRef<number>(hoverDampness);
  const isVisibleRef = useRef<boolean>(true);
  const meshRef = useRef<Mesh | null>(null);
  const triRef = useRef<Triangle | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumTimeRef = useRef<number>(0);
  const visibilityTimeoutRef = useRef<number>(0);
  const workerRef = useRef<Worker | null>(null);
  
  // Кеш для uniform'ов
  const uniformCacheRef = useRef<{
    lastMouse: [number, number];
    lastTime: number;
    lastIntensity: number;
    framesSinceUpdate: number;
  }>({
    lastMouse: [0.5, 0.5],
    lastTime: 0,
    lastIntensity: 0,
    framesSinceUpdate: 0
  });
  
  // Система мониторинга памяти и экстренного режима
  const memoryMonitorRef = useRef<{
    lastMemoryCheck: number;
    memoryPressure: number;
    emergencyMode: boolean;
    dynamicIterations: number;
    dynamicDPR: number;
    pausedDueToMemory: boolean;
  }>({
    lastMemoryCheck: 0,
    memoryPressure: 0,
    emergencyMode: false,
    dynamicIterations: 24,
    dynamicDPR: 1.0,
    pausedDueToMemory: false
  });
  
  // Состояние для ленивой загрузки
  const [shouldRender, setShouldRender] = useState(!lazy || priority);
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(
    typeof window !== 'undefined' ? checkWebGLSupport() : null
  );
  
  // Оптимизация памяти
  const { forceGarbageCollection, checkMemoryUsage } = useMemoryOptimization({
    enableGarbageCollection: true,
    memoryThreshold: 0.8,
    gcInterval: 15000
  });
  
  // Мемоизированные обработчики событий
  const handleVisibilityChange = useCallback(() => {
    const monitor = memoryMonitorRef.current;
    
    if (document.hidden) {
      // МГНОВЕННАЯ пауза для экономии памяти
      isVisibleRef.current = false;
      
      // Агрессивная очистка памяти при скрытии вкладки (всегда для экономии)
      forceGarbageCollection();
      
      // Дополнительная очистка через 1 секунду
      visibilityTimeoutRef.current = window.setTimeout(() => {
        forceGarbageCollection();
      }, 1000);
    } else {
      clearTimeout(visibilityTimeoutRef.current);
      isVisibleRef.current = true;
      
      // Сброс экстренного режима при возврате к вкладке
      monitor.pausedDueToMemory = false;
      monitor.emergencyMode = false;
    }
  }, [forceGarbageCollection]);
  
  const handlePointerMove = useCallback((e: PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
    mouseTargetRef.current = [
      Math.min(Math.max(x, 0), 1), 
      Math.min(Math.max(y, 0), 1)
    ];
  }, []);
  
  // Агрессивный мониторинг памяти для устройств с 2 ГБ
  const checkMemoryPressure = useCallback(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return 0;
    
    const memory = (performance as any).memory;
    const usedPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    const totalUsed = memory.totalJSHeapSize / (1024 * 1024); // В МБ
    
    // Критические пороги для устройств с малой памятью
    if (usedPercent > 0.9 || totalUsed > 800) return 1.0; // Критично
    if (usedPercent > 0.8 || totalUsed > 600) return 0.8; // Высокое давление
    if (usedPercent > 0.7 || totalUsed > 400) return 0.6; // Среднее давление
    if (usedPercent > 0.6 || totalUsed > 300) return 0.4; // Низкое давление
    
    return Math.max(0, usedPercent - 0.5) * 2; // Нормализуем 0.5-1.0 -> 0.0-1.0
  }, []);
  
  // Динамическая адаптация качества
  const adaptQuality = useCallback((memoryPressure: number) => {
    const monitor = memoryMonitorRef.current;
    const settings = qualitySettings;
    
    if (memoryPressure > 0.9) {
      // ЭКСТРЕННЫЙ РЕЖИМ - минимальное качество
      monitor.emergencyMode = true;
      monitor.dynamicIterations = Math.max(6, settings.maxIterations * 0.25);
      monitor.dynamicDPR = Math.max(0.2, settings.dpr * 0.5);
      monitor.pausedDueToMemory = true;
    } else if (memoryPressure > 0.7) {
      // КРИТИЧЕСКИЙ РЕЖИМ
      monitor.emergencyMode = false;
      monitor.dynamicIterations = Math.max(8, settings.maxIterations * 0.4);
      monitor.dynamicDPR = Math.max(0.25, settings.dpr * 0.7);
      monitor.pausedDueToMemory = false;
    } else if (memoryPressure > 0.5) {
      // ПОНИЖЕННОЕ КАЧЕСТВО
      monitor.dynamicIterations = Math.max(10, settings.maxIterations * 0.6);
      monitor.dynamicDPR = Math.max(0.3, settings.dpr * 0.8);
      monitor.pausedDueToMemory = false;
    } else if (memoryPressure > 0.3) {
      // АДАПТИВНОЕ КАЧЕСТВО
      monitor.dynamicIterations = Math.max(12, settings.maxIterations * 0.8);
      monitor.dynamicDPR = Math.max(0.35, settings.dpr * 0.9);
      monitor.pausedDueToMemory = false;
    } else {
      // НОРМАЛЬНОЕ КАЧЕСТВО
      monitor.dynamicIterations = settings.maxIterations;
      monitor.dynamicDPR = settings.dpr;
      monitor.pausedDueToMemory = false;
      monitor.emergencyMode = false;
    }
    
    monitor.memoryPressure = memoryPressure;
  }, []);
  
  // Мемоизация настроек качества
  const qualitySettings = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        dpr: 1,
        maxIterations: 24,
        updateRate: 30,
        antialias: false,
        skipFrames: 0,
        intensityMultiplier: 1.0,
        renderOptimizations: {
          simplifiedShader: false,
          reducedPrecision: false,
          batchUpdates: false,
          useWebWorker: false,
          cacheUniforms: true,
          optimizedMath: false
        }
      };
    }

    const devicePerformance = quality || getDevicePerformance();
    
    return {
      low: {
        dpr: 0.8, // ВЫСОКОЕ разрешение для топового качества
        maxIterations: 28, // ВЫСОКОЕ количество итераций для детализации
        updateRate: 60, // 60 FPS для плавности
        antialias: true, // Включен для качества
        skipFrames: 0, // БЕЗ пропуска кадров
        intensityMultiplier: 1.0, // Натуральная интенсивность
        renderOptimizations: {
          simplifiedShader: false, // ПОЛНЫЙ шейдер для качества
          reducedPrecision: false, // ПОЛНАЯ точность
          batchUpdates: false, // БЕЗ батчинга для плавности
          useWebWorker: true, // Web Worker для производительности
          cacheUniforms: true, // Умное кеширование
          optimizedMath: true, // Быстрая математика (невидимо)
          temporalUpsampling: true, // Временное увеличение разрешения
          raySharpening: true, // Четкие лучи
          noiseReduction: true, // Минимальная рябь
          smartLOD: true, // Умная детализация
          memoryAggressive: false, // НЕ агрессивная очистка
          pauseOnInactive: true, // Пауза только при неактивности
          dynamicQuality: false, // БЕЗ снижения качества
          emergencyMode: false, // БЕЗ экстренного режима
          invisibleOptimizations: true // Невидимые оптимизации
        }
      },
      medium: {
        dpr: Math.min(window.devicePixelRatio || 1, 0.8),
        maxIterations: 26, // Оптимизированный визуал
        updateRate: 60, // Целевые 60 FPS
        antialias: false,
        skipFrames: 0,
        intensityMultiplier: 1.0, // Полная интенсивность
        renderOptimizations: {
          simplifiedShader: false,
          reducedPrecision: true,
          batchUpdates: false, // 60 FPS без батчинга
          useWebWorker: false,
          cacheUniforms: true,
          optimizedMath: true
        }
      },
      high: {
        dpr: Math.min(window.devicePixelRatio || 1, 1.2), // Снижено для стабильности
        maxIterations: 30, // Немного снижено для стабильных 60 FPS
        updateRate: 60,
        antialias: false,
        skipFrames: 0,
        intensityMultiplier: 1.0, // Полная интенсивность
        renderOptimizations: {
          simplifiedShader: false,
          reducedPrecision: false,
          batchUpdates: false,
          useWebWorker: false,
          cacheUniforms: true,
          optimizedMath: false // Полная точность для high-end
        }
      }
    }[devicePerformance];
  }, [quality]);
  
  // Мемоизация цветов
  const memoizedColors = useMemo(() => colors, [colors?.join(',')]);
  
  // Проверка WebGL при монтировании (только если еще не проверили)
  useEffect(() => {
    if (!shouldRender || webGLSupported !== null) return;
    
    const supported = checkWebGLSupport();
    setWebGLSupported(supported);
    
    if (!supported) {
      console.warn('WebGL2 not supported, PrismaticBurst will not render');
    }
  }, [shouldRender, webGLSupported]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    hoverDampRef.current = hoverDampness;
  }, [hoverDampness]);

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    if (!lazy || shouldRender || !enableIntersectionObserver) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '100px', // Загружать за 100px до появления
        threshold: 0.1 
      }
    );
    
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [lazy, shouldRender, enableIntersectionObserver]);

  // Инициализация Web Worker
  useEffect(() => {
    if (qualitySettings.renderOptimizations?.useWebWorker && typeof Worker !== 'undefined') {
      try {
        const workerBlob = new Blob([`
          // Встроенный Web Worker код
          const fastSin = (x) => {
            const x2 = x * x;
            return x * (1 - x2 / 6 + x2 * x2 / 120);
          };
          
          const optimizeUniforms = (uniforms, deltaTime) => {
            // НЕВИДИМЫЕ оптимизации в Web Worker
            const optimized = { ...uniforms };
            
            // Высокая точность для топового качества
            optimized.time = Math.round(uniforms.time * 120) / 120; // 120 FPS точность
            
            if (uniforms.mouse) {
              // Субпиксельная точность для плавности
              optimized.mouse = [
                Math.round(uniforms.mouse[0] * 2000) / 2000,
                Math.round(uniforms.mouse[1] * 2000) / 2000
              ];
            }
            
            // Превентивная очистка памяти в Worker
            if (Math.random() < 0.01) { // 1% шанс каждый кадр
              if (typeof gc === 'function') gc();
            }
            
            return optimized;
          };
          
          self.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'OPTIMIZE_UNIFORMS') {
              self.postMessage({
                type: 'UNIFORMS_OPTIMIZED',
                data: optimizeUniforms(data.uniforms, data.deltaTime)
              });
            }
          };
        `], { type: 'application/javascript' });
        
        workerRef.current = new Worker(URL.createObjectURL(workerBlob));
      } catch (error) {
        console.warn('Web Worker не поддерживается:', error);
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [qualitySettings.renderOptimizations?.useWebWorker]);

  // Главный эффект рендеринга
  useEffect(() => {
    if (!shouldRender) return;
    
    // Для приоритетных компонентов рендерим сразу, даже если WebGL еще не проверен
    if (webGLSupported === false) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Если WebGL еще не проверен, но это priority компонент, проверим сейчас
    if (webGLSupported === null && priority) {
      const supported = checkWebGLSupport();
      setWebGLSupported(supported);
      if (!supported) return;
    }
    
    const settings = qualitySettings;
    const dpr = settings.dpr;
    
    // Оптимизированные настройки рендерера
    const renderer = new Renderer({ 
      dpr, 
      alpha: false, 
      antialias: settings.antialias
    });
    rendererRef.current = renderer;

    const gl = renderer.gl;
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.inset = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.mixBlendMode = mixBlendMode && mixBlendMode !== 'none' ? mixBlendMode : '';
    container.appendChild(gl.canvas);

    const white = new Uint8Array([255, 255, 255, 255]);
    const gradientTex = new Texture(gl, {
      image: white,
      width: 1,
      height: 1,
      generateMipmaps: false,
      flipY: false
    });

    gradientTex.minFilter = gl.LINEAR;
    gradientTex.magFilter = gl.LINEAR;
    gradientTex.wrapS = gl.CLAMP_TO_EDGE;
    gradientTex.wrapT = gl.CLAMP_TO_EDGE;
    gradTexRef.current = gradientTex;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uResolution: { value: [1, 1] as [number, number] },
        uTime: { value: 0 },

        uIntensity: { value: 1 },
        uSpeed: { value: 1 },
        uAnimType: { value: 0 },
        uMouse: { value: [0.5, 0.5] as [number, number] },
        uColorCount: { value: 0 },
        uDistort: { value: 0 },
        uOffset: { value: [0, 0] as [number, number] },
        uGradient: { value: gradientTex },
        uNoiseAmount: { value: 0.8 * (settings.intensityMultiplier || 1) },
        uOptimizationLevel: { value: settings.renderOptimizations?.optimizedMath ? 1 : 0 },
        uRaySharpness: { value: settings.renderOptimizations?.raySharpening ? 0.8 : 0.0 },
        uNoiseReduction: { value: settings.renderOptimizations?.noiseReduction ? 0.6 : 0.0 },
        uTemporalOffset: { value: [0, 0] as [number, number] },
        uRayCount: { value: 0 },
        uMaxIterations: { value: settings.maxIterations },
        uDynamicIterations: { value: settings.maxIterations }
      }
    });

    programRef.current = program;

    const triangle = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry: triangle, program });
    triRef.current = triangle;
    meshRef.current = mesh;

    // Оптимизированная функция resize с debouncing
    let resizeTimeout: number;
    const resize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        
        // Избегаем ненужных обновлений
        if (w === gl.canvas.width && h === gl.canvas.height) return;
        
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      }, 16); // ~60fps debounce
    };

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      (window as Window).addEventListener('resize', resize);
    }
    resize();

    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
      mouseTargetRef.current = [Math.min(Math.max(x, 0), 1), Math.min(Math.max(y, 0), 1)];
    };
    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        entries => {
          if (entries[0]) isVisibleRef.current = entries[0].isIntersecting;
        },
        { root: null, threshold: 0.01 }
      );
      io.observe(container);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let last = performance.now();
    let accumTime = 0;
    const targetFrameTime = 1000 / settings.updateRate;

    // Счетчик для периодических проверок и оптимизаций
    let frameCounter = 0;
    let batchCounter = 0;
    const opts = settings.renderOptimizations || {};
    
    // Оптимизированная функция обновления
    const update = (now: number) => {
      const dt = Math.max(0, now - last) * 0.001;
      const visible = isVisibleRef.current && !document.hidden;
      
      // Ограничение FPS
      if (now - last < targetFrameTime) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }
      
      // НЕВИДИМЫЕ оптимизации для топового качества без лагов
      frameCounter++;
      const monitor = memoryMonitorRef.current;
      const cache = uniformCacheRef.current;
      
      // Умная проверка памяти (реже для плавности)
      if (opts.invisibleOptimizations && frameCounter % 180 === 0) {
        const memoryPressure = checkMemoryPressure();
        
        // ТОЛЬКО невидимые оптимизации при высоком давлении памяти
        if (memoryPressure > 0.8) {
          // Микро-оптимизации, не влияющие на визуал
          forceGarbageCollection();
          
          // Временно снижаем частоту обновлений uniform'ов
          cache.framesSinceUpdate = Math.max(cache.framesSinceUpdate, 3);
        }
        
        // Превентивная очистка при среднем давлении
        if (memoryPressure > 0.6) {
          // Очистка кешей объектов
          if (objectPool.vectors.length > 5) objectPool.vectors.length = 5;
          if (objectPool.matrices.length > 3) objectPool.matrices.length = 3;
        }
      }
      
      // Стандартная проверка памяти (реже)
      if (frameCounter % 600 === 0) {
        const highMemory = checkMemoryUsage();
        if (highMemory) {
          // Только превентивная очистка, БЕЗ снижения качества
          forceGarbageCollection();
        }
      }
      
      last = now;
      if (!pausedRef.current && visible) accumTime += dt;
      if (!visible) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }
      
      cache.framesSinceUpdate++;
      
      // Временное увеличение разрешения для слабых устройств
      if (opts.temporalUpsampling) {
        const temporalPattern = [
          [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]
        ];
        const patternIndex = frameCounter % 4;
        const temporalOffset = temporalPattern[patternIndex];
        program.uniforms.uTemporalOffset.value = temporalOffset;
      }
      
      // НЕВИДИМАЯ оптимизация интерполяции (сохраняет плавность)
      const tau = 0.02 + Math.max(0, Math.min(1, hoverDampRef.current)) * 0.5; // Точная для качества
      const alpha = 1 - Math.exp(-dt / tau); // Экспоненциальная для плавности
        
      const tgt = mouseTargetRef.current;
      const sm = mouseSmoothRef.current;
      
      // Микро-оптимизации, невидимые глазу
      if (opts.invisibleOptimizations) {
        // Пропускаем микро-изменения (< 0.0005) для экономии вычислений
        const dx = (tgt[0] - sm[0]) * alpha;
        const dy = (tgt[1] - sm[1]) * alpha;
        
        if (Math.abs(dx) > 0.0005) sm[0] += dx;
        if (Math.abs(dy) > 0.0005) sm[1] += dy;
      } else {
        // Стандартная интерполяция
        sm[0] += (tgt[0] - sm[0]) * alpha;
        sm[1] += (tgt[1] - sm[1]) * alpha;
      }
      
      // УМНОЕ кеширование uniform'ов (невидимые оптимизации)
      const mouseThreshold = opts.invisibleOptimizations ? 0.0008 : 0.001; // Чуть выше порог
      const timeThreshold = opts.invisibleOptimizations ? 0.008 : 0.01;     // Чуть выше порог
      const maxFramesSkip = opts.invisibleOptimizations ? 3 : 5;            // Реже обновления
      
      const mouseChanged = Math.abs(sm[0] - cache.lastMouse[0]) > mouseThreshold || 
                           Math.abs(sm[1] - cache.lastMouse[1]) > mouseThreshold;
      const timeChanged = Math.abs(accumTime - cache.lastTime) > timeThreshold;
      
      if (!opts.cacheUniforms || mouseChanged || cache.framesSinceUpdate > maxFramesSkip) {
        program.uniforms.uMouse.value = sm as [number, number];
        cache.lastMouse = [sm[0], sm[1]];
        cache.framesSinceUpdate = 0;
      }
      
      if (!opts.cacheUniforms || timeChanged) {
        // Для топового качества - полная точность времени
        const finalTime = opts.invisibleOptimizations 
          ? Math.round(accumTime * 60) / 60  // Высокая точность, но квантованная
          : accumTime;                       // Полная точность
        program.uniforms.uTime.value = finalTime;
        cache.lastTime = finalTime;
      }
      
      // БЕЗ динамического изменения итераций - сохраняем топовое качество
      // Итерации остаются постоянными для стабильного визуала
        
      renderer.render({ scene: meshRef.current! });
      rafRef.current = requestAnimationFrame(update);
    };
    
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(visibilityTimeoutRef.current);
      clearTimeout(resizeTimeout);
      container.removeEventListener('pointermove', handlePointerMove);
      ro?.disconnect();
      if (!ro) window.removeEventListener('resize', resize);
      io?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      try {
        container.removeChild(gl.canvas);
      } catch (e) {
        void e;
      }
      meshRef.current = null;
      triRef.current = null;
      programRef.current = null;
      try {
        const glCtx = rendererRef.current?.gl;
        if (glCtx && gradTexRef.current?.texture) glCtx.deleteTexture(gradTexRef.current.texture);
      } catch (e) {
        void e;
      }
      programRef.current = null;
      rendererRef.current = null;
      gradTexRef.current = null;
      meshRef.current = null;
      triRef.current = null;
      
      // Принудительная очистка памяти при размонтировании
      forceGarbageCollection();
    };
  }, [shouldRender, webGLSupported, qualitySettings, mixBlendMode, handleVisibilityChange, handlePointerMove, forceGarbageCollection, checkMemoryUsage, priority, workerRef]);

  useEffect(() => {
    const canvas = rendererRef.current?.gl?.canvas as HTMLCanvasElement | undefined;
    if (canvas) {
      canvas.style.mixBlendMode = mixBlendMode && mixBlendMode !== 'none' ? mixBlendMode : '';
    }
  }, [mixBlendMode]);

  useEffect(() => {
    const program = programRef.current;
    const renderer = rendererRef.current;
    const gradTex = gradTexRef.current;
    if (!program || !renderer || !gradTex) return;

    const settings = qualitySettings;
    const finalIntensity = (intensity ?? 1) * (settings.intensityMultiplier || 1);
    program.uniforms.uIntensity.value = finalIntensity;
    program.uniforms.uSpeed.value = speed ?? 1;

    const animTypeMap: Record<AnimationType, number> = {
      rotate: 0,
      rotate3d: 1,
      hover: 2
    };
    program.uniforms.uAnimType.value = animTypeMap[animationType ?? 'rotate'];

    program.uniforms.uDistort.value = typeof distort === 'number' ? distort : 0;

    const ox = toPx(offset?.x);
    const oy = toPx(offset?.y);
    program.uniforms.uOffset.value = [ox, oy];
    program.uniforms.uRayCount.value = Math.max(0, Math.floor(rayCount ?? 0));

    let count = 0;
    if (Array.isArray(colors) && colors.length > 0) {
      const gl = renderer.gl;
      const capped = colors.slice(0, 64);
      count = capped.length;
      const data = new Uint8Array(count * 4);
      for (let i = 0; i < count; i++) {
        const [r, g, b] = hexToRgb01(capped[i]);
        data[i * 4 + 0] = Math.round(r * 255);
        data[i * 4 + 1] = Math.round(g * 255);
        data[i * 4 + 2] = Math.round(b * 255);
        data[i * 4 + 3] = 255;
      }
      gradTex.image = data;
      gradTex.width = count;
      gradTex.height = 1;
      gradTex.minFilter = gl.LINEAR;
      gradTex.magFilter = gl.LINEAR;
      gradTex.wrapS = gl.CLAMP_TO_EDGE;
      gradTex.wrapT = gl.CLAMP_TO_EDGE;
      gradTex.flipY = false;
      gradTex.generateMipmaps = false;
      gradTex.format = gl.RGBA;
      gradTex.type = gl.UNSIGNED_BYTE;
      gradTex.needsUpdate = true;
    } else {
      count = 0;
    }
    program.uniforms.uColorCount.value = count;
  }, [intensity, speed, animationType, memoizedColors, distort, offset, rayCount, qualitySettings]);

  // Fallback для устройств без WebGL2
  if (webGLSupported === false) {
    return (
      <div 
        className="prismatic-burst-container prismatic-burst-fallback" 
        ref={containerRef}
        style={{
          background: 'linear-gradient(45deg, #1e90ff, #9370db, #20b2aa)',
          opacity: 0.3
        }}
      />
    );
  }

  // Placeholder пока не загружено
  if (!shouldRender) {
    return (
      <div 
        className="prismatic-burst-container prismatic-burst-placeholder" 
        ref={containerRef}
        style={{ background: 'transparent' }}
      />
    );
  }

  return <div className="prismatic-burst-container" ref={containerRef} />;
};

// Мемоизированный компонент
const PrismaticBurst = memo(PrismaticBurstCore);

// Динамический импорт для дополнительной оптимизации
const PrismaticBurstLazy = dynamic(() => Promise.resolve(PrismaticBurst), {
  ssr: false,
  loading: () => (
    <div 
      className="prismatic-burst-container" 
      style={{ background: 'transparent' }}
    />
  )
});

// Экспорт именованный для избежания конфликтов
export { PrismaticBurst, PrismaticBurstCore };
export default PrismaticBurstLazy;