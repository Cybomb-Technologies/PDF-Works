import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const sidebarStyle = {
    sidebar: {
      width: '280px',
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '25px 20px',
      boxShadow: '8px 0 25px rgba(0, 0, 0, 0.1)',
      color: 'white',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    },
    sidebarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.1)',
      zIndex: 1
    },
    content: {
      position: 'relative',
      zIndex: 2
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '40px',
      textAlign: 'center',
      paddingBottom: '20px',
      borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    menuList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    menuItem: {
      marginBottom: '12px',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    menuLink: {
      display: 'block',
      padding: '16px 20px',
      color: 'white',
      textDecoration: 'none',
      fontWeight: '500',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      position: 'relative',
      paddingLeft: '50px'
    },
    menuIcon: {
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '20px',
      opacity: '0.8'
    },
    hoverEffect: {
      ':hover': {
        transform: 'translateX(8px)',
        background: 'rgba(255, 255, 255, 0.2)'
      }
    }
  };

  // Icon components (using simple SVG icons)
  const DashboardIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );

  const UsersIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.02 3.02 0 0 0 16.95 6h-2.66c-.94 0-1.82.52-2.27 1.35L9.46 13H12v10h8zm-7.5-10.5l1.35-4.23c.12-.37.47-.63.87-.63h2.66c.4 0 .75.26.87.63L19.5 11.5h-7zM4 11c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-1 9v-6H.5L3 7.97 5.5 14H4v6H3z"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  );

  return (
    <div style={sidebarStyle.sidebar}>
      <div style={sidebarStyle.sidebarOverlay}></div>
      <div style={sidebarStyle.content}>
        <h2 style={sidebarStyle.title}>Admin Panel</h2>
        <ul style={sidebarStyle.menuList}>
          <li style={sidebarStyle.menuItem}>
            <Link 
              to="/admin/dashboard" 
              style={sidebarStyle.menuLink}
              onMouseEnter={(e) => {
                e.target.parentNode.style.transform = 'translateX(8px)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.parentNode.style.transform = 'translateX(0)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <DashboardIcon />
              Dashboard
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link 
              to="/admin/users" 
              style={sidebarStyle.menuLink}
              onMouseEnter={(e) => {
                e.target.parentNode.style.transform = 'translateX(8px)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.parentNode.style.transform = 'translateX(0)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <UsersIcon />
              Users
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link 
              to="/admin/settings" 
              style={sidebarStyle.menuLink}
              onMouseEnter={(e) => {
                e.target.parentNode.style.transform = 'translateX(8px)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.parentNode.style.transform = 'translateX(0)';
                e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <SettingsIcon />
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;