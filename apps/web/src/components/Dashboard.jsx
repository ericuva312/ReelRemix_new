import React, { useState, useEffect } from 'react';
import ApiService from '../services/api.js';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [clips, setClips] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({});

  useEffect(() => {
    loadDashboard();
    
    // Poll for project updates every 5 seconds
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const userData = ApiService.getCurrentUser();
      setUser(userData);

      const response = await ApiService.getDashboardOverview();
      setStats(response.data);
      
      await loadProjects();
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await ApiService.request('/api/projects');
      setProjects(response.data);
      
      // Update processing status
      const status = {};
      response.data.forEach(project => {
        status[project.id] = {
          status: project.status,
          progress: project.progress || 0,
          error: project.error
        };
      });
      setProcessingStatus(status);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadProjectClips = async (projectId) => {
    try {
      const response = await ApiService.request(`/api/projects/${projectId}/clips`);
      setClips(response.data);
    } catch (err) {
      console.error('Error loading clips:', err);
      setClips([]);
    }
  };

  const handleSignOut = () => {
    ApiService.signout();
    window.location.href = '/';
  };

  const handleUploadVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          // Create project
          const response = await ApiService.request('/api/projects/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size
            })
          });

          clearInterval(progressInterval);
          setUploadProgress(100);
          
          if (response.success) {
            alert(`Video "${file.name}" uploaded successfully! AI processing has started. You'll see clips appear as they're generated.`);
            await loadDashboard(); // Refresh dashboard
            await loadProjects(); // Refresh projects
          }
        } catch (err) {
          alert(`Upload failed: ${err.message}`);
        } finally {
          setIsUploading(false);
          setTimeout(() => setUploadProgress(0), 2000);
        }
      }
    };
    input.click();
  };

  const handleViewProjects = () => {
    setCurrentView('projects');
    loadProjects();
  };

  const handleViewClips = async (project) => {
    setSelectedProject(project);
    setCurrentView('clips');
    await loadProjectClips(project.id);
  };

  const handleGenerateClips = () => {
    const completedProjects = projects.filter(p => p.status === 'completed');
    
    if (projects.length === 0) {
      alert('Please upload a video first to generate clips.');
      return;
    }
    
    if (completedProjects.length === 0) {
      alert('No completed projects available for clip generation. Please wait for your video to finish AI processing.');
      return;
    }
    
    alert(`You have ${completedProjects.length} completed project(s) with clips ready for download. Click "View Projects" to see them.`);
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project? All associated clips will also be deleted.')) {
      try {
        await ApiService.request(`/api/projects/${projectId}`, { method: 'DELETE' });
        alert('Project deleted successfully.');
        await loadDashboard();
        await loadProjects();
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleDownloadClip = async (clip) => {
    try {
      const response = await fetch(`${ApiService.baseURL}/api/clips/${clip.id}/download`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'analyzing': return '#f59e0b';
      case 'generating_clips': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'uploaded': return 'Uploaded';
      case 'analyzing': return 'AI Analyzing...';
      case 'generating_clips': return 'Generating Clips...';
      case 'completed': return 'Ready';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '24px 0' 
          }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              ReelRemix AI Dashboard
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#374151' }}>Welcome, {user?.name}</span>
              <span style={{ 
                backgroundColor: '#7c3aed', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }}>
                {stats?.stats?.creditsRemaining || 0} credits
              </span>
              <button 
                onClick={handleSignOut}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Progress */}
      {isUploading && (
        <div style={{ backgroundColor: '#fef3c7', padding: '12px 16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', color: '#92400e' }}>Uploading video... {uploadProgress}%</p>
          <div style={{ backgroundColor: '#fbbf24', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                backgroundColor: '#f59e0b', 
                height: '100%', 
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {currentView === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '24px', 
              marginBottom: '32px' 
            }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Total Projects</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {stats?.stats?.totalProjects || 0}
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Total Clips Generated</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {stats?.stats?.totalClips || 0}
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Credits Remaining</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {stats?.stats?.creditsRemaining || 0}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>10 credits per video</p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Plan</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0, textTransform: 'capitalize' }}>
                  {stats?.stats?.plan || 'Starter'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>AI Video Processing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <button 
                  onClick={handleUploadVideo}
                  disabled={isUploading}
                  style={{
                    backgroundColor: isUploading ? '#9ca3af' : '#7c3aed',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isUploading ? 'Uploading...' : '🎬 Upload Video for AI Analysis'}
                </button>
                <button 
                  onClick={handleViewProjects}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  📁 View All Projects
                </button>
                <button 
                  onClick={handleGenerateClips}
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✂️ Check Generated Clips
                </button>
              </div>
            </div>

            {/* Recent Projects with AI Status */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Recent Projects & AI Processing Status</h3>
              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} style={{ 
                      borderLeft: '4px solid #7c3aed', 
                      paddingLeft: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{project.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ 
                            backgroundColor: getStatusColor(project.status),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {getStatusText(project.status)}
                          </span>
                          {project.clips > 0 && (
                            <span style={{ color: '#059669', fontSize: '14px', fontWeight: '500' }}>
                              🎬 {project.clips} clips ready
                            </span>
                          )}
                        </div>
                        {project.status === 'analyzing' || project.status === 'generating_clips' ? (
                          <div style={{ width: '200px' }}>
                            <div style={{ backgroundColor: '#e5e7eb', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  backgroundColor: '#7c3aed', 
                                  height: '100%', 
                                  width: `${project.progress || 0}%`,
                                  transition: 'width 0.3s ease'
                                }}
                              ></div>
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                              AI Processing: {project.progress || 0}%
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {project.status === 'completed' && project.clips > 0 && (
                          <button
                            onClick={() => handleViewClips(project)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            View Clips
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>No projects yet. Upload your first video to see AI magic!</p>
                  <button
                    onClick={handleUploadVideo}
                    style={{
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Upload Video
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'projects' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>All Projects</h3>
              <button
                onClick={() => setCurrentView('dashboard')}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>
            </div>
            
            {projects.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {projects.map((project) => (
                  <div key={project.id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', margin: '0 0 8px 0' }}>{project.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ 
                          backgroundColor: getStatusColor(project.status),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {getStatusText(project.status)}
                        </span>
                        {project.clips > 0 && (
                          <span style={{ color: '#059669', fontSize: '14px', fontWeight: '500' }}>
                            {project.clips} clips generated
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                        {project.completedAt && ` • Completed: ${new Date(project.completedAt).toLocaleDateString()}`}
                      </p>
                      {project.error && (
                        <p style={{ fontSize: '14px', color: '#dc2626', margin: '4px 0 0 0' }}>
                          Error: {project.error}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {project.status === 'completed' && project.clips > 0 && (
                        <button
                          onClick={() => handleViewClips(project)}
                          style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          View {project.clips} Clips
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>No projects found.</p>
                <button
                  onClick={handleUploadVideo}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Upload Your First Video
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'clips' && selectedProject && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Clips from "{selectedProject.name}"
              </h3>
              <button
                onClick={() => setCurrentView('projects')}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Back to Projects
              </button>
            </div>
            
            {clips.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {clips.map((clip) => (
                  <div key={clip.id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '16px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ 
                      width: '100%', 
                      height: '120px', 
                      backgroundColor: '#7c3aed', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}>
                      🎬 {clip.title}
                    </div>
                    <h4 style={{ fontWeight: '600', margin: '0 0 8px 0' }}>{clip.title}</h4>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                      Duration: {clip.duration}s • Score: {(clip.score * 100).toFixed(0)}%
                    </p>
                    <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 12px 0', fontStyle: 'italic' }}>
                      "{clip.transcript.substring(0, 100)}..."
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDownloadClip(clip)}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          flex: 1
                        }}
                      >
                        Download Clip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ color: '#6b7280' }}>No clips generated yet for this project.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
