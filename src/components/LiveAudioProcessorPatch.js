// This is a patch for LiveAudioProcessor.tsx
// To fix the "Project not found" error, modify the createProjectAndUpload function:

// 1. Always create a new project instead of trying to update an existing one
// Replace the entire createProjectAndUpload function with this:

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

    // Then update with settings
    await updateProjectSettings({
      projectId,
      eqSettings: eqBands,
      compressorSettings: compressor,
    });

    // Always upload the audio file if available
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
        duration: audioRef.current?.duration || 0,
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