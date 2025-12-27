import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If we have an analyser (real audio), we use it. 
    // Otherwise we fallback to simulation if isPlaying is true.
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Clear
      ctx.fillStyle = '#18181b'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying) {
        // Draw flat line
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3f3f46';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      // Get Data (Real or Simulated)
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Simulate waveform data
        const time = Date.now() / 100; // Speed
        for (let i = 0; i < bufferLength; i++) {
          // Create a sine wave looking pattern with some noise
          const val = 128 + Math.sin(i * 0.2 + time) * 30 + Math.random() * 10;
          dataArray[i] = val;
        }
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-32 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-inner">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;