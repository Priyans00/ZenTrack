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
      color: 'teal'
    },
    {
      title: 'Time Tracking',
      description: 'Monitor time spent on activities with detailed analytics.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Expense Management',
      description: 'Track income and expenses with category-wise breakdowns.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'coral'
    },
    {
      title: 'Privacy First',
      description: 'All data is stored locally on your device for maximum privacy.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      title: 'Cross Platform',
      description: 'Built with Tauri for native performance on all platforms.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'yellow'
    },
    {
      title: 'Modern UI',
      description: 'Beautiful, responsive interface built with React.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      color: 'pink'
    }
  ];

  const techStack = [
    { name: 'Tauri', description: 'Cross-platform desktop app framework', color: 'coral' },
    { name: 'React', description: 'Frontend user interface library', color: 'blue' },
    { name: 'TypeScript', description: 'Type-safe JavaScript development', color: 'purple' },
    { name: 'Rust', description: 'Fast and secure backend processing', color: 'coral' },
    { name: 'Vite', description: 'Lightning-fast build tool', color: 'yellow' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework', color: 'teal' }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      teal: { bg: 'bg-accent-teal/20', text: 'text-accent-teal' },
      blue: { bg: 'bg-accent-blue/20', text: 'text-accent-blue' },
      coral: { bg: 'bg-accent-coral/20', text: 'text-accent-coral' },
      purple: { bg: 'bg-accent-purple/20', text: 'text-accent-purple' },
      yellow: { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow' },
      pink: { bg: 'bg-accent-pink/20', text: 'text-accent-pink' },
    };
    return colors[color] || colors.teal;
  };

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6 lg:p-8 pt-20 md:pt-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">About ZenTrack</h1>
        <p className="text-gray-500 text-base sm:text-lg">Your all-in-one productivity companion</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Boost Your Productivity</h2>
            <p className="text-gray-400 leading-relaxed">
              ZenTrack is a comprehensive productivity application that helps you manage tasks, 
              track time, and monitor expenses all in one place. Built with modern technologies 
              for a fast, secure, and delightful user experience.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card text-center">
                <div className="text-2xl font-bold text-accent-teal">100%</div>
                <div className="text-xs text-gray-500 font-medium">Privacy</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-2xl font-bold text-accent-blue">0</div>
                <div className="text-xs text-gray-500 font-medium">Data Sent</div>
              </div>
              <div className="stat-card text-center">
                <div className="text-2xl font-bold text-accent-purple">∞</div>
                <div className="text-xs text-gray-500 font-medium">Possibilities</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="panel relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">Analytics Preview</span>
              </div>
              <div className="space-y-3">
                <div className="progress-bar">
                  <div className="h-full bg-gradient-to-r from-accent-teal to-accent-blue rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">75% Complete</span>
                  <span className="text-accent-teal">6h 30m</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-2xl font-bold text-white text-center mb-8">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const colors = getColorClasses(feature.color);
              return (
                <div key={index} className="panel group hover:border-dark-border transition-all duration-200">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className={colors.text}>{feature.icon}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tech Stack Section */}
        <section>
          <h2 className="text-2xl font-bold text-white text-center mb-8">Built With Modern Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, index) => {
              const colors = getColorClasses(tech.color);
              return (
                <div key={index} className="panel group hover:border-dark-border transition-all duration-200 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className={`${colors.text} font-bold`}>{tech.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{tech.name}</h4>
                    <p className="text-gray-500 text-sm">{tech.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy Section */}
        <section className="panel bg-gradient-to-br from-dark-card to-dark-secondary border-accent-teal/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-teal/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Your Privacy Matters</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              ZenTrack is designed with privacy as a core principle. All your data is stored 
              locally on your device and never sent to external servers.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              'Local data storage only',
              'No cloud sync required',
              'No telemetry or analytics',
              'Open source and transparent'
            ].map((item, index) => (
              <div key={index} className="bg-dark-card-hover border border-dark-border rounded-xl p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Get In Touch</h2>
          <p className="text-gray-500 mb-8">Have questions or feedback? We'd love to hear from you!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/Priyans00/zentrack" 
              className="flex items-center justify-center gap-3 bg-dark-card border border-dark-border hover:border-gray-600 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
            <a 
              href="mailto:p.sprout.108@gmail.com" 
              className="flex items-center justify-center gap-3 bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Email
            </a>
            <a 
              href="https://bitlist.vercel.app/" 
              className="flex items-center justify-center gap-3 bg-accent-purple hover:bg-accent-purple/90 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Documentation
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-dark-border space-y-2">
          <p className="text-gray-400">Made with ❤️ using Tauri and React by PRIYANS</p>
          <p className="text-gray-500 text-sm">© 2025 ZenTrack. Open source productivity tool.</p>
        </footer>
      </div>
    </div>
  );
};

export default About;
