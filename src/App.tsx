import React, { useState } from 'react';
import CanvasEffect from './components/CanvasEffect';
import { useAudioAnalyser } from './hooks/useAudioAnalyser';
import { Mic, MicOff, Settings2 } from 'lucide-react';

export default function App() {
  const { active, start, stop, getAudioLevel } = useAudioAnalyser();
  
  const [showControls, setShowControls] = useState(true);
  
  // Parameters mapping to user request
  const [text, setText] = useState('YOU');
  const [image, setImage] = useState<string | null>(null);
  const [blurIntensity, setBlurIntensity] = useState(0.5); // 边缘模糊强度
  const [outlineThickness, setOutlineThickness] = useState(0.15); // 轮廓厚度
  const [amplitude, setAmplitude] = useState(0.2); // 波动幅度
  const [speed, setSpeed] = useState(1.0); // 动画速度
  const [liquify, setLiquify] = useState(0.5); // 液化强度
  const [frequency, setFrequency] = useState(20.0); // 线条密度
  const [color1, setColor1] = useState('#ffffff');
  const [color2, setColor2] = useState('#ff3366');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {/* Background Effect layer */}
      <div className="absolute inset-0 z-0">
        <CanvasEffect 
          text={text}
          image={image}
          blurIntensity={blurIntensity}
          outlineThickness={outlineThickness}
          amplitude={amplitude}
          speed={speed}
          liquify={liquify}
          frequency={frequency}
          color1={color1}
          color2={color2}
          getAudioLevel={getAudioLevel}
        />
      </div>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 p-6 flex justify-between items-start pointer-events-none">
        
        {/* Header/Logo */}
        <div className="flex flex-col gap-1 pointer-events-auto mix-blend-difference">
          <h1 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2">
            Dynamic Type
          </h1>
          <p className="text-xs text-white/60 w-64 leading-tight uppercase tracking-wider">
            Sonic topology effect
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          <button 
            onClick={() => setShowControls(!showControls)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
          >
            <Settings2 className="w-5 h-5 text-white" />
          </button>
          
          <button 
            onClick={active ? stop : start}
            title={active ? "Stop Microphone" : "Start Microphone to Interact"}
            className={`p-4 rounded-full backdrop-blur-md transition-all flex items-center justify-center ${active ? 'bg-red-500/80 hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] scale-110' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {active ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white/80" />}
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      <div 
        className={`fixed top-24 right-6 z-20 w-80 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-6 transition-all duration-500 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}
      >
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold text-white/50 uppercase tracking-widest flex justify-between">
            Text <span className="font-mono">{text}</span>
          </label>
          <input 
            type="text" 
            value={text} 
            onChange={e => {setText(e.target.value.toUpperCase() || ' '); setImage(null);}}
            className="bg-white/5 border border-white/10 outline-none focus:border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Or Upload Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
          />
        </div>

        <SliderControl 
          label="边缘模糊强度 (Blur)" 
          value={blurIntensity} 
          min={0.0} max={1.0} step={0.01} 
          onChange={setBlurIntensity} 
        />
        
        <SliderControl 
          label="轮廓厚度 (Thickness)" 
          value={outlineThickness} 
          min={0.01} max={0.5} step={0.01} 
          onChange={setOutlineThickness} 
        />
        
        <SliderControl 
          label="波动幅度 (Amplitude)" 
          value={amplitude} 
          min={0.0} max={1.0} step={0.01} 
          onChange={setAmplitude} 
        />
        
        <SliderControl 
          label="液化强度 (Liquify)" 
          value={liquify} 
          min={0.0} max={1.0} step={0.01} 
          onChange={setLiquify} 
        />
        
        <SliderControl 
          label="动画速度 (Speed)" 
          value={speed} 
          min={0.0} max={5.0} step={0.1} 
          onChange={setSpeed} 
        />

        <SliderControl 
          label="线条密度 (Frequency)" 
          value={frequency} 
          min={1.0} max={50.0} step={1.0} 
          onChange={setFrequency} 
        />

        <div className="flex justify-between gap-2">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Base Color 1</label>
            <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="h-10 w-full rounded cursor-pointer" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Base Color 2</label>
            <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="h-10 w-full rounded cursor-pointer" />
          </div>
        </div>

        {active && (
          <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Mic Status</span>
            <span className="text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Live Tracking
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">{label}</label>
        <span className="text-xs font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded">{value.toFixed(2)}</span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
      />
    </div>
  );
}
