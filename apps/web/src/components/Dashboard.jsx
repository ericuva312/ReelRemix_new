import React, { useState, useEffect } from 'react';
import ApiService from '../services/api.js';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userData = ApiService.getCurrentUser();
        setUser(userData);

        const response = await ApiService.getDashboardOverview();
        setStats(response.data);
        
        // Mock projects data for now
        setProjects([
          {
            id: 1,
            name: "Marketing Video Q4",
            status: "completed",
            clips: 5,
            duration: "15:30",
            created: "2024-01-15"
          },
          {
            id: 2,
            name: "Product Demo",
            status: "processing",
            clips: 0,
            duration: "8:45",
            created: "2024-01-14"
          }
        ]);
      } catch (err) {
        setError(err.message);
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleSignOut = () => {
    ApiService.signout();
    window.location.href = '/';
  };

  const handleUploadVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              alert(`Video "${file.name}" uploaded successfully! Processing will begin shortly.`);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }
    };
    input.click();
  };

  const handleViewProjects = () => {
    setCurrentView('projects');
  };

  const handleGenerateClips = () => {
    if (projects.length === 0) {
      alert('Please upload a video first to generate clips.');
      return;
    }
    
    const projectToProcess = projects.find(p => p.status === 'completed');
    if (!projectToProcess) {
      alert('No completed projects available for clip generation. Please wait for your video to finish processing.');
      return;
    }
    
    alert(`Generating clips for "${projectToProcess.name}"... This may take a few minutes.`);
    // Here you would integrate with your actual clip generation API
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleDeleteProject = (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId));
      alert('Project deleted successfully.');
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

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px' }}>
            Error Loading Dashboard
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
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
              ReelRemix Dashboard
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#374151' }}>Welcome, {user?.name}</span>
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
                  {projects.length}
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Total Clips</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {projects.reduce((total, project) => total + project.clips, 0)}
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Credits Remaining</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {stats?.creditsRemaining || user?.credits || 100}
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Plan</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0, textTransform: 'capitalize' }}>
                  {stats?.plan || user?.plan || 'Starter'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <button 
                  onClick={handleUploadVideo}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
                >
                  Upload New Video
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
                    fontSize: '16px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  View Projects
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
                    fontSize: '16px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                >
                  Generate Clips
                </button>
              </div>
            </div>

            {/* Recent Projects */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Recent Projects</h3>
              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} style={{ borderLeft: '4px solid #7c3aed', paddingLeft: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{project.name}</h4>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          {project.clips} clips • {project.duration} • {project.status}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: '#6b7280' }}>No projects yet. Create your first project to get started!</p>
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
                onClick={handleBackToDashboard}
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
                    <div>
                      <h4 style={{ fontWeight: '600', margin: '0 0 8px 0' }}>{project.name}</h4>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                        Duration: {project.duration} • Created: {project.created}
                      </p>
                      <p style={{ fontSize: '14px', margin: 0 }}>
                        <span style={{ 
                          backgroundColor: project.status === 'completed' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {project.status}
                        </span>
                        {project.clips > 0 && <span style={{ marginLeft: '8px', color: '#6b7280' }}>{project.clips} clips generated</span>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {project.status === 'completed' && (
                        <button
                          onClick={() => alert(`Viewing clips for ${project.name}`)}
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
