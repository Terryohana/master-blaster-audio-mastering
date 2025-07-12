import { useRef, useState, useEffect, useCallback } from 'react';
import * as React from 'react';

export default function LiveAudioProcessorDualTest() {
  // Two separate audio elements
  const normalAudioRef = useRef<HTMLAudioElement>(null);
  const eqAudioRef = useRef<HTMLAudioElement>(null);
  const [activeAudioMode, setActiveAudioMode] = useState<'normal' | 'eq'>('normal');
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  
  // UI state
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiveEQEnabled, setIsLiveEQEnabled] = useState(false);
  
  // EQ settings
  const [eqGain, setEqGain] = useState(0);

  // State synchronization between audio elements
  const syncAudioState = useCallback((fromRef: React.RefObject<HTMLAudioElement>, toRef: React.RefObject<HTMLAudioElement>) => {
    if (!fromRef.current || !toRef.current) return;
    
    const from = fromRef.current;
    const to = toRef.current;
    
    // Sync playback state
    to.currentTime = from.currentTime;
    to.volume = from.volume;
    
    // Handle play state
    if (!from.paused) {
      to.play().catch(console.error);
    } else {
      to.pause();
    }
  }, []);

  // Switch to EQ mode
  const switchToEQMode = useCallback(async () => {
    if (activeAudioMode === 'eq') return;
    
    // Sync state from normal to EQ
    syncAudioState(normalAudioRef, eqAudioRef);
    
    // Pause normal audio
    normalAudioRef.current?.pause();
    
    // Initialize Web Audio chain
    await initializeEQProcessing(eqAudioRef.current);
    
    setActiveAudioMode('eq');
    setIsLiveEQEnabled(true);
  }, [activeAudioMode, syncAudioState]);
  
  // Switch to normal mode
  const switchToNormalMode = useCallback(() => {
    if (activeAudioMode === 'normal') return;
    
    // Sync state from EQ to normal
    syncAudioState(eqAudioRef, normalAudioRef);
    
    // Cleanup Web Audio
    cleanupEQProcessing();
    
    // Pause EQ audio
    eqAudioRef.current?.pause();
    
    setActiveAudioMode('normal');
    setIsLiveEQEnabled(false);
  }, [activeAudioMode, syncAudioState]);

  // Initialize EQ processing
  const initializeEQProcessing = useCallback(async (audioElement: HTMLAudioElement | null) => {
    if (!audioElement || audioContextRef.current) return;
    
    audioContextRef.current = new AudioContext();
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
    
    // Create a simple EQ filter
    const filter = audioContextRef.current.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 1000;
    filter.gain.value = eqGain;
    filter.Q.value = 1;
    filtersRef.current = [filter];

    // Connect audio chain: source -> filter -> destination
    sourceRef.current.connect(filter);
    filter.connect(audioContextRef.current.destination);
    
    console.log("Audio chain connected successfully");
  }, [eqGain]);

  // Cleanup EQ processing
  const cleanupEQProcessing = useCallback(() => {
    if (audioContextRef.current) {
      console.log("Cleaning up EQ processing");
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceRef.current = null;
      filtersRef.current = [];
    }
  }, []);

  // Get active audio element
  const getActiveAudioElement = useCallback(() => {
    return activeAudioMode === 'normal' 
      ? normalAudioRef.current 
      : eqAudioRef.current;
  }, [activeAudioMode]);
  
  // Play audio
  const playAudio = useCallback(() => {
    const activeElement = getActiveAudioElement();
    if (activeElement) {
      activeElement.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [getActiveAudioElement]);
  
  // Pause audio
  const pauseAudio = useCallback(() => {
    const activeElement = getActiveAudioElement();
    if (activeElement) {
      activeElement.pause();
      setIsPlaying(false);
    }
  }, [getActiveAudioElement]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
    }
  };

  // Update EQ
  const updateEQ = (gain: number) => {
    setEqGain(gain);

    // Update audio filter
    if (filtersRef.current[0]) {
      filtersRef.current[0].gain.value = gain;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">Audio EQ Separation Test</h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="mb-4 block w-full text-sm text-gray-300"
        />
        
        {audioFile && (
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-300">Live EQ Processing</h4>
                {isLiveEQEnabled && (
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              {!isLiveEQEnabled ? (
                <button
                  onClick={switchToEQMode}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                >
                  Enable Live EQ
                </button>
              ) : (
                <button
                  onClick={switchToNormalMode}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                >
                  Disable Live EQ
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isLiveEQEnabled 
                ? "Live EQ is active. Adjust controls below to hear real-time changes."
                : "Click \"Enable Live EQ\" to hear real-time effects while adjusting controls below."
              }
            </p>
          </div>
        )}

        {/* Hidden audio elements for playback */}
        {audioFile && (
          <>
            {/* Normal playback audio element */}
            <audio
              ref={normalAudioRef}
              src={audioFile}
              className="hidden"
              onTimeUpdate={() => activeAudioMode === 'normal' && setCurrentTime(normalAudioRef.current?.currentTime || 0)}
              onPlay={() => activeAudioMode === 'normal' && setIsPlaying(true)}
              onPause={() => activeAudioMode === 'normal' && setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                setDuration(normalAudioRef.current?.duration || 0);
              }}
            />
            
            {/* EQ processing audio element */}
            <audio
              ref={eqAudioRef}
              src={audioFile}
              className="hidden"
              onTimeUpdate={() => activeAudioMode === 'eq' && setCurrentTime(eqAudioRef.current?.currentTime || 0)}
              onPlay={() => activeAudioMode === 'eq' && setIsPlaying(true)}
              onPause={() => activeAudioMode === 'eq' && setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                if (activeAudioMode === 'eq') {
                  setDuration(eqAudioRef.current?.duration || 0);
                }
              }}
            />
          </>
        )}
      </div>

      {/* Controls */}
      {audioFile && (
        <div className="space-y-6">
          {/* Audio Controls */}
          <div className="bg-black p-4 rounded border border-gray-700">
            <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-600">
              {/* Transport Controls */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  onClick={() => {
                    const activeElement = getActiveAudioElement();
                    if (activeElement) {
                      activeElement.currentTime = Math.max(0, activeElement.currentTime - 10);
                    }
                  }}
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm"
                >
                  ⏪
                </button>
                
                <button
                  onClick={() => {
                    if (isPlaying) {
                      pauseAudio();
                    } else {
                      playAudio();
                    }
                  }}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl"
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                
                <button
                  onClick={() => {
                    const activeElement = getActiveAudioElement();
                    if (activeElement) {
                      activeElement.currentTime = Math.min(duration, activeElement.currentTime + 10);
                    }
                  }}
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm"
                >
                  ⏩
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                </span>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => {
                      const activeElement = getActiveAudioElement();
                      if (activeElement) {
                        activeElement.currentTime = parseFloat(e.target.value);
                      }
                    }}
                    className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer"
                  />
                </div>
                
                <span className="text-xs font-mono text-gray-400">
                  {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* EQ Control */}
          <div className="bg-black p-6 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-6 text-center text-gray-300">EQ CONTROL</h3>
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-gray-400 mb-1">{eqGain > 0 ? '+' : ''}{eqGain} dB</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={eqGain}
                onChange={(e) => updateEQ(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  isLiveEQEnabled ? 'bg-gray-800' : 'bg-gray-700 opacity-50'
                }`}
                disabled={!isLiveEQEnabled}
              />
              <label className="text-xs font-mono text-gray-400 mt-2">
                1 kHz Boost/Cut
              </label>
            </div>
          </div>

          {/* Status */}
          <div className="bg-black p-4 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-2 text-gray-300">Status</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Active Mode: </span>
                <span className="text-white font-mono">{activeAudioMode}</span>
              </div>
              <div>
                <span className="text-gray-400">EQ Enabled: </span>
                <span className={`font-mono ${isLiveEQEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {isLiveEQEnabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Current Time: </span>
                <span className="text-white font-mono">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Playing: </span>
                <span className={`font-mono ${isPlaying ? 'text-green-400' : 'text-red-400'}`}>
                  {isPlaying ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}