import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SnakeGame from '../components/Snake/Snake';
import ParticleWorld from '../components/Particle';
import FruitNinja from '../components/FruitNinja';
import styles from './Pages.module.css';

const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  
  const gameDetails: Record<string, { title: string; description: string }> = {
    'kinect-watermelon': {
      title: '🍉 水果忍者 VR',
      description: '这是一款充满激情的体感切割游戏。当新鲜多汁的水果在空中飞舞时，你需要挥动双臂，以忍者般的敏捷精准切开它们。通过 Kinect 体感技术，每一次挥臂都能获得真实的反馈，让你沉浸在这场水果盛宴中。挑战连击记录，成为最强水果忍者！'
    },
    'kinect-snake': {
      title: '🐍 体感贪吃蛇',
      description: '经典贪吃蛇游戏的革命性升级。不再用手柄或键盘，而是用你的整个身体来操控蛇的移动方向。左倾、右转、前进、后退，每个动作都映射到游戏中。在三维空间里捕获能量球，避开障碍物，体验前所未有的沉浸式游戏体验。这不仅是游戏，更是一场全身运动的挑战！'
    },
    'particle-world': {
      title: '✨ 粒子星河',
      description: '步入一个由数万个粒子构成的梦幻数字宇宙。通过手势和身体动作，你可以引导粒子的流动、改变它们的轨迹、创造出独特的视觉奇观。每一次互动都会产生不同的艺术效果，让你成为这个虚拟世界的创造者。这是科技与艺术的完美融合，是一场视觉与互动的盛宴。'
    }
  };

  const game = gameDetails[gameId || ''] || {
    title: '未知游戏',
    description: '该游戏暂无详细介绍。'
  };

  // 如果是贪吃蛇游戏，直接全屏展示游戏组件
  if (gameId === 'kinect-snake') {
    return <SnakeGame />;
  }

  // 如果是粒子星河游戏，直接全屏展示游戏组件
  if (gameId === 'particle-world') {
    return <ParticleWorld />;
  }

  // 如果是水果忍者游戏，直接全屏展示游戏组件
  if (gameId === 'kinect-watermelon') {
    return <FruitNinja />;
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.mainTitle}>{game.title}</h1>
      <p className={styles.gameDescription}>{game.description}</p>
      <div className={styles.gamePlaceholder}>
        <p>游戏区域占位符</p>
      </div>
      <Link to="/" className={styles.backLink}>返回游戏中心</Link>
    </div>
  );
};

export default GameDetail;