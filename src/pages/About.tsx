const About = () => {
  const features = [
    {
      title: 'Task Management',
      description: 'Organize tasks with priorities, tags, due dates, and status tracking.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Time Tracking',
      description: 'Monitor time spent on activities with detailed analytics.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Expense Management',
      description: 'Track income and expenses with category-wise breakdowns.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Privacy First',
      description: 'All data is stored locally on your device for maximum privacy.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Cross Platform',
      description: 'Built with Tauri for native performance on all platforms.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Modern UI',
      description: 'Beautiful, responsive interface built with React.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    }
  ];

  const techStack = [
    { name: 'Tauri', description: 'Cross-platform desktop app framework' },
    { name: 'React', description: 'Frontend user interface library' },
    { name: 'TypeScript', description: 'Type-safe JavaScript development' },
    { name: 'Rust', description: 'Fast and secure backend processing' },
    { name: 'Vite', description: 'Lightning-fast build tool' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework' }
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>About ZenTrack</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-base sm:text-lg">Your all-in-one productivity companion</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Boost Your Productivity</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
              ZenTrack is a comprehensive productivity application that helps you manage tasks, 
              track time, and monitor expenses all in one place. Built with modern technologies 
              for a seamless experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="badge badge-primary">Open Source</span>
              <span className="badge badge-neutral">Privacy Focused</span>
              <span className="badge badge-neutral">Cross Platform</span>
            </div>
          </div>
          <div 
            className="rounded-2xl p-8 text-center"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div 
              className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-glow"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span className="text-5xl font-bold text-black">Z</span>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Zen<span style={{ color: 'var(--accent)' }}>Track</span>
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>Version 1.0.0</p>
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="panel group"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: 'var(--accent-dim)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>{feature.icon}</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Built With</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, index) => (
              <div 
                key={index} 
                className="text-center p-4 rounded-xl transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h4 className="font-semibold mb-1" style={{ color: 'var(--accent)' }}>{tech.name}</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tech.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-8">
          <p style={{ color: 'var(--text-muted)' }}>
            Made with ❤️ for productivity enthusiasts
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
