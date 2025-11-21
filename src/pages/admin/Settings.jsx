import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      name: 'Admin User',
      email: 'admin@pdfworks.in',
      phone: '+91 9715092104',
      avatar: ''
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: true,
      monthlyReports: true
    },
    preferences: {
      language: 'english',
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light'
    }
  });

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = (section) => {
    // Simulate API call
    console.log(`Saving ${section} settings:`, settings[section]);
    alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
  };

  // Internal CSS Styles
  const styles = {
    container: {
      padding: '30px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '20px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    tabsContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      borderBottom: '2px solid #f1f5f9',
      paddingBottom: '10px',
      flexWrap: 'wrap'
    },
    tab: {
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      background: 'transparent',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#64748b'
    },
    activeTab: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
    },
    section: {
      display: activeTab === 'profile' ? 'block' : 'none'
    },
    formGroup: {
      marginBottom: '25px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#374151',
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      outline: 'none',
      background: 'white',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    avatarContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px'
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    avatarButton: {
      padding: '10px 20px',
      border: '2px dashed #667eea',
      borderRadius: '10px',
      background: 'rgba(102, 126, 234, 0.1)',
      color: '#667eea',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500'
    },
    avatarButtonHover: {
      background: '#667eea',
      color: 'white'
    },
    button: {
      padding: '15px 30px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
    },
    buttonHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)'
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '15px',
      background: '#f8fafc',
      borderRadius: '10px',
      transition: 'all 0.3s ease'
    },
    checkbox: {
      width: '20px',
      height: '20px',
      accentColor: '#667eea'
    },
    select: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      background: 'white',
      outline: 'none',
      transition: 'all 0.3s ease'
    },
    selectFocus: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '25px'
    },
    dangerZone: {
      background: 'linear-gradient(135deg, #fee 0%, #fdd 100%)',
      border: '2px solid #fecaca',
      borderRadius: '15px',
      padding: '25px',
      marginTop: '30px'
    },
    dangerButton: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '15px',
      textAlign: 'center',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 5px 0'
    },
    statLabel: {
      fontSize: '14px',
      opacity: '0.9',
      margin: 0
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'preferences', label: 'Preferences' }
  ];

  return (
    <AdminLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Settings</h1>
        </div>

        {/* Statistics Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>1,234</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>89%</div>
            <div style={styles.statLabel}>System Uptime</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>256</div>
            <div style={styles.statLabel}>PDFs Processed Today</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>24</div>
            <div style={styles.statLabel}>Active Sessions</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.tabsContainer}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id && styles.activeTab)
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div style={styles.grid}>
              <div>
                <div style={styles.avatarContainer}>
                  <div style={styles.avatar}>
                    {settings.profile.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <button
                    style={styles.avatarButton}
                    onMouseEnter={(e) => {
                      Object.assign(e.target.style, styles.avatarButtonHover);
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = styles.avatarButton.background;
                      e.target.style.color = styles.avatarButton.color;
                    }}
                  >
                    Change Avatar
                  </button>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={settings.profile.name}
                    onChange={(e) => handleInputChange('profile', 'name', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    style={styles.input}
                    value={settings.profile.email}
                    onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    style={styles.input}
                    value={settings.profile.phone}
                    onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  style={styles.button}
                  onClick={() => handleSaveSettings('profile')}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = styles.button.boxShadow;
                  }}
                >
                  Update Profile
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Profile Information</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
                  Keep your profile information up to date. This helps in maintaining proper communication and account security.
                </p>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#374151' }}>Last Login</h4>
                  <p style={{ color: '#64748b', margin: 0 }}>Today at 09:30 AM from IP 192.168.1.1</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#374151' }}>Account Created</h4>
                  <p style={{ color: '#64748b', margin: 0 }}>January 15, 2024</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div style={styles.grid}>
              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Change Password</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current Password</label>
                  <input
                    type="password"
                    style={styles.input}
                    value={settings.security.currentPassword}
                    onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    style={styles.input}
                    value={settings.security.newPassword}
                    onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    style={styles.input}
                    value={settings.security.confirmPassword}
                    onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.input.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  style={styles.button}
                  onClick={() => handleSaveSettings('security')}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = styles.button.boxShadow;
                  }}
                >
                  Update Password
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Security Recommendations</h3>
                <ul style={{ color: '#64748b', lineHeight: '1.8', paddingLeft: '20px' }}>
                  <li>Use a strong, unique password</li>
                  <li>Enable two-factor authentication</li>
                  <li>Regularly review login activity</li>
                  <li>Keep your recovery email up to date</li>
                  <li>Avoid using public Wi-Fi for admin access</li>
                </ul>

                <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#0369a1' }}>Two-Factor Authentication</h4>
                  <p style={{ color: '#64748b', marginBottom: '15px' }}>Add an extra layer of security to your account</p>
                  <button style={{ ...styles.button, background: '#0369a1' }}>Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div style={styles.grid}>
              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Notification Preferences</h3>
                
                <div style={styles.checkboxGroup}>
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <label key={key} style={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={value}
                        onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                      />
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  style={styles.button}
                  onClick={() => handleSaveSettings('notifications')}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = styles.button.boxShadow;
                  }}
                >
                  Save Preferences
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Notification Settings</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
                  Control how and when you receive notifications. You can customize your preferences for different types of alerts and updates.
                </p>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#374151' }}>Recent Activity</h4>
                  <p style={{ color: '#64748b', margin: 0 }}>Last notification sent: Today at 08:45 AM</p>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div style={styles.grid}>
              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Platform Preferences</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Language</label>
                  <select
                    style={styles.select}
                    value={settings.preferences.language}
                    onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.select.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Timezone</label>
                  <select
                    style={styles.select}
                    value={settings.preferences.timezone}
                    onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.select.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="UTC-5">UTC-5 (Eastern Time)</option>
                    <option value="UTC-6">UTC-6 (Central Time)</option>
                    <option value="UTC-7">UTC-7 (Mountain Time)</option>
                    <option value="UTC-8">UTC-8 (Pacific Time)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Date Format</label>
                  <select
                    style={styles.select}
                    value={settings.preferences.dateFormat}
                    onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.select.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Theme</label>
                  <select
                    style={styles.select}
                    value={settings.preferences.theme}
                    onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = styles.select.borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <button
                  style={styles.button}
                  onClick={() => handleSaveSettings('preferences')}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = styles.button.boxShadow;
                  }}
                >
                  Save Preferences
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: '20px', color: '#374151' }}>Appearance & Behavior</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
                  Customize how the admin panel looks and behaves according to your preferences. These settings affect your personal view only.
                </p>
                
                <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#0369a1' }}>Quick Actions</h4>
                  <p style={{ color: '#64748b', margin: 0 }}>Customize your dashboard with quick action buttons for frequently used features.</p>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div style={styles.dangerZone}>
            <h3 style={{ color: '#dc2626', marginBottom: '15px' }}>Danger Zone</h3>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>
              These actions are irreversible. Please proceed with caution.
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <button style={styles.dangerButton}>
                Clear All Data
              </button>
              <button style={styles.dangerButton}>
                Deactivate Account
              </button>
              <button style={styles.dangerButton}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;