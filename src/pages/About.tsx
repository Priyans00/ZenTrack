const About = () => {
  const features = [
    {
      title: 'Task Management',
      description: 'Organize tasks with priorities, tags, due dates, and status tracking.',
      icon: '📋'
    },
    {
      title: 'Time Tracking',
      description: 'Monitor time spent on activities with detailed analytics.',
      icon: '⏰'
    },
    {
      title: 'Expense Management',
      description: 'Track income and expenses with category-wise breakdowns.',
      icon: '💰'
    },
    {
      title: 'Privacy First',
      description: 'All data is stored locally on your device for maximum privacy.',
      icon: '🔒'
    },
    {
      title: 'Cross Platform',
      description: 'Built with Tauri for native performance on all platforms.',
      icon: '🖥️'
    },
    {
      title: 'Modern UI',
      description: 'Beautiful, responsive interface built with React.',
      icon: '🎨'
    }
  ];

  const techStack = [
    { name: 'Tauri', description: 'Cross-platform desktop app framework', icon: '🦀' },
    { name: 'React', description: 'Frontend user interface library', icon: '⚛️' },
    { name: 'TypeScript', description: 'Type-safe JavaScript development', icon: '📘' },
    { name: 'Rust', description: 'Fast and secure backend processing', icon: '🦀' },
    { name: 'Vite', description: 'Lightning-fast build tool', icon: '⚡' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework', icon: '🎨' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center py-16 px-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-gradient">
          About ZenTrack
        </h1>
        <p className="text-xl text-gray-600 font-light">Your all-in-one productivity companion</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 pb-20 space-y-20">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-gray-800">Boost Your Productivity</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              ZenTrack is a comprehensive productivity application that helps you manage tasks, 
              track time, and monitor expenses all in one place. Built with modern technologies 
              for a fast, secure, and delightful user experience.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">100%</div>
                <div className="text-sm text-gray-600 font-medium">Privacy Focused</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600 font-medium">Data Collection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">∞</div>
                <div className="text-sm text-gray-600 font-medium">Possibilities</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">📊</div>
                <div className="font-bold text-gray-800">Analytics</div>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>75% Complete</span>
                  <span>⏰ 6h 30m</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack Section */}
        <section>
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Built With Modern Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{tech.icon}</div>
                  <h4 className="text-lg font-bold text-gray-800">{tech.name}</h4>
                </div>
                <p className="text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-12 text-white text-center">
          <div className="text-6xl mb-8">🔐</div>
          <h2 className="text-4xl font-bold mb-6">Your Privacy Matters</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            ZenTrack is designed with privacy as a core principle. All your data is stored 
            locally on your device and never sent to external servers. You have complete 
            control over your information.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-2xl mb-3">✅</div>
              <div className="font-semibold">Local data storage only</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-2xl mb-3">✅</div>
              <div className="font-semibold">No cloud synchronization required</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-2xl mb-3">✅</div>
              <div className="font-semibold">No telemetry or analytics</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-2xl mb-3">✅</div>
              <div className="font-semibold">Open source and transparent</div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Get In Touch</h2>
          <p className="text-xl text-gray-600 mb-12 font-light">Have questions or feedback? We'd love to hear from you!</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="https://github.com/Priyans00/zentrack" className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold">
              <span className="text-xl">📂</span>
              <span>View on GitHub</span>
            </a>
            <a href="mailto:support@zentrack.com" className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold">
              <span className="text-xl">📧</span>
              <span>Send Email</span>
            </a>
            <a href="#" className="flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-xl hover:bg-purple-700 transition-colors font-semibold">
              <span className="text-xl">📖</span>
              <span>Documentation</span>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center space-y-2 pt-12 border-t border-gray-200">
          <p className="text-gray-600">Made with ❤️ using Tauri and React</p>
          <p className="text-gray-500">© 2025 ZenTrack. Open source productivity tool.</p>
        </footer>
      </div>
    </div>
  );
};

export default About;
