import { useRef, useState, useEffect } from 'react';
import * as React from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { EQ_PRESETS, PRESET_CATEGORIES } from './EQPresets';

// Simplified version that always creates a new project instead of updating
export default function LiveAudioProcessorSimple({ projectName = "", projectId = null }) {
  const [currentProjectName, setCurrentProjectName] = useState(projectName || "");
  const [currentProjectId, setCurrentProjectId] = useState<Id<"projects"> | null>(null); // Always start with null
  const [selectedPreset, setSelectedPreset] = useState("Default");
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileObj, setAudioFileObj] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Convex mutations
  const createProject = useMutation(api.projects.createProject);
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const updateProjectAudio = useMutation(api.projects.updateProjectAudio);
  const updateProjectSettings = useMutation(api.projects.updateProjectSettings);
  
  // Load initial project data if provided
  const projectData = useQuery(api.projects.getProject, 
    projectId ? { projectId } : "skip"
  );
  
  useEffect(() => {
    if (projectData) {
      // Set project name
      if (projectData.name) {
        setCurrentProjectName(projectData.name);
      }
      
      // Set preset
      if (projectData.eqPreset) {
        setSelectedPreset(projectData.eqPreset);
      }
      
      // Set audio file if available
      if (projectData.originalAudioUrl) {
        setAudioFile(projectData.originalAudioUrl);
      }
    }
  }, [projectData]);
  
  const createProjectAndUpload = async () => {
    if (!currentProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!audioFileObj && !audioFile) {
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

      // Upload the audio file if available
      if (audioFileObj) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file
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
          duration: 0, // You would get this from your audio element
          fileSize: audioFileObj.size,
        });
      }

      toast.success("Project saved successfully!");
    } catch (error) {
      toast.error("Failed to save project. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">Audio Processor</h2>
      
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
        </div>
      </div>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
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
          }}
          className="mb-4 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-600 file:text-sm file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700"
        />
        
        {audioFile && (
          <audio
            src={audioFile}
            className="w-full"
            controls
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {/* Save Project Button */}
        <button
          onClick={createProjectAndUpload}
          className="px-6 py-4 bg-blue-600 text-white rounded font-mono font-bold hover:bg-blue-700 border border-blue-500"
          disabled={isProcessing || !currentProjectName.trim() || (!audioFileObj && !audioFile)}
        >
          SAVE AS NEW PROJECT
        </button>
      </div>
    </div>
  );
}