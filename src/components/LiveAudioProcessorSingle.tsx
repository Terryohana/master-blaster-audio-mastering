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

export default function LiveAudioProcessorSingle({ projectName = "", projectId = null }) {
  // Single audio element
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bypassRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileObj, setAudioFileObj] = useState<File | null>(null);
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

  // Initialize audio context and nodes
  const initializeAudioContext = useCallback(async () => {
    if (!audioRef.current) return false;
    
    try {
      // Always clean up existing context first
      if (audioContextRef.current) {
        console.log("Cleaning up existing audio context");
        audioContextRef.current.close();
        audioContextRef.current = null;
        sourceRef.current = null;
        bypassRef.current = null;
        filtersRef.current = [];
        compressorRef.current = null;
        analyserRef.current = null;
      }
      
      // Create a new audio context
      console.log("Creating new AudioContext");
      audioContextRef.current = new AudioContext();
      
      if (audioContextRef.current.state === 'suspended') {
        console.log("AudioContext is suspended, resuming...");
        await audioContextRef.current.resume();
      }
      
      // Create a new audio element to avoid the "already connected" error
      const tempAudio = new Audio();
      tempAudio.src = audioRef.current.src;
      tempAudio.crossOrigin = "anonymous";
      
      // Wait for the temp audio to be ready
      await new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          console.log("Temp audio ready");
          resolve();
        };
        
        if (tempAudio.readyState >= 3) { // HAVE_FUTURE_DATA or higher
          resolve();
        } else {
          tempAudio.addEventListener('canplay', handleCanPlay, { once: true });
          tempAudio.load();
        }
      });
      
      console.log("Creating MediaElementSource");
      sourceRef.current = audioContextRef.current.createMediaElementSource(tempAudio);
      
      // Create bypass node
      bypassRef.current = audioContextRef.current.createGain();
      bypassRef.current.gain.value = 1;
      
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
      
      // Connect source to bypass (direct path)
      sourceRef.current.connect(bypassRef.current);
      bypassRef.current.connect(audioContextRef.current.destination);
      
      // Replace the audio element
      const currentTime = audioRef.current.currentTime;
      const wasPlaying = !audioRef.current.paused;
      const volume = audioRef.current.volume;
      
      // Update the temp audio state
      tempAudio.currentTime = currentTime;
      tempAudio.volume = volume;
      
      // Replace the reference
      audioRef.current = tempAudio;
      
      // If it was playing, start playing the new audio
      if (wasPlaying) {
        tempAudio.play().catch(console.error);
      }
      
      // Start with bypass mode (EQ disabled)
      setIsLiveEQEnabled(false);
      
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }, [compressor, eqBands]);

  // Enable EQ processing
  const enableEQProcessing = useCallback(() => {
    if (!audioContextRef.current || !sourceRef.current || !bypassRef.current) {
      console.error("Audio context not initialized");
      return false;
    }
    
    try {
      // Disconnect bypass path
      bypassRef.current.gain.value = 0;
      
      // Connect processing chain
      let currentNode = sourceRef.current;
      
      // Connect to compressor
      if (compressorRef.current) {
        currentNode.connect(compressorRef.current);
        currentNode = compressorRef.current;
      }
      
      // Connect through EQ filters
      filtersRef.current.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      
      // Connect to analyser
      if (analyserRef.current) {
        currentNode.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current!.destination);
      } else {
        // Connect directly to destination if no analyser
        currentNode.connect(audioContextRef.current!.destination);
      }
      
      // Start meter updates
      updateMeters();
      
      setIsLiveEQEnabled(true);
      return true;
    } catch (error) {
      console.error("Failed to enable EQ processing:", error);
      return false;
    }
  }, []);

  // Disable EQ processing
  const disableEQProcessing = useCallback(() => {
    if (!audioContextRef.current || !bypassRef.current) {
      console.error("Audio context not initialized");
      return false;
    }
    
    try {
      // Enable bypass path
      bypassRef.current.gain.value = 1;
      
      // Disconnect processing nodes from destination
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      
      filtersRef.current.forEach(filter => {
        filter.disconnect();
      });
      
      if (compressorRef.current) {
        compressorRef.current.disconnect();
      }
      
      setIsLiveEQEnabled(false);
      return true;
    } catch (error) {
      console.error("Failed to disable EQ processing:", error);
      return false;
    }
  }, []);

  // Toggle EQ processing
  const toggleEQProcessing = useCallback(async () => {
    console.log("Toggling EQ processing");
    
    // Always initialize audio context when enabling EQ
    if (!isLiveEQEnabled) {
      console.log("Initializing audio context for EQ");
      const initialized = await initializeAudioContext();
      if (!initialized) {
        console.error("Failed to initialize audio context");
        return;
      }
      enableEQProcessing();
    } else {
      disableEQProcessing();
    }
  }, [isLiveEQEnabled, initializeAudioContext, enableEQProcessing, disableEQProcessing]);

  // Clean up audio context
  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      console.log("Cleaning up audio context");
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceRef.current = null;
      bypassRef.current = null;
      filtersRef.current = [];
      compressorRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  // Reset audio state
  const resetAudioState = useCallback(() => {
    cleanupAudioContext();
    setIsLiveEQEnabled(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [cleanupAudioContext]);

  // Load audio
  const loadAudio = useCallback(async (audioUrl) => {
    if (!audioUrl) return;
    
    // Reset audio context
    resetAudioState();
    
    // Load audio
    try {
      // Create a new audio element
      const newAudio = new Audio();
      newAudio.crossOrigin = "anonymous";
      newAudio.src = audioUrl;
      
      // Wait for the audio to be ready
      await new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          console.log("New audio ready");
          resolve();
        };
        
        newAudio.addEventListener('canplay', handleCanPlay, { once: true });
        newAudio.load();
      });
      
      // Replace the audio reference
      audioRef.current = newAudio;
      
      console.log("Audio loaded successfully");
    } catch (error) {
      console.error("Failed to load audio:", error);
    }
  }, [resetAudioState]);

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
      
      // Load audio file if available
      if (projectData.originalAudioUrl) {
        console.log("Setting audio file from project:", projectData.originalAudioUrl);
        setAudioFile(projectData.originalAudioUrl);
        setAudioFileObj(null); // Clear file object since loading from URL
        
        // Load audio
        loadAudio(projectData.originalAudioUrl);
      }
      
      setSettingsLoaded(true);
    }
  }, [projectData, loadAudio]);

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
      
      // Load audio
      loadAudio(url);
    }
  };

  // Ensure audio is loaded when audioFile changes
  useEffect(() => {
    if (audioFile) {
      console.log("Audio file changed, loading:", audioFile);
      loadAudio(audioFile);
    }
  }, [audioFile, loadAudio]);
  
  // Set up event listeners for the audio element
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration || 0);
      console.log("Audio metadata loaded, duration:", audioRef.current?.duration);
    };
    
    // Add event listeners
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [audioRef.current]);

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
      
      // Load audio
      await loadAudio(projectData.originalAudioUrl);
      
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

      // Get duration from the audio element
      const audioDuration = audioRef.current?.duration || 0;

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

  // Apply compressor preset
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

  // Debug function to check audio state
  const debugAudioState = useCallback(() => {
    console.group("Audio Elements Debug");
    
    // Audio element
    if (audioRef.current) {
      console.log("Audio:", {
        src: audioRef.current.src,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        readyState: audioRef.current.readyState,
        volume: audioRef.current.volume
      });
    } else {
      console.log("Audio: Not initialized");
    }
    
    // Audio context
    if (audioContextRef.current) {
      console.log("Audio Context:", {
        state: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
        baseLatency: audioContextRef.current.baseLatency
      });
      
      // Source node
      if (sourceRef.current) {
        console.log("Source Node: Connected");
      } else {
        console.log("Source Node: Not connected");
      }
      
      // Bypass node
      if (bypassRef.current) {
        console.log("Bypass Node:", {
          gain: bypassRef.current.gain.value
        });
      } else {
        console.log("Bypass Node: Not connected");
      }
      
      // Filters
      console.log("EQ Filters:", filtersRef.current.length);
      
      // Compressor
      if (compressorRef.current) {
        console.log("Compressor:", {
          threshold: compressorRef.current.threshold.value,
          ratio: compressorRef.current.ratio.value
        });
      } else {
        console.log("Compressor: Not connected");
      }
    } else {
      console.log("Audio Context: Not initialized");
    }
    
    console.log("Live EQ Enabled:", isLiveEQEnabled);
    console.log("Is Playing:", isPlaying);
    
    console.groupEnd();
  }, [isLiveEQEnabled, isPlaying]);
  
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
              <button
                onClick={toggleEQProcessing}
                className={`px-3 py-1 ${
                  isLiveEQEnabled 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-blue-600 hover:bg-blue-500'
                } text-white text-xs rounded transition-colors`}
              >
                {isLiveEQEnabled ? 'Disable Live EQ' : 'Enable Live EQ'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {isLiveEQEnabled 
                ? "Live EQ is active. Adjust controls below to hear real-time changes."
                : "Click \"Enable Live EQ\" to hear real-time effects while adjusting controls below."
              }
            </p>
          </div>
        )}

        {/* Audio element for playback is created dynamically */}
        <div id="audio-container" className="hidden"></div>
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
                      if (isPlaying) {
                        audioRef.current?.pause();
                      } else {
                        audioRef.current?.play().catch(console.error);
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