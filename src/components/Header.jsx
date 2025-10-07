import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LogOut, LayoutDashboard, Wrench, FolderOpen, CreditCard, Shield } from 'lucide-react';
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-purple-200/50"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to={user ? "/" : "/"} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">PDF Pro</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}>
                <Button variant="ghost" className={location.pathname === link.path ? 'text-purple-600 bg-purple-100' : ''}>
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
                <span className="text-sm font-medium text-purple-900">
                  {user?.plan === 'free' ? 'Free Plan' : user?.plan === 'pro' ? 'Pro Plan' : 'Business Plan'}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/pricing')}>
                    Billing & Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
