import { useRef, useState, useEffect, useCallback } from 'react';
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

export default function LiveAudioProcessorFixed({ projectName = "", projectId = null }) {
  // Two separate audio elements
  const normalAudioRef = useRef<HTMLAudioElement>(null);
  const eqAudioRef = useRef<HTMLAudioElement>(null);
  const [activeAudioMode, setActiveAudioMode] = useState<'normal' | 'eq'>('normal');
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileObj, setAudioFileObj] = useState<File | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiveEQEnabled, setIsLiveEQEnabled] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Project state
  const [currentProjectName, setCurrentProjectName] = useState(projectName || "");
  const [currentProjectId, setCurrentProjectId] = useState<Id<"projects"> | null>(projectId);
  const [selectedPreset, setSelectedPreset] = useState("Default");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // VU meter state
  const [vuMeter, setVuMeter] = useState({ level: 0, peak: 0, clipping: false, kick: 0, truePeak: 0 });
  const [meterRange, setMeterRange] = useState(150);
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
    }
  ];

  // State synchronization between audio elements
  const syncAudioState = useCallback((fromRef: React.RefObject<HTMLAudioElement>, toRef: React.RefObject<HTMLAudioElement>) => {
    if (!fromRef.current || !toRef.current) return;
    
    const from = fromRef.current;
    const to = toRef.current;
    
    // Sync playback state
    to.currentTime = from.currentTime;
    to.volume = from.volume;
    to.playbackRate = from.playbackRate;
    
    // Handle play state
    if (!from.paused) {
      to.play().catch(console.error);
    } else {
      to.pause();
    }
  }, []);

  // Helper function to clean up audio context
  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      console.log("Cleaning up audio context");
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceRef.current = null;
      filtersRef.current = [];
      compressorRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  // Helper function to load audio in the normal element
  const loadAudioInNormalElement = useCallback(async (audioUrl) => {
    if (!audioUrl) return;
    
    // Reset audio context if it exists
    cleanupAudioContext();
    
    // Load audio in normal element only
    try {
      await new Promise<void>((resolve) => {
        if (normalAudioRef.current) {
          normalAudioRef.current.src = audioUrl;
          normalAudioRef.current.load();
          normalAudioRef.current.addEventListener('canplay', () => resolve(), { once: true });
        } else {
          resolve();
        }
      });
      
      // Create a placeholder for EQ audio element
      if (!eqAudioRef.current) {
        eqAudioRef.current = document.createElement('audio');
        eqAudioRef.current.className = 'hidden';
      }
      
      console.log("Audio loaded successfully");
    } catch (error) {
      console.error("Failed to load audio:", error);
    }
  }, [cleanupAudioContext]);

  // Initialize EQ processing
  const initializeEQProcessing = useCallback(async (audioElement: HTMLAudioElement | null) => {
    if (!audioElement) {
      console.error("Cannot initialize EQ processing: audio element is null");
      return false;
    }
    
    // Always clean up any existing audio context first
    cleanupAudioContext();
    
    try {
      // Create a new audio element to avoid the "already connected" error
      const newAudioElement = document.createElement('audio');
      newAudioElement.src = audioElement.src;
      newAudioElement.volume = audioElement.volume;
      newAudioElement.currentTime = audioElement.currentTime;
      
      // Replace the ref with the new element
      if (eqAudioRef.current) {
        // Copy event listeners
        const oldElement = eqAudioRef.current;
        eqAudioRef.current = newAudioElement;
        
        // Copy attributes and properties
        newAudioElement.className = oldElement.className;
        newAudioElement.controls = oldElement.controls;
        newAudioElement.autoplay = oldElement.autoplay;
        newAudioElement.loop = oldElement.loop;
        newAudioElement.muted = oldElement.muted;
        newAudioElement.crossOrigin = oldElement.crossOrigin;
        newAudioElement.preload = oldElement.preload;
      }
      
      console.log("Creating new AudioContext");
      audioContextRef.current = new AudioContext();
      
      if (audioContextRef.current.state === 'suspended') {
        console.log("AudioContext is suspended, resuming...");
        await audioContextRef.current.resume();
      }
      
      console.log("Creating MediaElementSource");
      sourceRef.current = audioContextRef.current.createMediaElementSource(newAudioElement);
      
      // Create analyser for meters
      console.log("Creating analyzer");
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.0;
      
      // Create compressor
      console.log("Creating compressor");
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();
      compressorRef.current.threshold.value = compressor.threshold;
      compressorRef.current.ratio.value = compressor.ratio;
      compressorRef.current.attack.value = compressor.attack;
      compressorRef.current.release.value = compressor.release;
      
      // Create filters for each EQ band
      console.log("Creating EQ filters");
      filtersRef.current = eqBands.map((band) => {
        const filter = audioContextRef.current!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = band.Q;
        return filter;
      });

      // Connect audio chain: source -> compressor -> EQ filters -> analyser -> destination
      console.log("Connecting audio chain");
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
      
      // Start meter updates
      updateMeters();
      
      // If the original was playing, play the new one
      if (!audioElement.paused) {
        newAudioElement.play().catch(console.error);
      }
      
      return true; // Success
    } catch (error) {
      console.error("Failed to initialize EQ processing:", error);
      cleanupAudioContext();
      return false; // Failure
    }
  }, [compressor, eqBands, cleanupAudioContext]);

  // Switch to EQ mode
  const switchToEQMode = useCallback(async () => {
    if (activeAudioMode === 'eq') return;
    
    console.log("Switching to EQ mode");
    
    // Get current state from normal audio
    const currentTime = normalAudioRef.current?.currentTime || 0;
    const volume = normalAudioRef.current?.volume || 1;
    const wasPlaying = normalAudioRef.current && !normalAudioRef.current.paused;
    
    // Pause normal audio
    normalAudioRef.current?.pause();
    
    // Initialize Web Audio chain with the normal audio element
    // The initializeEQProcessing function will create a new audio element
    const success = await initializeEQProcessing(normalAudioRef.current);
    if (!success) {
      console.error("Failed to initialize EQ processing, staying in normal mode");
      return;
    }
    
    // Set the current time and volume on the new EQ audio element
    if (eqAudioRef.current) {
      eqAudioRef.current.currentTime = currentTime;
      eqAudioRef.current.volume = volume;
      
      // If normal audio was playing, start EQ audio
      if (wasPlaying) {
        try {
          await eqAudioRef.current.play();
          console.log("EQ audio playback started");
        } catch (error) {
          console.error("Failed to start EQ audio playback:", error);
        }
      }
    }
    
    setActiveAudioMode('eq');
    setIsLiveEQEnabled(true);
  }, [activeAudioMode, initializeEQProcessing]);
  
  // Switch to normal mode
  const switchToNormalMode = useCallback(() => {
    if (activeAudioMode === 'normal') return;
    
    // Get current state from EQ audio
    const currentTime = eqAudioRef.current?.currentTime || 0;
    const volume = eqAudioRef.current?.volume || 1;
    const wasPlaying = eqAudioRef.current && !eqAudioRef.current.paused;
    
    // Pause EQ audio
    eqAudioRef.current?.pause();
    
    // Cleanup Web Audio
    cleanupAudioContext();
    
    // Update normal audio state
    if (normalAudioRef.current) {
      normalAudioRef.current.currentTime = currentTime;
      normalAudioRef.current.volume = volume;
      
      // If EQ audio was playing, start normal audio
      if (wasPlaying) {
        normalAudioRef.current.play().catch(console.error);
      }
    }
    
    setActiveAudioMode('normal');
    setIsLiveEQEnabled(false);
  }, [activeAudioMode, cleanupAudioContext]);

  // Get active audio element
  const getActiveAudioElement = useCallback(() => {
    if (activeAudioMode === 'normal' || !eqAudioRef.current) {
      return normalAudioRef.current;
    } else {
      return eqAudioRef.current;
    }
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

  // Reset audio state
  const resetAudioState = useCallback(() => {
    // Clean up audio context if it exists
    cleanupAudioContext();
    
    setActiveAudioMode('normal');
    setIsLiveEQEnabled(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [cleanupAudioContext]);

  // Sync projectId prop to state
  useEffect(() => {
    if (projectId !== currentProjectId) {
      setCurrentProjectId(projectId);
      setSettingsLoaded(false); // Reset when project changes
    }
  }, [projectId, currentProjectId]);

  // Load project data
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
        
        // Always start in normal mode for loaded projects
        setActiveAudioMode('normal');
        setIsLiveEQEnabled(false);
        
        // Load audio in normal element
        loadAudioInNormalElement(projectData.originalAudioUrl);
      }
      
      setSettingsLoaded(true);
    }
  }, [projectData, loadAudioInNormalElement]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileObj(file);
      
      // Reset audio state when loading new file
      resetAudioState();
      
      // If no project name is set, use the file name without extension
      if (!currentProjectName) {
        const fileName = file.name.replace(/\\.[^/.]+$/, "");
        setCurrentProjectName(fileName);
      }
    }
  };
  
  // Ensure audio is loaded when audioFile changes
  useEffect(() => {
    if (audioFile) {
      console.log("Audio file changed, loading in normal element:", audioFile);
      loadAudioInNormalElement(audioFile);
    }
  }, [audioFile, loadAudioInNormalElement]);

  // Function to manually reload audio from the project
  const loadAudioFromProject = async () => {
    if (!projectData || !projectData.originalAudioUrl) {
      toast.error("No audio file available in this project");
      return;
    }

    setIsLoadingAudio(true);
    try {
      // Reset audio state
      resetAudioState();
      
      // Set the audio file from the project URL
      setAudioFile(projectData.originalAudioUrl);
      
      // Load audio in normal element
      await loadAudioInNormalElement(projectData.originalAudioUrl);
      
      toast.success("Audio reloaded from project");
    } catch (error) {
      console.error("Failed to load audio from project:", error);
      toast.error("Failed to load audio from project");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Update EQ
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

  // Update compressor
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

  // Save project settings
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

  // Create project and upload
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

      // Get duration from the active audio element
      const activeElement = getActiveAudioElement();
      const audioDuration = activeElement?.duration || 0;

      // Update project with audio
      await updateProjectAudio({
        projectId,
        audioId: storageId,
        duration: audioDuration,
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

  // Update meters
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

  // Debug function to check audio elements state
  const debugAudioState = useCallback(() => {
    console.group("Audio Elements Debug");
    
    // Normal audio element
    if (normalAudioRef.current) {
      console.log("Normal Audio:", {
        src: normalAudioRef.current.src,
        paused: normalAudioRef.current.paused,
        currentTime: normalAudioRef.current.currentTime,
        duration: normalAudioRef.current.duration,
        readyState: normalAudioRef.current.readyState,
        volume: normalAudioRef.current.volume
      });
    } else {
      console.log("Normal Audio: Not initialized");
    }
    
    // EQ audio element
    if (eqAudioRef.current) {
      console.log("EQ Audio:", {
        src: eqAudioRef.current.src,
        paused: eqAudioRef.current.paused,
        currentTime: eqAudioRef.current.currentTime,
        duration: eqAudioRef.current.duration,
        readyState: eqAudioRef.current.readyState,
        volume: eqAudioRef.current.volume
      });
    } else {
      console.log("EQ Audio: Not initialized");
    }
    
    // Audio context
    if (audioContextRef.current) {
      console.log("Audio Context:", {
        state: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
        baseLatency: audioContextRef.current.baseLatency
      });
    } else {
      console.log("Audio Context: Not initialized");
    }
    
    console.log("Active Mode:", activeAudioMode);
    console.log("Live EQ Enabled:", isLiveEQEnabled);
    
    console.groupEnd();
  }, [activeAudioMode, isLiveEQEnabled]);
  
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
                <button 
                  onClick={debugAudioState}
                  className="px-2 py-0.5 bg-gray-700 text-xs text-gray-300 rounded hover:bg-gray-600"
                  title="Debug audio state in console"
                >
                  Debug
                </button>
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

        {/* Hidden audio element for playback */}
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
                console.log("Normal audio metadata loaded, duration:", normalAudioRef.current?.duration);
              }}
            />
            
            {/* EQ audio element is created dynamically when needed */}
          </>
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
                      const activeElement = getActiveAudioElement();
                      if (activeElement) {
                        activeElement.currentTime = Math.max(0, activeElement.currentTime - 10);
                      }
                    }}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm transition-all duration-200"
                    title="-10s"
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
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-200 shadow-lg hover:shadow-xl"
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
                        const activeElement = getActiveAudioElement();
                        if (activeElement) {
                          activeElement.volume = parseFloat(e.target.value);
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
                        const activeElement = getActiveAudioElement();
                        if (activeElement) {
                          activeElement.currentTime = parseFloat(e.target.value);
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
            
            {/* VU Meter - Only show when EQ is active */}
            {isLiveEQEnabled && (
              <>
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
              </>
            )}
          </div>

          {/* EQ Sliders - Only show when EQ is active or as disabled controls */}
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
                      className={`h-32 w-6 rounded-lg appearance-none cursor-pointer slider-vertical ${
                        isLiveEQEnabled ? 'bg-gray-800' : 'bg-gray-700 opacity-50'
                      }`}
                      disabled={!isLiveEQEnabled}
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
          </div>
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