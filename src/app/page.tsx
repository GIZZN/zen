"use client";
import React, { memo } from 'react';
import styles from "./page.module.css";
import { PrismaticBurstInstant } from '@/app/Components/backgraund';
import Hero from '@/app/Components/Hero/Hero';

const Home = memo(() => {
  return (
    <div className={styles.page}>
      <main>
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          zIndex: -1 
        }}>
            <PrismaticBurstInstant
            colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']}
            intensity={0.8}
            speed={0.5}
          />
        </div>
        <Hero />
      </main>
    </div>
  );
});

Home.displayName = 'Home';

export default Home;
