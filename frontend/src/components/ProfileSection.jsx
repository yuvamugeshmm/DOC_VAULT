import { motion } from 'framer-motion';
import { useState } from 'react';

function ProfileSection({ user, onEdit }) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const profilePhotoUrl = user?.profilePhoto 
    ? `/api/profile/photo?t=${Date.now()}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-xl p-4 mb-6 border border-white/30"
    >
      {/* Profile Photo */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
            {profilePhotoUrl && !imageError ? (
              <img
                src={profilePhotoUrl}
                alt={user?.name || 'Profile'}
                className="w-full h-full rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{getInitials(user?.name || user?.studentId)}</span>
            )}
          </div>
          {onEdit && (
            <motion.button
              onClick={onEdit}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-primary-dark transition-colors group"
              title="Edit Profile & Upload Photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Edit Profile
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Student Name */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-text mb-1">
          {user?.name || user?.studentId || 'Student'}
        </h3>
        <p className="text-sm text-text-light">ID: {user?.studentId}</p>
      </div>

      {/* Profile Details */}
      <div className="space-y-3 border-t border-gray-200/50 pt-4">
        {user?.department && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Department</p>
              <p className="text-sm font-semibold text-text truncate">{user.department}</p>
            </div>
          </div>
        )}

        {user?.year && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Year</p>
              <p className="text-sm font-semibold text-text">{user.year}</p>
            </div>
          </div>
        )}

        {user?.yearOfJoining && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Year of Joining</p>
              <p className="text-sm font-semibold text-text">{user.yearOfJoining}</p>
            </div>
          </div>
        )}

        {user?.dateOfBirth && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Date of Birth</p>
              <p className="text-sm font-semibold text-text">
                {new Date(user.dateOfBirth).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ProfileSection;
