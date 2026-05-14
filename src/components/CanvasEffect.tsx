import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import './ShaderMaterial'; // Register material

interface EffectPlaneProps {
  text: string;
  image: string | null;
  blurIntensity: number;
  outlineThickness: number;
  amplitude: number;
  speed: number;
  liquify: number;
  frequency: number;
  color1: string;
  color2: string;
  getAudioLevel: () => number;
}

const EffectPlane = ({ text, image, blurIntensity, outlineThickness, amplitude, speed, liquify, frequency, color1, color2, getAudioLevel }: EffectPlaneProps) => {
  const materialRef = useRef<any>();
  const { viewport } = useThree();
  
  // Load image texture if provided
  const imageTexture = image ? useLoader(THREE.TextureLoader, image) : null;
  
  // Create texture from canvas when text or blur changes
  const textTexture = useMemo(() => {
    if (image) return null;
    const canvas = document.createElement('canvas');
    // Using high resolution for crisp distance fields
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply blur based on slider (0 to 1 scales to 0 to 60px blur)
    const blurPx = Math.max(1, blurIntensity * 80); 
    ctx.filter = `blur(${blurPx}px)`;
    
    // Draw Typography
    ctx.fillStyle = '#ffffff';
    // Use an intense geometric font style if possible, else standard sans-serif
    ctx.font = '900 500px "Inter", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Italicize and stretch heavily
    ctx.scale(1.3, 1.0);
    ctx.translate(canvas.width / 2 / 1.3, canvas.height / 2);
    ctx.transform(1, 0, -0.2, 1, 0, 0); // basic slant
    
    ctx.fillText(text, 0, 0);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [text, blurIntensity, image]);
  
  const activeTexture = image ? imageTexture : textTexture;
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta;
      
      const audioVal = getAudioLevel();
      // Smooth audio uniform
      materialRef.current.uAudio += (audioVal - materialRef.current.uAudio) * 0.1;
      
      // Update parameters
      materialRef.current.uThickness = outlineThickness;
      materialRef.current.uAmplitude = amplitude;
      materialRef.current.uSpeed = speed;
      materialRef.current.uBlur = blurIntensity;
      materialRef.current.uFrequency = frequency;
      materialRef.current.uLiquify = liquify;
      
      // Modulate colors based on audio
      // We will merge user colors with audio modulation
      materialRef.current.uColor1.set(color1);
      materialRef.current.uColor2.set(color2);

      if (audioVal > 0.5) {
          // Intense Red
          materialRef.current.uColor2.lerp(new THREE.Color('#ff0033'), 0.2);
      } else if (audioVal > 0.2) {
          // Bright Green/Cyan
          materialRef.current.uColor2.lerp(new THREE.Color('#00ff99'), 0.1);
      } else {
          // Dim orange/yellow
          materialRef.current.uColor2.lerp(new THREE.Color('#ff9900'), 0.05);
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      {activeTexture && (
        <distortionMaterial 
          ref={materialRef} 
          uTexture={activeTexture}
          transparent={true}
        />
      )}
    </mesh>
  );
};

interface CanvasEffectProps extends EffectPlaneProps {}

export default function CanvasEffect(props: CanvasEffectProps) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 1], fov: 75 }} 
      style={{ background: '#000', width: '100%', height: '100%' }}
    >
      <EffectPlane {...props} />
    </Canvas>
  );
}
