import { useEffect, useRef, useState } from 'react';

export function useAudioAnalyser() {
  const [active, setActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      // Smooth the frequency data out a bit
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      setActive(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setActive(false);
    }
  };

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setActive(false);
  };

  const getAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current || !active) return 0;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume from lower frequencies (bass/vocals usually trigger it best)
    let sum = 0;
    const len = Math.floor(dataArrayRef.current.length * 0.5); // only use bottom half of spectrum
    for (let i = 0; i < len; i++) {
        sum += dataArrayRef.current[i];
    }
    const val = (sum / len) / 255.0;
    
    // Apply an easing curve to make jumps more noticeable
    return Math.pow(val, 1.5) * 1.5; 
  };

  return { active, start, stop, getAudioLevel };
}
