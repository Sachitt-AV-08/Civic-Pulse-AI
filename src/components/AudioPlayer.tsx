import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { playRadioSquelch } from '../utils/audio';

interface AudioPlayerProps {
  duration: string;
  callerChannel: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ duration, callerChannel }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            playRadioSquelch();
            return 0;
          }
          return prev + 2.5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!isPlaying) {
      playRadioSquelch();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="bg-[#001424] text-white p-3 rounded border border-[#012745] flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-[#A5C0DD] uppercase tracking-wider font-semibold">
            {callerChannel} Audio Feed
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#5790FF] tabular-nums font-semibold">
          {isPlaying ? 'STREAMING' : 'AUDIO ARCHIVED'} · {duration}
        </span>
      </div>

      {/* Waveform Visualization Bars */}
      <div className="flex items-end gap-1 h-8 px-1 py-0.5 bg-[#000E1A] rounded border border-[#011D34]">
        {[
          18, 35, 60, 42, 80, 95, 70, 50, 85, 100, 75, 40, 60, 88, 70, 45, 90, 65, 30, 55, 80, 40, 25, 70,
          90, 50, 30, 60, 75, 45, 85, 35, 20, 50,
        ].map((height, i) => {
          const isActive = (i / 34) * 100 <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-[1px] transition-all duration-150 ${
                isActive
                  ? 'bg-[#5790FF]'
                  : isPlaying
                  ? 'bg-[#012745] hover:bg-[#314962]'
                  : 'bg-[#011D34]'
              }`}
              style={{
                height: isPlaying ? `${Math.max(15, (height * (progress % 20 + 20)) / 40)}%` : `${height}%`,
              }}
            />
          );
        })}
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded bg-[#0159C5] hover:bg-[#024bb0] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title={isPlaying ? 'Pause transmission' : 'Play transmission'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
          </button>

          <button
            onClick={handleReset}
            className="w-7 h-7 rounded bg-[#011D34] hover:bg-[#012745] text-[#A5C0DD] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Reset audio"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-3 h-1.5 bg-[#011D34] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5790FF] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[#6E86A2]">
          <Volume2 className="w-3 h-3 text-[#5790FF]" />
          <span>VOCODER 9.6k</span>
        </div>
      </div>
    </div>
  );
};
