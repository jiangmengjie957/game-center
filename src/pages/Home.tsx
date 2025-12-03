import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Pages.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.content}>
      <h1 className={styles.mainTitle}>游戏中心</h1>
      <div className={styles.gameSection}>
        <h2 className={styles.sectionTitle}>体感游戏</h2>
        <div className={styles.gameGrid}>
          <Link to="/game/kinect-watermelon" className={styles.gameCard}>
            <div className={styles.gameCardContent}>
              <h3>🍉 水果忍者 VR</h3>
              <p>挥舞双臂，精准切割飞跃而来的新鲜水果，挑战你的反应极限</p>
            </div>
          </Link>
          <Link to="/game/kinect-snake" className={styles.gameCard}>
            <div className={styles.gameCardContent}>
              <h3>🐍 体感贪吃蛇</h3>
              <p>用全身动作操控蛇形移动，在虚拟空间中捕获食物、突破自我</p>
            </div>
          </Link>
          <Link to="/game/particle-world" className={styles.gameCard}>
            <div className={styles.gameCardContent}>
              <h3>✨ 粒子星河</h3>
              <p>手势驱动粒子流动，创造专属于你的动态艺术空间</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;