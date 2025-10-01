import React from 'react';

const Home = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 0' 
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed', margin: 0 }}>
              ReelRemix
            </h1>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a 
                href="/auth" 
                style={{ 
                  color: '#374151', 
                  textDecoration: 'none',
                  padding: '8px 16px'
                }}
              >
                Sign In
              </a>
              <a 
                href="/auth?mode=signup" 
                style={{ 
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px'
                }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            AI-Powered Video Editing
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: '#6b7280', 
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px auto'
          }}>
            Transform your long-form videos into viral clips with the power of artificial intelligence. 
            Create engaging content in minutes, not hours.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/auth?mode=signup"
              style={{
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              Start Creating
            </a>
            <a 
              href="/auth"
              style={{
                backgroundColor: 'white',
                color: '#7c3aed',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '600',
                border: '2px solid #7c3aed'
              }}
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px', 
          marginTop: '80px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#7c3aed', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span style={{ color: 'white', fontSize: '24px' }}>🎬</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              AI Video Analysis
            </h3>
            <p style={{ color: '#6b7280' }}>
              Our AI analyzes your videos to identify the most engaging moments automatically.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#7c3aed', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span style={{ color: 'white', fontSize: '24px' }}>✂️</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              Smart Clipping
            </h3>
            <p style={{ color: '#6b7280' }}>
              Generate multiple viral-ready clips from a single long-form video in seconds.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#7c3aed', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span style={{ color: 'white', fontSize: '24px' }}>🚀</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              Instant Export
            </h3>
            <p style={{ color: '#6b7280' }}>
              Export your clips in multiple formats optimized for different social platforms.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
