import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { AudioPreviewButton } from "./AudioPreviewButton";

export function ProjectsPage({ navigateToProcessor }) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [presetFilter, setPresetFilter] = useState<string>("");
  
  const projects = useQuery(api.projects.listProjects, {
    status: statusFilter || undefined,
    eqPreset: presetFilter || undefined,
  });
  const eqPresets = useQuery(api.eqPresets.listActivePresets);
  const deleteProject = useMutation(api.projects.deleteProject);

  const handleDelete = async (projectId: any) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject({ projectId });
        toast.success("Project deleted successfully");
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Your Projects</h1>
        <p className="text-gray-300">Manage and download your mastered tracks</p>
      </div>

      {/* Filters */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="uploading">Uploading</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Filter by EQ Preset
            </label>
            <select
              value={presetFilter}
              onChange={(e) => setPresetFilter(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
            >
              <option value="">All Presets</option>
              {eqPresets?.map((preset) => (
                <option key={preset._id} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("");
                setPresetFilter("");
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
        {projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Project</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">EQ Preset</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Size</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Created</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {projects.map((project) => (
                  <tr key={project._id} className="hover:bg-black/20">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{project.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                        {project.eqPreset}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "completed" 
                          ? "bg-green-600/20 text-green-400"
                          : project.status === "processing"
                          ? "bg-yellow-600/20 text-yellow-400"
                          : project.status === "failed"
                          ? "bg-red-600/20 text-red-400"
                          : "bg-blue-600/20 text-blue-400"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatFileSize(project.fileSize || 0)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(project._creationTime)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {project.originalAudioUrl && (
                          <AudioPreviewButton
                            url={project.originalAudioUrl}
                            title="Play Original"
                            icon="🎵"
                            color="blue"
                          />
                        )}
                        {project.masteredAudioUrl && (
                          <AudioPreviewButton
                            url={project.masteredAudioUrl}
                            title="Play Mastered"
                            icon="🎧"
                            color="green"
                          />
                        )}
                        {project.masteredAudioUrl && (
                          <button
                            onClick={() => handleDownload(
                              project.masteredAudioUrl!,
                              `${project.name}_mastered.mp3`
                            )}
                            className="p-2 text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-lg transition-colors"
                            title="Download Mastered"
                          >
                            ⬇️
                          </button>
                        )}
                        <button
                          onClick={() => navigateToProcessor({ 
                            projectName: project.name,
                            projectId: project._id
                          })}
                          className="p-2 text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Continue in Live EQ"
                        >
                          🎛️
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          className="p-2 text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-gray-300">
              {statusFilter || presetFilter 
                ? "Try adjusting your filters or create a new project"
                : "Upload your first track to get started"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}