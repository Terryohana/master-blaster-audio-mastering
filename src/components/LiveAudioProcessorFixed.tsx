import { useRef, useState, useEffect } from 'react';
import * as React from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { EQ_PRESETS, PRESET_CATEGORIES } from './EQPresets';

// Component code remains the same until the return statement
// Only modifying the specific sections requested

export default function LiveAudioProcessor({ projectName = "", projectId = null }) {
  // All state and functions remain the same
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]);
  const compressorRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileObj, setAudioFileObj] = useState(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [vuMeter, setVuMeter] = useState({ level: 0, peak: 0, clipping: false, kick: 0, truePeak: 0 });
  const [meterRange, setMeterRange] = useState(150);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentProjectName, setCurrentProjectName] = useState(projectName || "");
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [selectedPreset, setSelectedPreset] = useState("Default");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLiveEQEnabled, setIsLiveEQEnabled] = useState(false);
  const analyserRef = useRef(null);
  const peakHoldRef = useRef(0);
  const peakDecayRef = useRef(0);
  const kickDetectRef = useRef(0);
  const lastKickRef = useRef(0);
  const truePeakRef = useRef(0);
  const truePeakDecayRef = useRef(0);

  // Convex mutations and queries
  const createProject = useMutation(api.projects.createProject);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const updateProjectAudio = useMutation(api.projects.updateProjectAudio);
  const updateProjectSettings = useMutation(api.projects.updateProjectSettings);
  const projectData = useQuery(api.projects.getProject, 
    currentProjectId ? { projectId: currentProjectId } : "skip"
  );

  // 7-Band EQ (20Hz, 60Hz, 250Hz, 1kHz, 3kHz, 6kHz, 12kHz) - Default Flat
  const [eqBands, setEqBands] = useState([
    { frequency: 20, gain: 0, Q: 0.7 },
    { frequency: 60, gain: 0, Q: 0.7 },
    { frequency: 250, gain: 0, Q: 1.0 },
    { frequency: 1000, gain: 0, Q: 0.8 },
    { frequency: 3000, gain: 0, Q: 1.2 },
    { frequency: 6000, gain: 0, Q: 0.9 },
    { frequency: 12000, gain: 0, Q: 0.5 }
  ]);

  // Compressor Settings
  const [compressor, setCompressor] = useState({
    threshold: -24,
    ratio: 3,
    attack: 0.003,
    release: 0.25
  });

  // All other functions and state remain the same
  // Only showing the modified parts in the return statement

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
            
            {/* CHANGE 1: Replace Project ID with loading component */}
            {currentProjectId && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Loading...</span>
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
              {/* CHANGE 2: Add icons for Live EQ status */}
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-300">Live EQ Processing</h4>
                {isLiveEQEnabled ? (
                  <span className="text-green-400">🎛️</span>
                ) : (
                  <span className="text-red-400">🛑</span>
                )}
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
          {/* Rest of the controls remain the same */}
          
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
            
            {/* CHANGE 3: Only show Process & Download button when project is saved */}
            {currentProjectId && (
              <button
                onClick={() => setShowProcessDialog(true)}
                className="px-6 py-4 bg-red-600 text-white rounded font-mono font-bold hover:bg-red-700 border border-red-500"
                disabled={isProcessing}
              >
                PROCESS & DOWNLOAD
              </button>
            )}
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