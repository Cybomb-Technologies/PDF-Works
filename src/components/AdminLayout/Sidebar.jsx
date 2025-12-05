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
      position: 'fixed', // ✅ CHANGED TO FIXED
      top: 0, // ✅ ADDED
      left: 0, // ✅ ADDED
      overflow: 'hidden',
      zIndex: 1000 // ✅ ADDED to ensure it stays above other content
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

  // Icon components
  const DashboardIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.02 3.02 0 0 0 16.95 6h-2.66c-.94 0-1.82.52-2.27 1.35L9.46 13H12v10h8zm-7.5-10.5l1.35-4.23c.12-.37.47-.63.87-.63h2.66c.4 0 .75.26.87.63L19.5 11.5h-7zM4 11c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-1 9v-6H.5L3 7.97 5.5 14H4v6H3z" />
    </svg>
  );

  const BlogIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
    </svg>
  );

  const PressReleaseIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );

  const PricingIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );

  const ContactIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );

  const handleMouseEnter = (e) => {
    e.target.parentNode.style.transform = 'translateX(8px)';
    e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.2)';
  };

  const handleMouseLeave = (e) => {
    e.target.parentNode.style.transform = 'translateX(0)';
    e.target.parentNode.style.background = 'rgba(255, 255, 255, 0.1)';
  };

  const PaymentIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V7H9V5.5L3 7V9L9 10.5V12L3 13.5V15.5L9 14V16L3 17.5V19.5L9 18V22H15V18L21 19.5V17.5L15 16V14L21 15.5V13.5L15 12V10.5L21 9Z" />
    </svg>
  );


   const TopupIcon = () => (
    <svg style={sidebarStyle.menuIcon} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
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
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <DashboardIcon />
              Dashboard
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/users"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <UsersIcon />
              Users
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/blog-management"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <BlogIcon />
              Blog Management
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/press-release"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <PressReleaseIcon />
              Press Releases
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/contact-details"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ContactIcon />
              Contact Details
            </Link>
          </li>
          {/* New Pricing Management Section */}
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/pricing"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <PricingIcon />
              Pricing Management
            </Link>
          </li>

           <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/topup"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <TopupIcon />
              Topup Management
            </Link>
          </li>

          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/payments"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <PaymentIcon />
              Payment Management
            </Link>
          </li>
          <li style={sidebarStyle.menuItem}>
            <Link
              to="/admin/settings"
              style={sidebarStyle.menuLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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