import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument, getMyDocuments, getCategories, viewDocument, downloadDocument, deleteDocument, logout, getProfile, getDocumentStats } from '../utils/api';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/ToastContainer';
import SkeletonLoader from '../components/SkeletonLoader';
import UploadProgress from '../components/UploadProgress';
import { useToast } from '../hooks/useToast';

function StudentDashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stats, setStats] = useState({ totalDocuments: 0, totalBytes: 0, recentUploads: 0, storageLimit: 104857600 });
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const uploadRef = useRef(null);
  const docsRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
    fetchUserProfile();
    fetchStats();
  }, [page, search, selectedCategory]);

  const fetchUserProfile = async () => {
    try {
      const response = await getProfile();
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile');
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getMyDocuments(page, 10, search, selectedCategory);
      setDocuments(response.data.documents);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getDocumentStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !category.trim()) {
      showError('Please select a file and enter a category');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      await uploadDocument(formData);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);

      success('Document uploaded successfully');
      setFile(null);
      setCategory('');
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      fetchDocuments();
      fetchCategories();
      fetchStats();
    } catch (err) {
      showError(err.response?.data?.error || 'Upload failed');
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const handleView = async (id, filename, mimeType) => {
    try {
      const response = await viewDocument(id);

      // Create blob with correct MIME type
      const blob = new Blob([response.data], { type: mimeType || response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab for viewing
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        // If popup blocked, create a link and click it
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('Opening document in new tab...');
      } else {
        success('Opening document...');
      }

      // Clean up the URL after a delay (browser will keep it for the tab)
      setTimeout(() => {
        // Don't revoke immediately - let the browser handle it
      }, 100);
    } catch (err) {
      console.error('View error:', err);
      showError(err.response?.data?.error || 'Failed to view document');
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Download started');
    } catch (err) {
      showError('Download failed');
    }
  };

  const handleShare = async (id, filename, mimeType) => {
    try {
      // Show loading state
      success('Preparing document for sharing...');

      // Fetch the document file
      const response = await viewDocument(id);
      const blob = new Blob([response.data], { type: mimeType || response.headers['content-type'] || 'application/octet-stream' });

      // Convert blob to File object for sharing
      const file = new File([blob], filename, { type: mimeType || blob.type });

      // Check if Web Share API with files is supported
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: filename,
          text: `Check out this document: ${filename}`,
          files: [file]
        };

        // Check if we can share files
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            success('Document shared successfully');
            return;
          } catch (err) {
            // User cancelled sharing
            if (err.name === 'AbortError') {
              return;
            }
            console.error('Share error:', err);
            // Fall through to link sharing
          }
        }
      }

      // If Web Share API with files is not supported, try sharing link
      if (navigator.share) {
        try {
          const shareUrl = `${window.location.origin}/api/documents/view/${id}`;
          await navigator.share({
            title: filename,
            text: `Check out this document: ${filename}`,
            url: shareUrl
          });
          success('Document shared successfully');
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }
        }
      }

      // Fall back to copying link to clipboard
      try {
        const shareUrl = `${window.location.origin}/api/documents/view/${id}`;
        await navigator.clipboard.writeText(shareUrl);
        success('Share link copied to clipboard!');
      } catch (clipboardErr) {
        // If clipboard API fails, show the link in a prompt
        const shareUrl = `${window.location.origin}/api/documents/view/${id}`;
        const message = `Share this link:\n${shareUrl}`;
        if (window.prompt(message)) {
          success('Link ready to share');
        }
      }
    } catch (err) {
      console.error('Share error:', err);
      showError(err.response?.data?.error || 'Failed to share document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(id);
      success('Document deleted successfully');
      fetchDocuments();
      fetchStats();
    } catch (err) {
      showError('Delete failed');
    }
  };

  const handleSidebarUploadClick = () => {
    if (uploadRef.current) {
      uploadRef.current.scrollIntoView({ behavior: 'smooth' });
      // Small delay to allow scrolling before opening file dialog
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 500);
    }
  };

  const handleSidebarDocumentsClick = () => {
    if (docsRef.current) {
      docsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Check if desktop on mount
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        isOpen={sidebarOpen || isDesktop}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
        onUploadClick={handleSidebarUploadClick}
        onDocumentsClick={handleSidebarDocumentsClick}
      />

      <div className="flex-1">
        {/* Mobile Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden glass-dark border-b border-white/20 px-4 py-4 flex items-center justify-between"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-primary">Document Store</h1>
          <div className="w-10" />
        </motion.header>

        {/* Desktop Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block glass-dark border-b border-white/20 px-8 py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">My Documents</h1>
              <p className="text-text-light text-sm mt-1">Manage and organize your academic documents</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-text">{user?.name || user?.studentId}</p>
                <p className="text-xs text-text-muted capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="p-4 lg:p-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Stats Overview */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-dark rounded-2xl p-6 shadow-xl flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-light text-sm font-semibold">Total Documents</p>
                  <h3 className="text-3xl font-bold text-text">{stats.totalDocuments}</h3>
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-6 shadow-xl flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-light text-sm font-semibold">Storage Capacity</p>
                  <h3 className="text-3xl font-bold text-text">
                    {(stats.totalBytes / (1024 * 1024)).toFixed(1)} <span className="text-sm font-normal text-text-light">/ {(stats.storageLimit / (1024 * 1024)).toFixed(0)} MB</span>
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.totalBytes / stats.storageLimit) * 100, 100)}%` }}
                      className="bg-secondary h-full"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-6 shadow-xl flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl text-accent">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-light text-sm font-semibold">Recent Uploads</p>
                  <h3 className="text-3xl font-bold text-text">{stats.recentUploads}</h3>
                  <p className="text-xs text-text-muted mt-1">Last 7 days</p>
                </div>
              </div>
            </motion.div>

            {/* Upload Card */}
            <motion.div
              ref={uploadRef}
              variants={itemVariants}
              className="glass-dark rounded-2xl p-6 lg:p-8 shadow-xl"
            >
              <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <span className="text-2xl">📤</span>
                Upload Document
              </h2>

              {uploadProgress > 0 && (
                <UploadProgress progress={uploadProgress} filename={file?.name || 'Uploading...'} />
              )}

              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Select File (PDF, JPG, PNG - Max 5MB)
                  </label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      id="file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Certificates, Transcripts, ID Cards"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-text placeholder:text-text-muted"
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={uploading}
                  whileHover={{ scale: uploading ? 1 : 1.02 }}
                  whileTap={{ scale: uploading ? 1 : 0.98 }}
                  className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    'Upload Document'
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Search and Filter Card */}
            <motion.div
              ref={docsRef}
              variants={itemVariants}
              className="glass-dark rounded-2xl p-6 shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Search</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by filename or category"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Filter by Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-text"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <motion.button
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('');
                      setPage(1);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-100 text-text px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Documents Card */}
            <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 lg:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                My Documents
              </h2>

              {loading ? (
                <div className="space-y-4">
                  <SkeletonLoader count={5} className="h-16" />
                </div>
              ) : documents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-text-light text-lg font-medium">No documents found</p>
                  <p className="text-text-muted text-sm mt-2">Upload your first document to get started</p>
                </motion.div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Filename</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Size</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Uploaded</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <AnimatePresence>
                          {documents.map((doc, index) => (
                            <motion.tr
                              key={doc._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-primary/5 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">
                                    {doc.mimeType?.includes('pdf') ? '📄' : '🖼️'}
                                  </span>
                                  <span className="text-sm font-medium text-text">{doc.originalFilename}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
                                  {doc.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                                {formatFileSize(doc.fileSize)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <motion.button
                                    onClick={() => handleView(doc._id, doc.originalFilename, doc.mimeType)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-secondary hover:text-secondary-dark transition-colors"
                                    title="View document"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleDownload(doc._id, doc.originalFilename)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                    title="Download document"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleShare(doc._id, doc.originalFilename, doc.mimeType)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-accent hover:text-accent-dark transition-colors"
                                    title="Share document"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleDelete(doc._id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Delete document"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 flex justify-center items-center gap-3"
                    >
                      <motion.button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        whileHover={{ scale: page === 1 ? 1 : 1.05 }}
                        whileTap={{ scale: page === 1 ? 1 : 0.95 }}
                        className="px-6 py-2 bg-white border-2 border-gray-200 rounded-xl font-semibold text-text disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary transition-colors"
                      >
                        Previous
                      </motion.button>
                      <span className="px-6 py-2 text-text font-semibold">
                        Page {page} of {totalPages}
                      </span>
                      <motion.button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
                        whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
                        className="px-6 py-2 bg-white border-2 border-gray-200 rounded-xl font-semibold text-text disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary transition-colors"
                      >
                        Next
                      </motion.button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default StudentDashboard;
