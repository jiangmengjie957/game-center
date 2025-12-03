import React, { useState, useEffect } from 'react';
import { Visualizer } from './Visualizer';
import { MediaPipeController } from './MediaPipeController';
import { ShapeType, type HandState } from './types';

export default function ParticleWorld() {
  const [activeShape, setActiveShape] = useState<ShapeType>(ShapeType.HEART);
  const [particleColor, setParticleColor] = useState<string>('#ff0055');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [showUI, setShowUI] = useState<boolean>(true);
  
  // Hand state driven by MediaPipe
  const [handState, setHandState] = useState<HandState>({
    isOpen: false,
    openness: 0
  });

  const shapes = [
    { id: ShapeType.HEART, label: 'Heart', icon: 'fa-heart' },
    { id: ShapeType.FLOWER, label: 'Flower', icon: 'fa-fan' }, // approximate icon
    { id: ShapeType.STAR, label: 'Planet', icon: 'fa-globe' },
    { id: ShapeType.BUDDHA, label: 'Zen', icon: 'fa-om' },
    { id: ShapeType.FIREWORKS, label: 'Spark', icon: 'fa-explosion' },
  ];

  const toggleCamera = () => setIsCameraActive(!isCameraActive);
  const toggleUI = () => setShowUI(!showUI);

  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-pink-500 selection:text-white">
      
      {/* 3D Scene Background */}
      <Visualizer 
        shape={activeShape} 
        color={particleColor} 
        handState={handState}
      />

      {/* Main UI Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 z-10 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Header */}
        <header className="absolute top-0 left-0 p-8 w-full flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              AETHER FLOW
            </h1>
            <p className="text-sm text-gray-400 mt-1 opacity-80">
              Powered by MediaPipe Hands
            </p>
          </div>
          
          <button 
            onClick={() => setShowUI(false)} 
            className="pointer-events-auto text-gray-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-eye-slash text-xl"></i>
          </button>
        </header>

        {/* Controls Sidebar */}
        <aside className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 pointer-events-auto">
          
          {/* Shape Selectors */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Model</span>
            {shapes.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveShape(s.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative ${
                  activeShape === s.id 
                    ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg scale-110' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${s.icon} text-lg`}></i>
                
                {/* Tooltip */}
                <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center shadow-2xl">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Color</span>
             <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform">
               <input 
                 type="color" 
                 value={particleColor}
                 onChange={(e) => setParticleColor(e.target.value)}
                 className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
               />
             </div>
          </div>

        </aside>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-xl border border-white/10 ${
              isCameraActive 
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/50' 
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
            }`}
          >
            <i className={`fa-solid ${isCameraActive ? 'fa-video-slash' : 'fa-video'} text-lg`}></i>
            {isCameraActive ? 'STOP VISION' : 'START VISION'}
          </button>
        </div>

        {/* Hand State Indicator */}
        <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-48 shadow-2xl">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">Hand Analysis</span>
             
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs text-gray-300 mb-1">
                   <span>Gesture</span>
                   <span className={handState.isOpen ? 'text-green-400' : 'text-blue-400'}>
                     {handState.isOpen ? 'OPEN' : 'CLOSED'}
                   </span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-300 ${handState.isOpen ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: handState.isOpen ? '100%' : '20%' }}
                   ></div>
                 </div>
               </div>

               <div>
                 <div className="flex justify-between text-xs text-gray-300 mb-1">
                   <span>Expansion</span>
                   <span>{(handState.openness * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-purple-500 transition-all duration-200 ease-out"
                    style={{ width: `${handState.openness * 100}%` }}
                   ></div>
                 </div>
               </div>
             </div>
             
             <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
               Open your hand to expand particles. Close your fist to contract.
             </p>
          </div>
        </div>

      </div>

      {/* Floating Eye Button to toggle UI back on */}
      {!showUI && (
        <button 
          onClick={() => setShowUI(true)}
          className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-50"
        >
          <i className="fa-solid fa-eye text-2xl"></i>
        </button>
      )}

      {/* Logic Controller */}
      <MediaPipeController 
        isActive={isCameraActive} 
        onHandStateChange={setHandState} 
      />
    </div>
  );
}