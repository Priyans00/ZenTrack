import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/tasks', label: 'Tasks', icon: '📋' },
    { path: '/time', label: 'Time Tracker', icon: '⏰' },
    { path: '/spend', label: 'Spending', icon: '💰' },
    { path: '/about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <nav className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800 backdrop-blur-lg border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      <div className="flex items-center">
        <Link to="/" className="flex items-center text-white text-decoration-none font-bold text-xl transition-transform duration-300 hover:scale-105">
          <span className="text-2xl mr-2 animate-pulse-slow">⚡</span>
          <span className="bg-gradient-to-r from-white to-gray-100 text-gradient font-extrabold">ZenTrack</span>
        </Link>
      </div>
      
      <div className="flex gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-medium relative overflow-hidden group ${
              location.pathname === item.path 
                ? 'text-white bg-white/20 shadow-lg transform -translate-y-1' 
                : 'text-white/80 hover:text-white hover:bg-white/10 hover:transform hover:-translate-y-1 hover:shadow-md'
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-gradient-x transition-opacity duration-500"></span>
            <span className="text-lg relative z-10">{item.icon}</span>
            <span className="text-sm relative z-10 hidden sm:block">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
