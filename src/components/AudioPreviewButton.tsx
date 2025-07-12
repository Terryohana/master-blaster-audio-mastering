import { useState, useRef } from "react";

interface AudioPreviewButtonProps {
  url: string;
  title: string;
  icon: string;
  color: "blue" | "green" | "blue";
}

export function AudioPreviewButton({ url, title, icon, color }: AudioPreviewButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const colorClasses = {
    blue: "text-blue-400 hover:bg-blue-600/20",
    green: "text-green-400 hover:bg-green-600/20"
  };

  const progressColor = {
    blue: "bg-blue-500",
    green: "bg-green-500"
  };

  return (
    <div className="relative group">
      <button
        onClick={togglePlay}
        className={`p-2 hover:text-white rounded-lg transition-colors ${colorClasses[color]}`}
        title={title}
      >
        {isPlaying ? "⏸️" : icon}
      </button>
      
      {/* Audio progress tooltip */}
      {isPlaying && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700 min-w-[200px] z-50">
          <div className="text-white text-xs mb-2 text-center">{title}</div>
          <div 
            className="w-full h-2 bg-gray-800 rounded-full cursor-pointer mb-2"
            onClick={handleSeek}
          >
            <div 
              className={`h-full rounded-full transition-all ${progressColor[color]}`}
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
    </div>
  );
}