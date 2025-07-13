import { useRef, useState, useEffect } from 'react';
import * as React from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { EQ_PRESETS, PRESET_CATEGORIES } from './EQPresets';

interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
}

interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
}

interface CompressorPreset {
  name: string;
  description: string;
  compressor: CompressorSettings;
  eq: number[];
  icon: string;
}

export default function LiveAudioProcessor({ projectName = "", projectId = null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileObj, setAudioFileObj] = useState<File | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [vuMeter, setVuMeter] = useState({ level: 0, peak: 0, clipping: false, kick: 0, truePeak: 0 });
  const [meterRange, setMeterRange] = useState(150);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentProjectName, setCurrentProjectName] = useState(projectName || "");
  const [currentProjectId, setCurrentProjectId] = useState<Id<"projects"> | null>(projectId);
  const [selectedPreset, setSelectedPreset] = useState("Default");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLiveEQEnabled, setIsLiveEQEnabled] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const peakHoldRef = useRef<number>(0);
  const peakDecayRef = useRef<number>(0);
  const kickDetectRef = useRef<number>(0);
  const lastKickRef = useRef<number>(0);
  const truePeakRef = useRef<number>(0);
  const truePeakDecayRef = useRef<number>(0);

  // Convex mutations and queries
  const createProject = useMutation(api.projects.createProject);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const updateProjectAudio = useMutation(api.projects.updateProjectAudio);
  const updateProjectSettings = useMutation(api.projects.updateProjectSettings);
  const projectData = useQuery(api.projects.getProject, 
    currentProjectId ? { projectId: currentProjectId } : "skip"
  );

  // 7-Band EQ (20Hz, 60Hz, 250Hz, 1kHz, 3kHz, 6kHz, 12kHz) - Default Flat
  const [eqBands, setEqBands] = useState<EQBand[]>([
    { frequency: 20, gain: 0, Q: 0.7 },
    { frequency: 60, gain: 0, Q: 0.7 },
    { frequency: 250, gain: 0, Q: 1.0 },
    { frequency: 1000, gain: 0, Q: 0.8 },
    { frequency: 3000, gain: 0, Q: 1.2 },
    { frequency: 6000, gain: 0, Q: 0.9 },
    { frequency: 12000, gain: 0, Q: 0.5 }
  ]);

  // Compressor Settings
  const [compressor, setCompressor] = useState<CompressorSettings>({
    threshold: -24,
    ratio: 3,
    attack: 0.003,
    release: 0.25
  });

  // Filter EQ presets based on search and category
  const filteredPresets = EQ_PRESETS.filter(preset => {
    const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preset.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sync projectId prop to state (Option 2 - Step 1)
  useEffect(() => {
    if (projectId !== currentProjectId) {
      setCurrentProjectId(projectId);
      setSettingsLoaded(false); // Reset when project changes
    }
  }, [projectId, currentProjectId]);

  // Single consolidated effect to load all project data (Option 2 - Step 2)
  useEffect(() => {
    if (projectData) {
      console.log("Loading all project data:", projectData);
      
      // Set project name
      if (projectData.name) {
        setCurrentProjectName(projectData.name);
      }
      
      // Set preset
      if (projectData.eqPreset) {
        setSelectedPreset(projectData.eqPreset);
      }
      
      // Set EQ settings if available
      if (projectData.eqSettings) {
        setEqBands(projectData.eqSettings);
        
        // Update audio filters if context is initialized
        if (filtersRef.current.length > 0) {
          projectData.eqSettings.forEach((band, index) => {
            if (filtersRef.current[index]) {
              filtersRef.current[index].gain.value = band.gain;
            }
          });
        }
      }
      
      // Set compressor settings if available
      if (projectData.compressorSettings) {
        setCompressor(projectData.compressorSettings);
        
        // Update compressor if initialized
        if (compressorRef.current) {
          compressorRef.current.threshold.value = projectData.compressorSettings.threshold;
          compressorRef.current.ratio.value = projectData.compressorSettings.ratio;
          compressorRef.current.attack.value = projectData.compressorSettings.attack;
          compressorRef.current.release.value = projectData.compressorSettings.release;
        }
      }
      
      // Load audio file if available - direct one-way data flow
      if (projectData.originalAudioUrl) {
        console.log("Setting audio file from project:", projectData.originalAudioUrl);
        setAudioFile(projectData.originalAudioUrl);
        setAudioFileObj(null); // Clear file object since loading from URL
      }
      
      setSettingsLoaded(true);
    }
  }, [projectData]);

  // Compressor Presets
  const compressorPresets: CompressorPreset[] = [
    {
      name: "YouTube",
      description: "YouTube loudness standard (-14 LUFS)",
      compressor: { threshold: -16, ratio: 3, attack: 0.003, release: 0.1 },
      eq: [0, 1, 0, 1, 2, 1, 1],
      icon: "📺"
    },
    {
      name: "Spotify",
      description: "Spotify loudness standard (-14 LUFS)",
      compressor: { threshold: -18, ratio: 2.5, attack: 0.005, release: 0.15 },
      eq: [0, 0, 0, 1, 1, 1, 0],
      icon: "🎵"
    },
    {
      name: "Vocal Master",
      description: "Perfect for vocals",
      compressor: { threshold: -18, ratio: 4, attack: 0.005, release: 0.1 },
      eq: [0, 0, -1, 2, 3, 1, 2],
      icon: "🎤"
    },
    {
      name: "Drum Punch",
      description: "Punchy drums",
      compressor: { threshold: -12, ratio: 6, attack: 0.001, release: 0.05 },
      eq: [2, 3, -2, 0, 2, 1, 0],
      icon: "🥁"
    },
    {
      name: "Bass Control",
      description: "Tight bass response",
      compressor: { threshold: -20, ratio: 8, attack: 0.01, release: 0.2 },
      eq: [1, 2, -3, 0, 0, 0, 0],
      icon: "🎸"
    },
    {
      name: "Mix Glue",
      description: "Gentle mix compression",
      compressor: { threshold: -30, ratio: 2, attack: 0.02, release: 0.5 },
      eq: [0, 0, 0, 0, 1, 1, 1],
      icon: "🎚️"
    },
    {
      name: "Radio Ready",
      description: "Broadcast compression",
      compressor: { threshold: -15, ratio: 10, attack: 0.002, release: 0.08 },
      eq: [0, 1, -1, 2, 3, 2, 2],
      icon: "📻"
    },
    {
      name: "Vintage Warm",
      description: "Analog-style warmth",
      compressor: { threshold: -25, ratio: 3, attack: 0.01, release: 0.3 },
      eq: [1, 2, 1, 1, -1, -1, 0],
      icon: "🔥"
    }
  ];

  const initAudioContext = async () => {
    if (!audioContextRef.current && audioRef.current) {
      console.log("Initializing audio context for audio element");
      
      // Store current playback state
      const wasPlaying = !audioRef.current.paused;
      const currentTime = audioRef.current.currentTime;
      
      // Pause audio before creating MediaElementSource
      if (wasPlaying) {
        audioRef.current.pause();
        console.log("Paused audio before creating MediaElementSource");
      }
      
      audioContextRef.current = new AudioContext();
      
      // Resume audio context if suspended (required by browser policy)
      if (audioContextRef.current.state === 'suspended') {
        console.log("Resuming suspended audio context");
        await audioContextRef.current.resume();
      }
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      console.log("Audio context state:", audioContextRef.current.state);
      
      // Create analyser for meters
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.0;
      
      // Create compressor
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();
      compressorRef.current.threshold.value = compressor.threshold;
      compressorRef.current.ratio.value = compressor.ratio;
      compressorRef.current.attack.value = compressor.attack;
      compressorRef.current.release.value = compressor.release;
      
      // Create filters for each EQ band
      filtersRef.current = eqBands.map((band, index) => {
        const filter = audioContextRef.current!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = band.Q;
        return filter;
      });

      // Connect audio chain: source -> compressor -> EQ filters -> analyser -> destination
      let currentNode = sourceRef.current;
      
      // First connect to compressor
      currentNode.connect(compressorRef.current!);
      currentNode = compressorRef.current!;
      
      // Then through EQ filters
      filtersRef.current.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      
      // Connect to analyser for metering (but continue the audio path)
      currentNode.connect(analyserRef.current!);
      
      // Finally to destination for audio output
      currentNode.connect(audioContextRef.current.destination);
      
      console.log("Audio chain connected successfully");
      console.log("Chain: source -> compressor -> EQ filters -> analyser & destination");
      
      // Ensure audio context is running
      if (audioContextRef.current.state !== 'running') {
        console.log("Audio context not running, attempting to resume...");
        audioContextRef.current.resume().then(() => {
          console.log("Audio context resumed successfully");
        }).catch(err => {
          console.error("Failed to resume audio context:", err);
        });
      }
      
      // Restore playback state after Web Audio setup
      setTimeout(() => {
        if (audioRef.current && wasPlaying) {
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().then(() => {
            console.log("Resumed playback with Web Audio processing");
          }).catch(err => {
            console.error("Failed to resume playback:", err);
          });
        }
      }, 100);
      
      // Start meter updates
      updateMeters();
      setIsLiveEQEnabled(true);
    }
  };

  const disableLiveEQ = () => {
    if (audioContextRef.current) {
      console.log("Disabling Live EQ, closing audio context");
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceRef.current = null;
      filtersRef.current = [];
      compressorRef.current = null;
      analyserRef.current = null;
      setIsLiveEQEnabled(false);
      
      // Force audio element to reload to restore normal playback
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.load();
        
        setTimeout(() => {
          if (audioRef.current && wasPlaying) {
            audioRef.current.currentTime = currentTime;
            audioRef.current.play().catch(console.error);
          }
        }, 100);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileObj(file);
      
      // If no project name is set, use the file name without extension
      if (!currentProjectName) {
        const fileName = file.name.replace(/\\.[^/.]+$/, "");
        setCurrentProjectName(fileName);
      }
    }
  };

  // Function to manually reload audio from the project
  const loadAudioFromProject = async () => {
    if (!projectData || !projectData.originalAudioUrl) {
      toast.error("No audio file available in this project");
      return;
    }

    setIsLoadingAudio(true);
    try {
      // Set the audio file from the project URL
      setAudioFile(projectData.originalAudioUrl);
      
      // Directly control the audio element
      if (audioRef.current) {
        audioRef.current.src = projectData.originalAudioUrl;
        audioRef.current.load();
        
        // Wait for the audio to be ready
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            console.log("Manual reload successful - duration:", audioRef.current?.duration);
            resolve(true);
          };
          
          audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
        });
      }
      
      toast.success("Audio reloaded from project");
    } catch (error) {
      console.error("Failed to load audio from project:", error);
      toast.error("Failed to load audio from project");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const updateEQ = (bandIndex: number, gain: number) => {
    setIsProcessing(true);
    
    // Update state
    const newBands = [...eqBands];
    newBands[bandIndex].gain = gain;
    setEqBands(newBands);

    // Update audio filter
    if (filtersRef.current[bandIndex]) {
      filtersRef.current[bandIndex].gain.value = gain;
    }

    // Save settings if project exists
    if (currentProjectId) {
      saveProjectSettings();
    }

    setTimeout(() => setIsProcessing(false), 100);
  };

  const updateCompressor = (param: keyof CompressorSettings, value: number) => {
    setIsProcessing(true);
    
    const newCompressor = { ...compressor, [param]: value };
    setCompressor(newCompressor);

    if (compressorRef.current) {
      compressorRef.current[param].value = value;
    }

    // Save settings if project exists
    if (currentProjectId) {
      saveProjectSettings();
    }

    setTimeout(() => setIsProcessing(false), 100);
  };

  const saveProjectSettings = async () => {
    if (!currentProjectId) return;
    
    try {
      await updateProjectSettings({
        projectId: currentProjectId,
        eqPreset: selectedPreset,
        eqSettings: eqBands,
        compressorSettings: compressor,
      });
    } catch (error) {
      console.error("Failed to save project settings:", error);
    }
  };

  const createProjectAndUpload = async () => {
    if (!currentProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!audioFileObj) {
      toast.error("Please upload an audio file");
      return;
    }

    setIsProcessing(true);

    try {
      // Always create a new project
      const projectId = await createProject({
        name: currentProjectName.trim(),
        eqPreset: selectedPreset,
      });
      
      setCurrentProjectId(projectId);

      // Then update with settings
      await updateProjectSettings({
        projectId,
        eqSettings: eqBands,
        compressorSettings: compressor,
      });

      // Upload the audio file
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": audioFileObj.type },
        body: audioFileObj,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Update project with audio
      await updateProjectAudio({
        projectId,
        audioId: storageId,
        duration: audioRef.current?.duration || 0,
        fileSize: audioFileObj.size,
      });

      toast.success("Project saved successfully!");
    } catch (error) {
      toast.error("Failed to save project. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processAndDownload = async () => {
    if (!audioFile) {
      toast.error("No audio file to process");
      return;
    }
    
    if (!audioContextRef.current && audioRef.current) {
      // Initialize audio context if not already done
      initAudioContext();
    }
    
    if (!audioContextRef.current || !audioRef.current) {
      toast.error("Audio context could not be initialized");
      return;
    }
    
    setIsProcessing(true);
    setShowProcessDialog(false);
    
    try {
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(2, audioContextRef.current.sampleRate * audioRef.current.duration, audioContextRef.current.sampleRate);
      
      // Create audio buffer from current audio
      const response = await fetch(audioFile);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
      
      // Create source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create compressor
      const offlineCompressor = offlineContext.createDynamicsCompressor();
      offlineCompressor.threshold.value = compressor.threshold;
      offlineCompressor.ratio.value = compressor.ratio;
      offlineCompressor.attack.value = compressor.attack;
      offlineCompressor.release.value = compressor.release;
      
      // Create EQ filters
      const offlineFilters = eqBands.map(band => {
        const filter = offlineContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = band.Q;
        return filter;
      });
      
      // Connect chain
      let currentNode = source;
      currentNode.connect(offlineCompressor);
      currentNode = offlineCompressor;
      
      offlineFilters.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      currentNode.connect(offlineContext.destination);
      
      source.start();
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV and download
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProjectName || "processed-track"}.wav`;
      a.click();
      
      setDownloadMessage('Your track has been downloaded!');
      setTimeout(() => setDownloadMessage(''), 3000);
      
      // Create project if it doesn't exist yet
      if (!currentProjectId && currentProjectName) {
        await createProjectAndUpload();
      }
      
      // Update project status to completed if it exists
      if (currentProjectId) {
        try {
          await updateProjectSettings({
            projectId: currentProjectId,
            status: "completed",
          });
        } catch (error) {
          console.error("Failed to update project status:", error);
        }
      }
      
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply EQ preset
  const applyEQPreset = (presetName: string) => {
    setIsProcessing(true);
    
    // Find the preset
    const preset = EQ_PRESETS.find(p => p.name === presetName);
    if (!preset) {
      setIsProcessing(false);
      return;
    }
    
    setSelectedPreset(presetName);
    
    // Apply EQ settings
    preset.settings.forEach((gain, index) => {
      if (index < eqBands.length) {
        updateEQ(index, gain);
      }
    });
    
    // Save settings if project exists
    if (currentProjectId) {
      saveProjectSettings();
    }
    
    setTimeout(() => setIsProcessing(false), 200);
  };

  // Convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    // Interleave channels
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const updateMeters = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Kick drum detection (20-100Hz range)
    const kickRange = dataArray.slice(1, 8);  // Very low frequencies for kick
    const kickLevel = Math.max(...kickRange);
    
    // Snare/high-hat detection (2kHz-8kHz)
    const snareRange = dataArray.slice(150, 400);
    const snareLevel = Math.max(...snareRange);
    
    // Overall level with instant response
    const overallLevel = Math.max(...dataArray);
    const currentLevel = (overallLevel / 255) * 100;
    
    // Kick detection with threshold and timing
    const now = Date.now();
    let kickResponse = kickDetectRef.current;
    
    if (kickLevel > 180 && now - lastKickRef.current > 100) { // Kick threshold
      kickResponse = 100;
      lastKickRef.current = now;
    } else {
      kickResponse = Math.max(0, kickResponse - 8); // Fast decay
    }
    kickDetectRef.current = kickResponse;
    
    // Peak detection with faster response
    if (currentLevel > peakHoldRef.current) {
      peakHoldRef.current = currentLevel;
      peakDecayRef.current = now + 500; // Shorter hold
    } else if (now > peakDecayRef.current) {
      peakHoldRef.current = Math.max(0, peakHoldRef.current - 2); // Faster decay
    }
    
    // Enhanced level calculation for drum response
    const drumWeightedLevel = Math.max(
      currentLevel,
      (kickLevel / 255) * 120, // Boost kick response
      (snareLevel / 255) * 110  // Boost snare response
    );
    
    // True peak detection (can exceed 100%)
    const rawTruePeak = Math.max(
      drumWeightedLevel,
      (Math.max(...dataArray) / 255) * 200 // Allow up to 200%
    );
    
    if (rawTruePeak > truePeakRef.current) {
      truePeakRef.current = rawTruePeak;
      truePeakDecayRef.current = now + 2000; // Hold longer for true peak
    } else if (now > truePeakDecayRef.current) {
      truePeakRef.current = Math.max(0, truePeakRef.current - 1);
    }
    
    const isClipping = drumWeightedLevel > 95;
    
    setVuMeter({
      level: drumWeightedLevel,
      peak: peakHoldRef.current,
      clipping: isClipping,
      kick: kickResponse,
      truePeak: truePeakRef.current
    });
    
    requestAnimationFrame(updateMeters);
  };

  const applyCompressorPreset = (preset: CompressorPreset) => {
    setIsProcessing(true);
    
    // Apply compressor settings
    setCompressor(preset.compressor);
    if (compressorRef.current) {
      compressorRef.current.threshold.value = preset.compressor.threshold;
      compressorRef.current.ratio.value = preset.compressor.ratio;
      compressorRef.current.attack.value = preset.compressor.attack;
      compressorRef.current.release.value = preset.compressor.release;
    }
    
    // Set appropriate meter range for streaming presets
    if (preset.name === 'YouTube' || preset.name === 'Spotify') {
      setMeterRange(150); // Optimal range for streaming loudness standards
    }
    
    // Save settings if project exists
    if (currentProjectId) {
      saveProjectSettings();
    }
    
    setTimeout(() => setIsProcessing(false), 200);
  };

  // Project status display
  const getProjectStatus = () => {
    if (!currentProjectId) return null;
    
    let statusText = "New Project";
    let statusColor = "text-blue-400";
    
    if (projectData) {
      switch (projectData.status) {
        case "uploading":
          statusText = "Uploading";
          statusColor = "text-blue-400";
          break;
        case "queued":
          statusText = "Ready to Process";
          statusColor = "text-yellow-400";
          break;
        case "processing":
          statusText = "Processing";
          statusColor = "text-yellow-400";
          break;
        case "completed":
          statusText = "Completed";
          statusColor = "text-green-400";
          break;
        case "failed":
          statusText = "Failed";
          statusColor = "text-red-400";
          break;
      }
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm ${statusColor}`}>{statusText}</span>
        {projectData?.status === "completed" && (
          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
            Processed
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">SSL-Style Audio Processor</h2>
      
      {/* Project Info */}
      <div className="mb-6 bg-black/30 p-4 rounded-lg border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={currentProjectName}
              onChange={(e) => setCurrentProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
            />
          </div>
          
          <div className="flex flex-col items-start md:items-end">
            {getProjectStatus()}
            
            {currentProjectId && (
              <div className="text-xs text-gray-400 mt-1">
                Project ID: {currentProjectId.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* File Upload */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-300 text-sm font-medium">
            Audio File
          </label>
          
          {/* Reload Audio Button */}
          {projectData?.originalAudioUrl && (
            <button
              onClick={loadAudioFromProject}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? "Reloading..." : "Reload Audio"}
            </button>
          )}
        </div>
        
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="mb-4 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-600 file:text-sm file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700"
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
                  onClick={async () => {
                    await initAudioContext();
                    console.log("Web Audio API initialized for live processing");
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                >
                  Enable Live EQ
                </button>
              ) : (
                <button
                  onClick={disableLiveEQ}
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

        {/* Audio element for playback */}
        {audioFile && (
          <audio
            ref={audioRef}
            src={audioFile}
            className="w-full mb-4"
            onPlay={() => {
              setIsPlaying(true);
              console.log("Audio playback started");
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => {
              setDuration(audioRef.current?.duration || 0);
              console.log("Audio metadata loaded, duration:", audioRef.current?.duration);
            }}
            controls
          />
        )}
      </div>

      {/* Controls */}
      {audioFile && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium">Processing:</span>
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          </div>

          {/* Audio Controls & Volume Meter - Sticky */}
          <div className="bg-black p-4 rounded border border-gray-700 sticky top-4 z-10">
            {/* Audio Controls */}
            {audioFile && (
              <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-600">
                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                      }
                    }}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm transition-all duration-200"
                    title="-10s"
                  >
                    ⏪
                  </button>
                  
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        if (isPlaying) {
                          audioRef.current.pause();
                        } else {
                          audioRef.current.play().catch(console.error);
                        }
                      }
                    }}
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
                      }
                    }}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm transition-all duration-200"
                    title="+10s"
                  >
                    ⏩
                  </button>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs font-mono text-gray-400">VOL</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="1"
                      onChange={(e) => {
                        if (audioRef.current) {
                          audioRef.current.volume = parseFloat(e.target.value);
                        }
                      }}
                      className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 min-w-12">
                    {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={(e) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = parseFloat(e.target.value);
                        }
                      }}
                      className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #60a5fa ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  
                  <span className="text-xs font-mono text-gray-400 min-w-12">
                    {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-300">LEVEL METER</h3>
              <div className="flex gap-2">
                <span className="text-xs text-gray-400">RANGE:</span>
                {[150, 175, 200].map(range => (
                  <button
                    key={range}
                    onClick={() => setMeterRange(range)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      meterRange === range 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {range}%
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Main Level Meter */}
              <div className="relative">
                <div className="text-xs font-mono text-gray-400 mb-1 flex justify-between">
                  <span>LEVEL</span>
                  <span>{vuMeter.level.toFixed(0)}% / {vuMeter.truePeak.toFixed(0)}%</span>
                </div>
                <div className="relative h-8 bg-gray-800 rounded border border-gray-600 overflow-hidden">
                  {/* Scale marks based on range */}
                  <div className="absolute inset-0 flex justify-between items-center px-1">
                    {Array.from({ length: 6 }, (_, i) => (meterRange / 5) * i).map(mark => (
                      <div key={mark} className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-600" />
                        <span className="text-xs text-gray-500 mt-1">{mark}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* True peak hold line */}
                  <div 
                    className="absolute h-full w-0.5 bg-orange-400 z-20 transition-all duration-100"
                    style={{ left: `${Math.min((vuMeter.truePeak / meterRange) * 100, 100)}%` }}
                  />
                  
                  {/* Peak hold line */}
                  <div 
                    className="absolute h-full w-0.5 bg-yellow-400 z-10 transition-all duration-75"
                    style={{ left: `${Math.min((vuMeter.peak / meterRange) * 100, 100)}%` }}
                  />
                  
                  {/* Main level bar */}
                  <div 
                    className={`absolute left-0 h-full transition-all duration-25 z-5 ${
                      vuMeter.clipping ? 'bg-red-500 animate-pulse' : 
                      vuMeter.level > 80 ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500' :
                      vuMeter.level > 50 ? 'bg-gradient-to-r from-green-500 to-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((vuMeter.level / meterRange) * 100, 100)}%` }}
                  />
                  
                  {/* Kick response overlay */}
                  <div 
                    className="absolute left-0 h-full bg-blue-400 opacity-60 transition-all duration-50 z-0"
                    style={{ width: `${Math.min((vuMeter.kick / meterRange) * 100, 100)}%` }}
                  />
                  
                  {/* 100% reference line */}
                  {meterRange > 100 && (
                    <div 
                      className="absolute h-full w-0.5 bg-white opacity-50"
                      style={{ left: `${(100 / meterRange) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex gap-4">
                  <span className={`${vuMeter.kick > 50 ? 'text-blue-400' : 'text-gray-500'}`}>
                    KICK {vuMeter.kick > 50 ? '●' : '○'}
                  </span>
                  <span className={`${vuMeter.level > 70 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    LOUD {vuMeter.level > 70 ? '●' : '○'}
                  </span>
                  <span className={`${vuMeter.clipping ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
                    CLIP {vuMeter.clipping ? '●' : '○'}
                  </span>
                  <span className={`${vuMeter.truePeak > 100 ? 'text-orange-400' : 'text-gray-500'}`}>
                    OVER {vuMeter.truePeak > 100 ? '●' : '○'}
                  </span>
                </div>
                <div className="text-gray-400">
                  TRUE PEAK: {vuMeter.truePeak.toFixed(0)}% | RANGE: {meterRange}%
                </div>
              </div>
            </div>
          </div>

          {/* EQ Sliders */}
          <div className="bg-black p-6 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-6 text-center text-gray-300">7-BAND EQUALIZER</h3>
            <div className="flex justify-center gap-8">
              {eqBands.map((band, index) => {
                const labels = ['SUB', 'BASS', 'L-MID', 'MID', 'H-MID', 'HIGH', 'AIR'];
                return (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs font-mono text-gray-400 mb-1">{band.gain > 0 ? '+' : ''}{band.gain}</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={band.gain}
                      onChange={(e) => updateEQ(index, parseFloat(e.target.value))}
                      className="h-32 w-6 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-vertical"
                      orient="vertical"
                      style={{
                        writingMode: 'bt-lr',
                        WebkitAppearance: 'slider-vertical'
                      }}
                    />
                    <label className="text-xs font-mono text-gray-400 mt-2 text-center">
                      {labels[index]}<br/>
                      {band.frequency < 1000 ? `${band.frequency}Hz` : `${band.frequency/1000}k`}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EQ Presets */}
          <div className="bg-black p-4 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-300">EQ PRESETS</h3>
            <div className="flex mb-4 space-x-2">
              <input
                type="text"
                placeholder="Search presets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white flex-1"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="All">All Categories</option>
                {PRESET_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyEQPreset(preset.name)}
                  className={`p-3 bg-gray-800 border ${selectedPreset === preset.name ? 'border-blue-500' : 'border-gray-600'} rounded hover:bg-gray-700 hover:border-gray-500 transition-colors text-left`}
                >
                  <div className="font-medium text-sm text-white">{preset.name}</div>
                  <div className="text-xs text-gray-500">{preset.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compressor Presets */}
          <div className="bg-black p-4 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-300">COMPRESSOR PRESETS</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {compressorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyCompressorPreset(preset)}
                  className="p-3 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700 hover:border-gray-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="font-medium text-sm text-white">{preset.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compressor */}
          <div className="bg-black p-6 rounded border border-gray-700">
            <h3 className="text-lg font-medium mb-6 text-center text-gray-300">SSL-STYLE COMPRESSOR</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <label className="block text-sm font-mono text-gray-400 mb-2">THRESH</label>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  step="1"
                  value={compressor.threshold}
                  onChange={(e) => updateCompressor('threshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-400">{compressor.threshold}dB</span>
              </div>
              <div className="text-center">
                <label className="block text-sm font-mono text-gray-400 mb-2">RATIO</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.1"
                  value={compressor.ratio}
                  onChange={(e) => updateCompressor('ratio', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-400">{compressor.ratio}:1</span>
              </div>
              <div className="text-center">
                <label className="block text-sm font-mono text-gray-400 mb-2">ATTACK</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={compressor.attack}
                  onChange={(e) => updateCompressor('attack', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-400">{compressor.attack}s</span>
              </div>
              <div className="text-center">
                <label className="block text-sm font-mono text-gray-400 mb-2">RELEASE</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={compressor.release}
                  onChange={(e) => updateCompressor('release', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-400">{compressor.release}s</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {/* Save Project Button */}
            <button
              onClick={createProjectAndUpload}
              className="px-6 py-4 bg-blue-600 text-white rounded font-mono font-bold hover:bg-blue-700 border border-blue-500"
              disabled={isProcessing || !currentProjectName.trim() || !audioFileObj}
            >
              SAVE AS NEW PROJECT
            </button>
            
            {/* Process Button */}
            <button
              onClick={() => setShowProcessDialog(true)}
              className="px-6 py-4 bg-red-600 text-white rounded font-mono font-bold hover:bg-red-700 border border-red-500"
              disabled={isProcessing}
            >
              PROCESS & DOWNLOAD
            </button>
          </div>
        </div>
      )}

      {/* Process Dialog */}
      {showProcessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-white">Process Track</h3>
            <p className="text-gray-300 mb-6">
              Should I process the track with your current EQ and compressor settings?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowProcessDialog(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={processAndDownload}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Yes, Process'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Message */}
      {downloadMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded border border-green-500 shadow-lg z-50">
          {downloadMessage}
        </div>
      )}

      <style jsx>{`
        .slider-vertical {
          writing-mode: bt-lr;
          -webkit-appearance: slider-vertical;
        }
      `}</style>
    </div>
  );
}