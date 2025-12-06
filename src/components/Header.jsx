import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  LogOut,
  LayoutDashboard,
  Wrench,
  FolderOpen,
  CreditCard,
  Shield,
  Menu,
  X,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  // Navigation links based on authentication status
  const navLinks = user
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/tools', label: 'Tools', icon: Wrench },
        { path: '/files', label: 'My Files', icon: FolderOpen },
        { path: '/pricing', label: 'Pricing', icon: CreditCard },
        ...(user.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
      ]
    : [
        { path: '/', label: 'Home' },
        { path: '/tools', label: 'Tools' },
        { path: '/pricing', label: 'Pricing' },
        { path: '/faq', label: 'FAQ' },
      ];

  // Get user's plan name with fallback
  const getUserPlan = () => {
    if (!user) return 'Free Plan';
    
    if (user.planName) {
      return `${user.planName} Plan`;
    }
    
    if (user.plan === 'free') return 'Free Plan';
    if (user.plan === 'pro') return 'Pro Plan';
    if (user.plan === 'business') return 'Business Plan';
    
    return 'Free Plan';
  };

  // Get user's display name or initial
  const getUserDisplay = () => {
    if (!user) return { name: 'Guest', initial: 'G' };
    
    const name = user.name || user.email?.split('@')[0] || 'User';
    const initial = name.charAt(0).toUpperCase();
    
    return { name, initial };
  };

  // Don't render anything until we know if we're on client side and auth is loaded
  if (!isClient || loading) {
    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-purple-200/50 bg-white/70 backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">PDF Works</h1>
          </div>

          {/* Loading state for user info */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 animate-pulse">
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </motion.header>
    );
  }

  const { name: userName, initial: userInitial } = getUserDisplay();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-purple-200/50 bg-white/70 backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link 
            to={user ? "/dashboard" : "/"} 
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">PDF Works</h1>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                className={
                  location.pathname === link.path
                    ? 'text-purple-600 bg-purple-100'
                    : 'text-gray-700 hover:text-purple-600'
                }
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Plan Info - Desktop only */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200">
                <span className="text-sm font-medium text-purple-900">
                  {getUserPlan()}
                </span>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {userInitial}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-xs text-purple-600 font-medium mt-1">
                        {getUserPlan()}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/pricing')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Plans
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-purple-700 hover:text-purple-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white shadow-lg border-t border-purple-200 flex flex-col px-6 py-4 gap-3"
        >
          {/* Profile Center in Mobile */}
          {user && (
            <div className="flex flex-col items-center mb-3 p-4 bg-purple-50 rounded-lg">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                {userInitial}
              </div>
              <span className="font-medium mt-2 text-gray-900">{userName}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
              <span className="text-sm text-purple-600 font-medium mt-1">
                {getUserPlan()}
              </span>
            </div>
          )}

          {/* Nav Links - Left Aligned */}
          <div className="flex flex-col items-start gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons for Non-Logged Users */}
          {!user && (
            <div className="flex flex-col gap-3 mt-3 w-full">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Additional Links for Logged Users */}
          {user && (
            <>
              <div className="border-t border-gray-200 pt-3 mt-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-3 px-4 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/pricing');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-3 px-4 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Billing & Plans
                </button>
              </div>
              
              {/* Logout Button for Logged Users */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full mt-3 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;