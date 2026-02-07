import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import {
  getAllDocuments,
  deleteAnyDocument,
  resetPassword,
  getStudents,
  downloadDocument,
  createStudent,
  logout,
  deleteStudent,
  viewDocument
} from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

function AdminDashboard({ user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [resetStudentId, setResetStudentId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notif, setNotif] = useState({ type: '', message: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentForDocs, setSelectedStudentForDocs] = useState(null);
  const [studentDocs, setStudentDocs] = useState([]);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentId: '',
    name: '',
    email: '',
    password: '',
    department: '',
    year: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab, page, search, selectedCategory, selectedStudentId, studentSearch]);

  const showNotif = (type, message) => {
    setNotif({ type, message });
    setTimeout(() => setNotif({ type: '', message: '' }), 5000);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getAllDocuments(page, 10, search, selectedCategory, selectedStudentId);
      setDocuments(response.data.documents);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      showNotif('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await getStudents(studentSearch);
      setStudents(response.data.students);
    } catch (err) {
      showNotif('error', 'Failed to load students');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteAnyDocument(id);
      showNotif('success', 'Document deleted successfully');
      fetchDocuments();
    } catch (err) {
      showNotif('error', 'Delete failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetStudentId || !newPassword) {
      showNotif('error', 'Please enter student ID and new password');
      return;
    }

    try {
      await resetPassword(resetStudentId, newPassword);
      showNotif('success', 'Password reset successfully');
      setResetStudentId('');
      setNewPassword('');
    } catch (err) {
      showNotif('error', err.response?.data?.error || 'Password reset failed');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await createStudent(newStudent);
      showNotif('success', 'Student created successfully');
      setNewStudent({
        studentId: '',
        name: '',
        email: '',
        password: '',
        department: '',
        year: ''
      });
      fetchStudents();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create student';
      const details = err.response?.data?.errors;
      showNotif('error', details ? details.map(d => d.msg).join(', ') : errorMsg);
    }
  };

  const handleDeleteStudent = async (id, studentId) => {
    if (!window.confirm(`Are you sure you want to delete student ${studentId}? This will also delete all their documents and files irreversibly.`)) {
      return;
    }

    try {
      await deleteStudent(id);
      showNotif('success', `Student ${studentId} and all their data deleted successfully`);
      fetchStudents();
    } catch (err) {
      showNotif('error', err.response?.data?.error || 'Failed to delete student');
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
    } catch (err) {
      showNotif('error', 'Download failed');
    }
  };

  const handleView = async (id, filename, mimeType) => {
    try {
      const response = await viewDocument(id);
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      showNotif('error', 'Failed to view document');
    }
  };

  const handleShare = async (id, filename) => {
    try {
      const shareUrl = `${window.location.origin}/api/documents/view/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      showNotif('success', 'Document share link copied to clipboard!');
    } catch (err) {
      showNotif('error', 'Failed to copy share link');
    }
  };

  const openStudentDocs = async (student) => {
    setSelectedStudentForDocs(student);
    setIsDocsModalOpen(true);
    setDocsLoading(true);
    try {
      const response = await getAllDocuments(1, 100, '', '', student.studentId);
      setStudentDocs(response.data.documents);
    } catch (err) {
      showNotif('error', 'Failed to load student documents');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDeleteFromModal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteAnyDocument(id);
      showNotif('success', 'Document deleted successfully');
      setStudentDocs(prev => prev.filter(doc => doc._id !== id));
      fetchDocuments(); // Refresh global list too
    } catch (err) {
      showNotif('error', 'Delete failed');
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

  const categories = [...new Set(documents.map(doc => doc.category))];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-outfit">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        onAdminTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 glass-dark border-b border-white/20 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-text-light hover:text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-text-light text-sm">System management and document oversight</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-text-muted capitalize">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Notification */}
            <AnimatePresence>
              {notif.message && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-xl flex items-center gap-3 shadow-lg ${notif.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}
                >
                  <span className="text-xl">{notif.type === 'success' ? '✅' : '❌'}</span>
                  <p className="font-medium">{notif.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Documents View */}
            {activeTab === 'documents' && (
              <>
                <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-text mb-2">Search Documents</label>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by filename, category, or student ID..."
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary transition-colors text-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary transition-colors text-text"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2">Student ID</label>
                      <input
                        type="text"
                        value={selectedStudentId}
                        onChange={(e) => { setSelectedStudentId(e.target.value); setPage(1); }}
                        placeholder="Filter by ID"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary transition-colors text-text"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedStudentId(''); setPage(1); }}
                      className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 lg:p-8 shadow-xl">
                  <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    Master Document List
                  </h2>

                  {loading ? (
                    <div className="text-center py-12 text-text-light font-medium">Loading documents...</div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">No documents found matching filters.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Student ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Filename</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Uploaded</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {documents.map((doc) => (
                            <tr key={doc._id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{doc.studentId}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text font-medium">{doc.originalFilename}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold">{doc.category}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => handleView(doc._id, doc.originalFilename, doc.mimeType)}
                                    className="text-secondary hover:text-secondary-dark transition-colors"
                                    title="View"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(doc._id, doc.originalFilename)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                    title="Download"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleShare(doc._id, doc.originalFilename)}
                                    className="text-accent hover:text-accent-dark transition-colors"
                                    title="Share"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc._id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-3">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-2 bg-white border-2 border-gray-100 rounded-xl font-bold text-text disabled:opacity-50 hover:border-primary transition-all">Prev</button>
                      <span className="px-6 py-2 text-text font-bold">Page {page} of {totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-2 bg-white border-2 border-gray-100 rounded-xl font-bold text-text disabled:opacity-50 hover:border-primary transition-all">Next</button>
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {/* Students View */}
            {activeTab === 'students' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-text mb-6">Create Student Account</h2>
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Student ID *</label>
                        <input type="text" value={newStudent.studentId} onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Full Name *</label>
                        <input type="text" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Email</label>
                        <input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Password *</label>
                        <input type="password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" minLength="6" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Department</label>
                        <input type="text" value={newStudent.department} onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-text-light mb-1">Year</label>
                        <input type="text" value={newStudent.year} onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg transition-all">Create Student</button>
                  </form>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold text-text mb-6">Reset Student Password</h2>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text-light mb-1">Student ID</label>
                      <input type="text" value={resetStudentId} onChange={(e) => setResetStudentId(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-light mb-1">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-primary outline-none" minLength="6" required />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark shadow-lg transition-all">Update Password</button>
                  </form>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-dark rounded-2xl p-6 shadow-xl xl:col-span-2">
                  <h2 className="text-xl font-bold text-text mb-6 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      Student Directory
                    </div>
                    <div className="flex-1 max-w-sm ml-4">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search students..."
                        className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                  </h2>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Department</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Registered</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {students.map((student) => (
                          <tr key={student._id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{student.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{student.email || '--'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light text-center">{student.department || '--'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{new Date(student.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => openStudentDocs(student)}
                                  className="text-primary hover:text-primary-dark transition-colors"
                                >
                                  View Docs
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student._id, student.studentId)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Student Documents Modal */}
      <AnimatePresence>
        {isDocsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDocsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl glass-dark rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 lg:p-8 flex flex-col h-[80vh]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">Documents for {selectedStudentForDocs?.name}</h3>
                    <p className="text-text-light text-sm">ID: {selectedStudentForDocs?.studentId}</p>
                  </div>
                  <button
                    onClick={() => setIsDocsModalOpen(false)}
                    className="p-2 text-text-light hover:text-primary transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {docsLoading ? (
                    <div className="text-center py-12 text-text-light font-medium">Loading documents...</div>
                  ) : studentDocs.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">No documents found for this student.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Filename</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Uploaded</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {studentDocs.map((doc) => (
                            <tr key={doc._id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text font-medium">{doc.originalFilename}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold">{doc.category}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => handleView(doc._id, doc.originalFilename, doc.mimeType)}
                                    className="text-secondary hover:text-secondary-dark transition-colors"
                                    title="View"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(doc._id, doc.originalFilename)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                    title="Download"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleShare(doc._id, doc.originalFilename)}
                                    className="text-accent hover:text-accent-dark transition-colors"
                                    title="Share"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFromModal(doc._id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
