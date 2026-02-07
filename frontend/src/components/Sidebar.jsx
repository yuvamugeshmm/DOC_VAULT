import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileSection from './ProfileSection';
import ProfileModal from './ProfileModal';

function Sidebar({ isOpen, onClose, user, onLogout, onUserUpdate, onUploadClick, onDocumentsClick, onAdminTabChange }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldBeOpen = isDesktop || isOpen;

  const menuItems = {
    student: [
      { id: 'dashboard', label: 'My Documents', icon: '📁', path: '/admin' },
      { id: 'upload', label: 'Upload', icon: '📤', path: '#upload' },
    ],
    admin: [
      { id: 'documents', label: 'All Documents', icon: '📄', path: '/admin' },
      { id: 'students', label: 'Manage Students', icon: '👥', path: '/admin' },
    ],
  };

  const currentRole = user?.role || 'student';
  const roleMenuItems = menuItems[currentRole] || [];

  const handleItemClick = (item) => {
    if (item.id === 'upload' && currentRole === 'student' && onUploadClick) {
      onUploadClick();
      onClose();
    } else if (item.id === 'dashboard' && currentRole === 'student' && onDocumentsClick) {
      onDocumentsClick();
      onClose();
    } else if (currentRole === 'admin' && onAdminTabChange) {
      onAdminTabChange(item.id);
      onClose();
    } else {
      navigate(item.path);
      onClose();
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={isDesktop ? 'open' : 'closed'}
        animate={shouldBeOpen ? 'open' : 'closed'}
        className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-xl z-50 lg:relative lg:translate-x-0 lg:opacity-100"
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-primary">Document Store</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-text-light hover:text-text transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Professional Profile Section */}
          <ProfileSection
            user={user}
            onEdit={() => setProfileModalOpen(true)}
          />

          {/* Profile Modal */}
          <ProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            user={user}
            onUpdate={(updatedUser) => {
              if (onUserUpdate) onUserUpdate(updatedUser);
              setProfileModalOpen(false);
            }}
          />

          {/* Menu Items */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {roleMenuItems.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {currentRole === 'student' || currentRole === 'admin' ? (
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === item.path && item.id !== 'upload'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text hover:bg-primary/5'
                        }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ) : item.path ? (
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === item.path
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text hover:bg-primary/5'
                        }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-text hover:bg-primary/5`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )}
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
