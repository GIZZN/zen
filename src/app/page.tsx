"use client";
import styles from "./page.module.css";
import PrismaticBurst from '@/app/Components/backgraund/PrismaticBurst';
import Hero from '@/app/Components/Hero/Hero';

export default function Home() {
  return (
    <div className={styles.page}>
      <main>
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <PrismaticBurst
            animationType="rotate3d"
            intensity={2}
            speed={0.5}
            distort={1.0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={24}
            mixBlendMode="lighten"
            colors={['#1e90ff', '#00bfff', '#4169e1', '#9370db', '#20b2aa', '#87ceeb']}
          />
        </div>
        <Hero />
      </main>
    </div>
  );
}
