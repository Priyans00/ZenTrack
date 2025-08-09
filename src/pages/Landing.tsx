import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: '📋',
      title: 'Task Management',
      description: 'Organize your tasks with priorities, tags, and deadlines.',
      link: '/tasks',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: '⏰',
      title: 'Time Tracking',
      description: 'Track time spent on activities and boost productivity.',
      link: '/time',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: '💰',
      title: 'Expense Tracking',
      description: 'Monitor your spending and manage your budget effectively.',
      link: '/spend',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Get insights into your productivity and spending patterns.',
      link: '/about',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="min-h-screen gradient-primary overflow-hidden relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative text-center px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-72 h-72 bg-white/10 rounded-full top-20 left-20 animate-float"></div>
          <div className="absolute w-48 h-48 bg-white/10 rounded-full top-60 right-32 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute w-36 h-36 bg-white/10 rounded-full bottom-32 left-40 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="max-w-4xl z-10 relative">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 text-gradient animate-gradient-x">ZenTrack</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed font-light max-w-3xl mx-auto">
            Your all-in-one productivity companion for managing tasks, tracking time, and monitoring expenses.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/tasks" 
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-2xl shadow-yellow-500/25 hover:shadow-yellow-500/40 inline-flex items-center gap-3 text-lg px-8 py-4"
            >
              Get Started
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link 
              to="/about" 
              className="btn-secondary border-white/30 text-white glass-effect hover:bg-white/20 text-lg px-8 py-4"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-5xl font-extrabold text-center mb-16 bg-gradient-to-r from-blue-600 to-purple-600 text-gradient">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="group card hover:scale-105 relative overflow-hidden border-t-4 border-transparent hover:border-gradient"
                style={{ borderImage: `linear-gradient(45deg, var(--tw-gradient-stops)) 1`, borderImageSlice: 1 }}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                <div className="text-4xl mb-6 block">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <div className={`text-transparent bg-gradient-to-r ${feature.color} text-gradient font-semibold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300`}>
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-pink-500 to-violet-600 py-16 text-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-8">
              <div className="text-4xl font-extrabold mb-2">∞</div>
              <div className="text-lg opacity-90 font-medium">Tasks Managed</div>
            </div>
            <div className="p-8">
              <div className="text-4xl font-extrabold mb-2">24/7</div>
              <div className="text-lg opacity-90 font-medium">Time Tracking</div>
            </div>
            <div className="p-8">
              <div className="text-4xl font-extrabold mb-2">100%</div>
              <div className="text-lg opacity-90 font-medium">Privacy Focused</div>
            </div>
            <div className="p-8">
              <div className="text-4xl font-extrabold mb-2">⚡</div>
              <div className="text-lg opacity-90 font-medium">Lightning Fast</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
