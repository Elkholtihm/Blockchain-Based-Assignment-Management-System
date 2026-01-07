import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      alert('Access denied: Admin only');
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={{ fontSize: '20px', color: '#475569' }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <h1 style={styles.logo}>BlockEduc</h1>
          <span style={styles.roleBadge}>Administrator</span>
        </div>

        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.fullname || 'Administrator'}</span>
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {}) }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          style={{ ...styles.tab, ...(activeTab === 'courses' ? styles.tabActive : {}) }}
        >
          Courses
        </button>
        <button
          onClick={() => setActiveTab('assign-professor')}
          style={{ ...styles.tab, ...(activeTab === 'assign-professor' ? styles.tabActive : {}) }}
        >
          Assign Professors
        </button>
        <button
          onClick={() => setActiveTab('enroll-students')}
          style={{ ...styles.tab, ...(activeTab === 'enroll-students' ? styles.tabActive : {}) }}
        >
          Enroll Students
        </button>
        <button
          onClick={() => setActiveTab('supervision')}
          style={{ ...styles.tab, ...(activeTab === 'supervision' ? styles.tabActive : {}) }}
        >
          System Overview
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'assign-professor' && <AssignProfessorTab />}
        {activeTab === 'enroll-students' && <EnrollStudentsTab />}
        {activeTab === 'supervision' && <SupervisionTab />}
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS (Modular & Clean)
// ============================================

const OverviewTab = () => (
  <div style={styles.tabContent}>
    <h2 style={styles.pageTitle}>Welcome, Administrator</h2>
    <p style={styles.pageSubtitle}>Manage the entire BlockEduc secure education platform</p>

    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <h3 style={styles.statNumber}>45</h3>
        <p style={styles.statLabel}>Active Students</p>
      </div>
      <div style={styles.statCard}>
        <h3 style={styles.statNumber}>8</h3>
        <p style={styles.statLabel}>Professors</p>
      </div>
      <div style={styles.statCard}>
        <h3 style={styles.statNumber}>12</h3>
        <p style={styles.statLabel}>Active Courses</p>
      </div>
      <div style={styles.statCard}>
        <h3 style={styles.statNumber}>89</h3>
        <p style={styles.statLabel}>Total Submissions</p>
      </div>
    </div>

    <div style={styles.infoBox}>
      <h3>Security & Privacy</h3>
      <p>
        All student submissions are encrypted using RSA-2048. Private keys are never stored on the server.
        The system ensures full confidentiality, anti-plagiarism protection, and blockchain traceability.
      </p>
    </div>
  </div>
);

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...users];

    if (searchTerm) {
      result = result.filter(u =>
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = `${a.firstname} ${a.lastname}`.toLowerCase();
        bVal = `${b.firstname} ${b.lastname}`.toLowerCase();
      } else if (sortBy === 'email') {
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
      } else if (sortBy === 'date') {
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, sortBy, sortOrder, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

const confirmDelete = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/admin/delete-user/${selectedUser.id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || 'Failed to delete user');
      setShowDeleteModal(false);
      setSelectedUser(null);
      return;
    }

    alert('User deleted successfully!');
    fetchUsers();  // Refresh the list
    setShowDeleteModal(false);
    setSelectedUser(null);

  } catch (err) {
    alert('Network error — check if server is running');
    setShowDeleteModal(false);
    setSelectedUser(null);
  }
};

  if (loading) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      {/* Header */}
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>User Management</h2>
          <p style={styles.sectionDesc}>Create, view, and manage all user accounts</p>
        </div>
        <button 
          style={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
        >
          + Create New User
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.miniStatsRow}>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{users.length}</span>
          <span style={styles.miniStatLabel}>Total Users</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{users.filter(u => u.role === 'professor').length}</span>
          <span style={styles.miniStatLabel}>Professors</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{users.filter(u => u.role === 'student').length}</span>
          <span style={styles.miniStatLabel}>Students</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{users.filter(u => u.status === 'active').length}</span>
          <span style={styles.miniStatLabel}>Active</span>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <span style={styles.searchIconSpan}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="student">Students Only</option>
            <option value="professor">Professors Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="date">Sort by Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={styles.sortOrderBtn}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>

        <div style={styles.resultsCount}>
          Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📭</span>
                    <p style={styles.emptyText}>No users found</p>
                    <button 
                      onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
                      style={styles.btnSecondary}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.userAvatar}>
                        {user.firstname[0]}{user.lastname[0]}
                      </div>
                      <div>
                        <div style={styles.userFullname}>{user.firstname} {user.lastname}</div>
                        <div style={styles.userIdText}>ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.roleBadge,
                      ...(user.role === 'professor' ? styles.profBadge : styles.studentBadge)
                    }}>
                      {user.role === 'professor' ? '👨‍🏫 Professor' : '👨‍🎓 Student'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusDot,
                      ...(user.status === 'active' ? styles.statusActiveColor : styles.statusInactiveColor)
                    }}>
                      ● {user.status}
                    </span>
                  </td>
                  <td style={styles.td}>{user.created_at}</td>
                  <td style={styles.td}>
                    <div style={styles.actionsCell}>
                      <button 
                        onClick={() => handleEdit(user)}
                        style={styles.btnEdit}
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(user)}
                        style={styles.btnDelete}
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationBox}>
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === 1 && styles.paginationBtnDisabled)
            }}
          >
            ← Previous
          </button>
          
          <div style={styles.paginationPages}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  ...styles.pageNumber,
                  ...(currentPage === i + 1 && styles.pageNumberActive)
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === totalPages && styles.paginationBtnDisabled)
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
        />
      )}
      
      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSuccess={fetchUsers}
        />
      )}
      
      {showDeleteModal && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
          onSuccess={fetchUsers}  // ← Très important : rafraîchit la liste
        />
      )}
    </div>
  );
};

// ============================================
// MODALS - Create, Edit, Delete
// ============================================

const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validation frontend
  if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim() || formData.password.length < 8) {
    setError('Tous les champs sont requis et le mot de passe doit faire au moins 8 caractères.');
    setLoading(false);
    return;
  }

  if (!formData.role || !['student', 'professor'].includes(formData.role)) {
    setError('Veuillez sélectionner un rôle valide.');
    setLoading(false);
    return;
  }

  try {
    const payload = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role
    };

    console.log('Payload envoyé :', payload);

    const response = await fetch('http://127.0.0.1:8000/api/admin/create-users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Réponse serveur :', result);

    if (!response.ok) {
      const errorMsg = result.details ? 
        Object.values(result.details).flat().join(' ') : 
        result.error || 'Erreur inconnue';
      setError(errorMsg);
      setLoading(false);
      return;
    }

    alert('Utilisateur créé avec succès !');
    onSuccess();
    onClose();

  } catch (err) {
    console.error(err);
    setError('Erreur réseau — vérifiez que le serveur Django tourne.');
    setLoading(false);
  }
};
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Create New User</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>First Name *</label>
              <input
                type="text"
                required
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                style={styles.formInput}
                placeholder="Ahmed"
              />
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                style={styles.formInput}
                placeholder="Benali"
              />
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.formInput}
              placeholder="user@ensa.ac.ma"
            />
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.formInput}
              placeholder="Minimum 8 characters"
              minLength="8"
            />
          </div>
          
         <div style={styles.formField}>
          <label style={styles.formLabel}>Role *</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            style={styles.formSelect}
          >
            <option value="" disabled>-- Sélectionner un rôle --</option>
            <option value="student">Étudiant</option>
            <option value="professor">Professeur</option>
          </select>
        </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    email: user.email || '',
    role: user.role || 'student',
    status: user.status === 'active' || user.is_active ? 'active' : 'inactive',
    password: ''  // empty by default — optional
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        is_active: formData.status === 'active'  // ← boolean for is_active field
      };

      // Only send password if user typed something
      if (formData.password && formData.password.length >= 8) {
        payload.password = formData.password;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/admin/update-user/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details 
          ? Object.values(result.details).flat().join(' ') 
          : result.error || 'Failed to update user';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      alert('User updated successfully!');
      onSuccess();  // Refresh the user list
      onClose();

    } catch (err) {
      setError('Network error — make sure Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Edit User</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>First Name *</label>
              <input
                type="text"
                required
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                style={styles.formInput}
              />
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                style={styles.formSelect}
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.formSelect}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.formLabel}>New Password (optional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.formInput}
              placeholder="Leave blank to keep current password"
              minLength="8"
            />
            <small style={{color: '#64748b', fontSize: '12px'}}>
              Minimum 8 characters. Only fill if you want to change the password.
            </small>
          </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const DeleteConfirmModal = ({ user, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') return;

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/delete-user/${user.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete user');
        setLoading(false);
        return;
      }

      // Succès : message + rafraîchissement immédiat
      alert('User deleted successfully!');
      onSuccess();  // Appelle fetchUsers() → liste mise à jour
      onClose();

    } catch (err) {
      alert('Network error — check if Django server is running on port 8000');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '480px'}}>
        <div style={styles.modalHeader}>
          <h3 style={{...styles.modalTitle, color: '#dc2626'}}>Delete User</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>×</button>
        </div>
        
        <div style={styles.modalBody}>
          <div style={styles.warningBox}>
            <span style={styles.warningIcon}>Warning</span>
            <div>
              <p style={styles.warningTitle}>This action cannot be undone!</p>
              <p style={styles.warningText}>You are about to permanently delete:</p>
              <div style={styles.deleteUserInfo}>
                <strong>{user.firstname} {user.lastname}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Type <strong>DELETE</strong> to confirm:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={styles.formInput}
              placeholder="DELETE"
              autoFocus
            />
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              style={{...styles.btnSubmit, background: '#dc2626'}}
              disabled={loading || confirmText !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const CoursesTab = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [professorFilter, setProfessorFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 8;

  // Fetch courses and professors on mount
  useEffect(() => {
    fetchCourses();
    fetchProfessors();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/courses/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/users/');
      if (response.ok) {
        const data = await response.json();
        const profs = data.filter(u => u.role === 'professor');
        setProfessors(profs);
      }
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...courses];

    // Search filter
    if (searchTerm) {
      result = result.filter(c =>
        c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Professor filter
    if (professorFilter !== 'all') {
      if (professorFilter === 'unassigned') {
        result = result.filter(c => !c.professor);
      } else {
        result = result.filter(c => c.professor === parseInt(professorFilter));
      }
    }

    // Assignment filter
    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'assigned') {
        result = result.filter(c => c.professor);
      } else if (assignmentFilter === 'unassigned') {
        result = result.filter(c => !c.professor);
      }
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = a.course_name.toLowerCase();
        bVal = b.course_name.toLowerCase();
      } else if (sortBy === 'code') {
        aVal = a.course_code.toLowerCase();
        bVal = b.course_code.toLowerCase();
      } else if (sortBy === 'enrollments') {
        aVal = a.enrollment_count || 0;
        bVal = b.enrollment_count || 0;
      } else if (sortBy === 'date') {
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    setFilteredCourses(result);
    setCurrentPage(1);
  }, [searchTerm, professorFilter, assignmentFilter, sortBy, sortOrder, courses]);

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleDelete = (course) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      {/* Header */}
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Course Management</h2>
          <p style={styles.sectionDesc}>Create, view, and manage all courses</p>
        </div>
        <button 
          style={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Course
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.miniStatsRow}>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{courses.length}</span>
          <span style={styles.miniStatLabel}>Total Courses</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{courses.filter(c => c.professor).length}</span>
          <span style={styles.miniStatLabel}>Assigned</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{courses.filter(c => !c.professor).length}</span>
          <span style={styles.miniStatLabel}>Unassigned</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>
            {courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0)}
          </span>
          <span style={styles.miniStatLabel}>Total Students</span>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <span style={styles.searchIconSpan}>🔍</span>
          <input
            type="text"
            placeholder="Search by code, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <select
            value={professorFilter}
            onChange={(e) => setProfessorFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Professors</option>
            <option value="unassigned">Unassigned Only</option>
            {professors.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.firstname} {prof.lastname}
              </option>
            ))}
          </select>

          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Courses</option>
            <option value="assigned">Assigned Courses</option>
            <option value="unassigned">Unassigned Courses</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="code">Sort by Code</option>
            <option value="enrollments">Sort by Enrollments</option>
            <option value="date">Sort by Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={styles.sortOrderBtn}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>

        <div style={styles.resultsCount}>
          Showing {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} of {filteredCourses.length} courses
        </div>
      </div>

      {/* Courses Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Course</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Professor</th>
              <th style={styles.th}>Enrollments</th>
              <th style={styles.th}>Assignments</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentCourses.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📚</span>
                    <p style={styles.emptyText}>No courses found</p>
                    <button 
                      onClick={() => { 
                        setSearchTerm(''); 
                        setProfessorFilter('all');
                        setAssignmentFilter('all');
                      }}
                      style={styles.btnSecondary}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentCourses.map((course) => (
                <tr key={course.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={styles.courseCell}>
                      <div style={styles.courseIcon}>
                        📖
                      </div>
                      <div>
                        <div style={styles.courseCode}>{course.course_code}</div>
                        <div style={styles.courseName}>{course.course_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.descriptionText}>
                      {course.description ? 
                        (course.description.length > 60 
                          ? course.description.substring(0, 60) + '...' 
                          : course.description)
                        : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>No description</span>
                      }
                    </div>
                  </td>
                  <td style={styles.td}>
                    {course.professor_name ? (
                      <div style={styles.professorCell}>
                        <div style={styles.professorAvatar}>
                          👨‍🏫
                        </div>
                        <div>
                          <div style={styles.professorName}>{course.professor_name}</div>
                          <div style={styles.professorEmail}>{course.professor_email}</div>
                        </div>
                      </div>
                    ) : (
                      <span style={styles.unassignedBadge}>
                        ⚠️ Unassigned
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.countBadge}>
                      <span style={styles.countNumber}>{course.enrollment_count || 0}</span>
                      <span style={styles.countLabel}> students</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.countBadge}>
                      <span style={styles.countNumber}>{course.assignment_count || 0}</span>
                      <span style={styles.countLabel}> tasks</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionsCell}>
                      <button 
                        onClick={() => handleEdit(course)}
                        style={styles.btnEdit}
                        title="Edit course"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(course)}
                        style={styles.btnDelete}
                        title="Delete course"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationBox}>
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === 1 && styles.paginationBtnDisabled)
            }}
          >
            ← Previous
          </button>
          
          <div style={styles.paginationPages}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  ...styles.pageNumber,
                  ...(currentPage === i + 1 && styles.pageNumberActive)
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === totalPages && styles.paginationBtnDisabled)
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCourseModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchCourses}
          professors={professors}
        />
      )}
      
      {showEditModal && selectedCourse && (
        <EditCourseModal 
          course={selectedCourse}
          onClose={() => { setShowEditModal(false); setSelectedCourse(null); }}
          onSuccess={fetchCourses}
          professors={professors}
        />
      )}
      
      {showDeleteModal && selectedCourse && (
        <DeleteCourseModal
          course={selectedCourse}
          onClose={() => { setShowDeleteModal(false); setSelectedCourse(null); }}
          onSuccess={fetchCourses}
        />
      )}
    </div>
  );
};

// ============================================
// CREATE COURSE MODAL
// ============================================

const CreateCourseModal = ({ onClose, onSuccess, professors }) => {
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    professor_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.course_code.trim() || !formData.course_name.trim()) {
      setError('Course code and name are required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        course_code: formData.course_code.trim().toUpperCase(),
        course_name: formData.course_name.trim(),
        description: formData.description.trim(),
        professor_id: formData.professor_id ? parseInt(formData.professor_id) : null
      };

      const response = await fetch('http://localhost:8000/api/admin/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details ? 
          Object.values(result.details).flat().join(' ') : 
          result.error || 'Failed to create course';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      alert('Course created successfully!');
      onSuccess();
      onClose();

    } catch (err) {
      console.error(err);
      setError('Network error — check if Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Create New Course</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Course Code *</label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                style={styles.formInput}
                placeholder="CS101"
              />
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Professor (Optional)</label>
              <select
                value={formData.professor_id}
                onChange={(e) => setFormData({ ...formData, professor_id: e.target.value })}
                style={styles.formSelect}
              >
                <option value="">-- Assign Later --</option>
                {professors.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.firstname} {prof.lastname}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Course Name *</label>
            <input
              type="text"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              style={styles.formInput}
              placeholder="Introduction to Programming"
            />
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{...styles.formInput, minHeight: '100px', resize: 'vertical'}}
              placeholder="Brief description of the course..."
            />
          </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// EDIT COURSE MODAL
// ============================================

const EditCourseModal = ({ course, onClose, onSuccess, professors }) => {
  const [formData, setFormData] = useState({
    course_code: course.course_code || '',
    course_name: course.course_name || '',
    description: course.description || '',
    professor_id: course.professor || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        id: course.id,
        course_code: formData.course_code.trim().toUpperCase(),
        course_name: formData.course_name.trim(),
        description: formData.description.trim(),
        professor_id: formData.professor_id ? parseInt(formData.professor_id) : 0
      };

      const response = await fetch('http://localhost:8000/api/admin/courses/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details 
          ? Object.values(result.details).flat().join(' ') 
          : result.error || 'Failed to update course';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      alert('Course updated successfully!');
      onSuccess();
      onClose();

    } catch (err) {
      setError('Network error — make sure Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Edit Course</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.formLabel}>Course Code *</label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formField}>
              <label style={styles.formLabel}>Professor</label>
              <select
                value={formData.professor_id}
                onChange={(e) => setFormData({ ...formData, professor_id: e.target.value })}
                style={styles.formSelect}
              >
                <option value="">-- Unassign --</option>
                {professors.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.firstname} {prof.lastname}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Course Name *</label>
            <input
              type="text"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{...styles.formInput, minHeight: '100px', resize: 'vertical'}}
            />
          </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// DELETE COURSE MODAL
// ============================================

const DeleteCourseModal = ({ course, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/courses/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: course.id })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Failed to delete course');
        setLoading(false);
        return;
      }

      alert('Course deleted successfully!');
      onSuccess();
      onClose();

    } catch (err) {
      alert('Network error — check if Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '480px'}}>
        <div style={styles.modalHeader}>
          <h3 style={{...styles.modalTitle, color: '#dc2626'}}>Delete Course</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>×</button>
        </div>
        
        <div style={styles.modalBody}>
          <div style={styles.warningBox}>
            <span style={styles.warningIcon}>⚠️</span>
            <div>
              <p style={styles.warningTitle}>This action cannot be undone!</p>
              <p style={styles.warningText}>You are about to permanently delete:</p>
              <div style={styles.deleteCourseInfo}>
                <strong>{course.course_code} - {course.course_name}</strong>
                {course.enrollment_count > 0 && (
                  <span style={{color: '#dc2626'}}>
                    ⚠️ {course.enrollment_count} students enrolled
                  </span>
                )}
                {course.assignment_count > 0 && (
                  <span style={{color: '#dc2626'}}>
                    ⚠️ {course.assignment_count} assignments exist
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Type <strong>DELETE</strong> to confirm:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={styles.formInput}
              placeholder="DELETE"
              autoFocus
            />
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              style={{...styles.btnSubmit, background: '#dc2626'}}
              disabled={loading || confirmText !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const AssignProfessorTab = () => (
  <div style={styles.tabContent}>
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>Assign Courses to Professors</h2>
    </div>
    <p style={styles.sectionDesc}>Link existing courses to professors</p>
    <div style={styles.placeholder}>
      Assignment interface coming soon
    </div>
  </div>
);


const EnrollStudentsTab = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modals
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    total_enrollments: 0,
    unique_students: 0,
    unique_courses: 0
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const enrollmentsPerPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/enrollments/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setFilteredEnrollments(data.enrollments || []);
      setStats(data.stats || { total_enrollments: 0, unique_students: 0, unique_courses: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/users/');
      if (response.ok) {
        const data = await response.json();
        const studentsList = data.filter(u => u.role === 'student');
        setStudents(studentsList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/courses/');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...enrollments];

    // Search filter
    if (searchTerm) {
      result = result.filter(e =>
        e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.course_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (courseFilter !== 'all') {
      result = result.filter(e => e.course === parseInt(courseFilter));
    }

    // Student filter
    if (studentFilter !== 'all') {
      result = result.filter(e => e.student === parseInt(studentFilter));
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'student') {
        aVal = a.student_name.toLowerCase();
        bVal = b.student_name.toLowerCase();
      } else if (sortBy === 'course') {
        aVal = a.course_name.toLowerCase();
        bVal = b.course_name.toLowerCase();
      } else if (sortBy === 'date') {
        aVal = new Date(a.enrolled_date);
        bVal = new Date(b.enrolled_date);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    setFilteredEnrollments(result);
    setCurrentPage(1);
  }, [searchTerm, courseFilter, studentFilter, sortBy, sortOrder, enrollments]);

  // Pagination
  const indexOfLastEnrollment = currentPage * enrollmentsPerPage;
  const indexOfFirstEnrollment = indexOfLastEnrollment - enrollmentsPerPage;
  const currentEnrollments = filteredEnrollments.slice(indexOfFirstEnrollment, indexOfLastEnrollment);
  const totalPages = Math.ceil(filteredEnrollments.length / enrollmentsPerPage);

  const handleDelete = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      {/* Header */}
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Student Enrollment Management</h2>
          <p style={styles.sectionDesc}>Enroll students in courses and manage registrations</p>
        </div>
        <div style={styles.headerActions}>
          <button 
            style={{...styles.btnSecondary, marginRight: '12px'}}
            onClick={() => setShowBulkEnrollModal(true)}
          >
            📋 Bulk Enroll
          </button>
          <button 
            style={styles.btnPrimary}
            onClick={() => setShowEnrollModal(true)}
          >
            + Enroll Student
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.miniStatsRow}>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{stats.total_enrollments}</span>
          <span style={styles.miniStatLabel}>Total Enrollments</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{stats.unique_students}</span>
          <span style={styles.miniStatLabel}>Students Enrolled</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>{stats.unique_courses}</span>
          <span style={styles.miniStatLabel}>Courses with Students</span>
        </div>
        <div style={styles.miniStat}>
          <span style={styles.miniStatNumber}>
            {stats.total_enrollments > 0 ? (stats.total_enrollments / stats.unique_students).toFixed(1) : 0}
          </span>
          <span style={styles.miniStatLabel}>Avg. Courses/Student</span>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <span style={styles.searchIconSpan}>🔍</span>
          <input
            type="text"
            placeholder="Search by student name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
            >
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </option>
            ))}
          </select>

          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.firstname} {student.lastname}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="date">Sort by Date</option>
            <option value="student">Sort by Student</option>
            <option value="course">Sort by Course</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={styles.sortOrderBtn}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>

        <div style={styles.resultsCount}>
          Showing {indexOfFirstEnrollment + 1}-{Math.min(indexOfLastEnrollment, filteredEnrollments.length)} of {filteredEnrollments.length} enrollments
        </div>
      </div>

      {/* Enrollments Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Course</th>
              <th style={styles.th}>Professor</th>
              <th style={styles.th}>Enrolled Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEnrollments.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>📚</span>
                    <p style={styles.emptyText}>No enrollments found</p>
                    <button 
                      onClick={() => { 
                        setSearchTerm(''); 
                        setCourseFilter('all');
                        setStudentFilter('all');
                      }}
                      style={styles.btnSecondary}
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentEnrollments.map((enrollment) => (
                <tr key={enrollment.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={styles.studentCell}>
                      <div style={styles.studentAvatar}>
                        {enrollment.student_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={styles.studentName}>{enrollment.student_name}</div>
                        <div style={styles.studentEmail}>{enrollment.student_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.courseInfo}>
                      <div style={styles.courseCode}>{enrollment.course_code}</div>
                      <div style={styles.courseName}>{enrollment.course_name}</div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.professorBadge}>
                      👨‍🏫 {enrollment.professor_name}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.dateInfo}>
                      <span style={styles.dateIcon}>📅</span>
                      {enrollment.enrolled_date}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleDelete(enrollment)}
                      style={styles.btnDeleteSmall}
                      title="Remove enrollment"
                    >
                      🗑️ Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationBox}>
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === 1 && styles.paginationBtnDisabled)
            }}
          >
            ← Previous
          </button>
          
          <div style={styles.paginationPages}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  ...styles.pageNumber,
                  ...(currentPage === i + 1 && styles.pageNumberActive)
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.paginationBtn,
              ...(currentPage === totalPages && styles.paginationBtnDisabled)
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {showEnrollModal && (
        <EnrollStudentModal 
          onClose={() => setShowEnrollModal(false)}
          onSuccess={fetchEnrollments}
          students={students}
          courses={courses}
        />
      )}
      
      {showBulkEnrollModal && (
        <BulkEnrollModal 
          onClose={() => setShowBulkEnrollModal(false)}
          onSuccess={fetchEnrollments}
          students={students}
          courses={courses}
        />
      )}
      
      {showDeleteModal && selectedEnrollment && (
        <DeleteEnrollmentModal
          enrollment={selectedEnrollment}
          onClose={() => { setShowDeleteModal(false); setSelectedEnrollment(null); }}
          onSuccess={fetchEnrollments}
        />
      )}
    </div>
  );
};

// ============================================
// ENROLL STUDENT MODAL (Single)
// ============================================

const EnrollStudentModal = ({ onClose, onSuccess, students, courses }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.student_id || !formData.course_id) {
      setError('Please select both student and course');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        student_id: parseInt(formData.student_id),
        course_id: parseInt(formData.course_id)
      };

      const response = await fetch('http://localhost:8000/api/admin/enrollments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details ? 
          Object.values(result.details).flat().join(' ') : 
          result.error || 'Failed to enroll student';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      alert('Student enrolled successfully!');
      onSuccess();
      onClose();

    } catch (err) {
      console.error(err);
      setError('Network error — check if Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Enroll Student in Course</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Select Student *</label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              style={styles.formSelect}
            >
              <option value="">-- Select a Student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstname} {student.lastname} ({student.email})
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Select Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
              style={styles.formSelect}
            >
              <option value="">-- Select a Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.infoBox}>
            <span style={{fontSize: '18px', marginRight: '8px'}}>ℹ️</span>
            <span style={{fontSize: '13px', color: '#475569'}}>
              This will immediately enroll the selected student in the chosen course
            </span>
          </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// BULK ENROLL MODAL
// ============================================

const BulkEnrollModal = ({ onClose, onSuccess, students, courses }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    student_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const toggleStudent = (studentId) => {
    setFormData(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId]
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({
      ...prev,
      student_ids: students.map(s => s.id)
    }));
  };

  const deselectAll = () => {
    setFormData(prev => ({
      ...prev,
      student_ids: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    if (!formData.course_id || formData.student_ids.length === 0) {
      setError('Please select a course and at least one student');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        course_id: parseInt(formData.course_id),
        student_ids: formData.student_ids
      };

      const response = await fetch('http://localhost:8000/api/admin/enrollments/bulk/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to enroll students');
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setError('Network error — check if Django server is running');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (result && result.created > 0) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '650px'}}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Bulk Enroll Students</h3>
          <button onClick={handleClose} style={styles.modalCloseBtn}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          
          {result && (
            <div style={styles.successAlert}>
              <strong>✅ Success!</strong>
              <p style={{margin: '8px 0 0 0'}}>
                {result.created} students enrolled successfully
                {result.skipped > 0 && ` (${result.skipped} already enrolled)`}
              </p>
            </div>
          )}
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Select Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
              style={styles.formSelect}
            >
              <option value="">-- Select a Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.formField}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
              <label style={styles.formLabel}>
                Select Students * ({formData.student_ids.length} selected)
              </label>
              <div style={{display: 'flex', gap: '8px'}}>
                <button type="button" onClick={selectAll} style={styles.btnSmall}>
                  Select All
                </button>
                <button type="button" onClick={deselectAll} style={styles.btnSmall}>
                  Clear
                </button>
              </div>
            </div>
            
            <div style={styles.studentListBox}>
              {students.map(student => (
                <label key={student.id} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.student_ids.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    style={styles.checkbox}
                  />
                  <div style={styles.studentCheckboxInfo}>
                    <span style={styles.studentCheckboxName}>
                      {student.firstname} {student.lastname}
                    </span>
                    <span style={styles.studentCheckboxEmail}>{student.email}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div style={styles.modalActions}>
            <button type="button" onClick={handleClose} style={styles.btnCancel}>
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button type="submit" style={styles.btnSubmit} disabled={loading}>
                {loading ? 'Enrolling...' : `Enroll ${formData.student_ids.length} Students`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// DELETE ENROLLMENT MODAL
// ============================================

const DeleteEnrollmentModal = ({ enrollment, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== 'REMOVE') return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/enrollments/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: enrollment.id })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Failed to remove enrollment');
        setLoading(false);
        return;
      }

      alert('Enrollment removed successfully!');
      onSuccess();
      onClose();

    } catch (err) {
      alert('Network error — check if Django server is running');
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '480px'}}>
        <div style={styles.modalHeader}>
          <h3 style={{...styles.modalTitle, color: '#dc2626'}}>Remove Enrollment</h3>
          <button onClick={onClose} style={styles.modalCloseBtn}>×</button>
        </div>
        
        <div style={styles.modalBody}>
          <div style={styles.warningBox}>
            <span style={styles.warningIcon}>⚠️</span>
            <div>
              <p style={styles.warningTitle}>This action cannot be undone!</p>
              <p style={styles.warningText}>You are about to remove:</p>
              <div style={styles.enrollmentInfo}>
                <strong>👨‍🎓 {enrollment.student_name}</strong>
                <span>from</span>
                <strong>📚 {enrollment.course_code} - {enrollment.course_name}</strong>
              </div>
            </div>
          </div>
          
          <div style={styles.formField}>
            <label style={styles.formLabel}>Type <strong>REMOVE</strong> to confirm:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={styles.formInput}
              placeholder="REMOVE"
              autoFocus
            />
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              style={{...styles.btnSubmit, background: '#dc2626'}}
              disabled={loading || confirmText !== 'REMOVE'}
            >
              {loading ? 'Removing...' : 'Remove Enrollment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SupervisionTab Component
// ============================================
const SupervisionTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchSystemOverview();
  }, []);

  const fetchSystemOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/admin/system-overview/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system overview');
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.glassCardCentered}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading System Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.glassCardCentered}>
          <p style={styles.errorText}>Error: {error}</p>
          <button onClick={fetchSystemOverview} style={styles.refreshBtnError}>Retry</button>
        </div>
      </div>
    );
  }

  const userActivePct = data?.users?.total > 0 ? Math.round((data.users.active || 0) / data.users.total * 100) : 0;
  const coursesAssignedPct = data?.courses?.total > 0 ? Math.round(data.courses.assigned / data.courses.total * 100) : 0;
  const submissionsGradedPct = data?.submissions?.total > 0 ? Math.round(data.submissions.graded / data.submissions.total * 100) : 0;

  // Submission trend data for bar chart
  const submissionTrend = (() => {
    if (!data?.recent_submissions) return [];
    const map = {};
    data.recent_submissions.forEach(sub => {
      const date = new Date(sub.submitted_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      map[date] = (map[date] || 0) + 1;
    });
    return Object.entries(map).slice(-7).map(([date, count]) => ({ date, count }));
  })();
  const maxTrend = Math.max(...submissionTrend.map(d => d.count), 5);

  return (
    <div style={styles.tabContent}>
      {/* Hero Header with Glass Effect */}
      <div style={styles.heroHeader}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>📊</div>
          <div>
            <h1 style={styles.heroTitle}>System Overview</h1>
            <p style={styles.heroSubtitle}>
              Real-time platform health & analytics • Updated {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button onClick={fetchSystemOverview} style={styles.refreshBtn}>
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Key Metrics Cards - Glassmorphism + Gradient Accents */}
      <div style={styles.metricsGrid}>
        {/* Users Card */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>👥</span>
            <h3 style={styles.cardTitle}>Users Overview</h3>
          </div>
          <p style={styles.cardBigNumber}>{data?.users?.total || 0}</p>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${userActivePct}%` }}></div>
          </div>
          <div style={styles.miniGrid}>
            <div><span style={styles.miniNumber}>{data?.users?.students || 0}</span> Students</div>
            <div><span style={styles.miniNumber}>{data?.users?.professors || 0}</span> Professors</div>
            <div><span style={styles.miniNumber}>{data?.users?.admins || 0}</span> Admins</div>
            <div><span style={styles.miniNumber}>{data?.users?.active || 0}</span> Active</div>
          </div>
        </div>

        {/* Courses Card */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📚</span>
            <h3 style={styles.cardTitle}>Courses</h3>
          </div>
          <p style={styles.cardBigNumber}>{data?.courses?.total || 0}</p>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${coursesAssignedPct}%`, background: '#34d399' }}></div>
          </div>
          <div style={styles.miniGrid}>
            <div><span style={styles.miniNumber}>{data?.courses?.assigned || 0}</span> Assigned</div>
            <div><span style={styles.miniNumber}>{data?.courses?.unassigned || 0}</span> Unassigned</div>
            <div><span style={styles.miniNumber}>{data?.courses?.enrollments || 0}</span> Enrollments</div>
          </div>
        </div>

        {/* Assignments Card */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📝</span>
            <h3 style={styles.cardTitle}>Assignments</h3>
          </div>
          <p style={styles.cardBigNumber}>{data?.assignments?.total || 0}</p>
          <div style={styles.miniGrid}>
            <div style={{ color: '#ef4444' }}>
              <span style={styles.miniNumber}>{data?.assignments?.overdue || 0}</span> Overdue
            </div>
          </div>
        </div>

        {/* Submissions Card */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📤</span>
            <h3 style={styles.cardTitle}>Submissions</h3>
          </div>
          <p style={styles.cardBigNumber}>{data?.submissions?.total || 0}</p>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${submissionsGradedPct}%`, background: '#818cf8' }}></div>
          </div>
          <div style={styles.miniGrid}>
            <div><span style={styles.miniNumber}>{data?.submissions?.graded || 0}</span> Graded</div>
            <div><span style={styles.miniNumber}>{data?.submissions?.pending || 0}</span> Pending</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* User Distribution Donut */}
        <div style={styles.glassCard}>
          <h3 style={styles.chartTitle}>User Role Distribution</h3>
          <div style={styles.donutContainer}>
            <svg viewBox="0 0 36 36" style={styles.donutSvg}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 1 0 0 31.831 a 15.9155 15.9155 0 1 0 0 -31.831" fill="none" stroke="#e0e7ff" strokeWidth="4" />
              <path d={`M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831`} 
                fill="none" stroke="#a78bfa" strokeWidth="4" 
                strokeDasharray={`${(data?.users?.students / data?.users?.total || 0)*100} 100`} />
              <path d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831" 
                fill="none" stroke="#34d399" strokeWidth="4" 
                strokeDasharray={`${(data?.users?.professors / data?.users?.total || 0)*100} 100`} 
                strokeDashoffset={`-${(data?.users?.students / data?.users?.total || 0)*100}`} />
              <text x="18" y="18" textAnchor="middle" dy="0.3em" style={styles.donutCenter}>{data?.users?.total || 0}</text>
            </svg>
          </div>
          <div style={styles.legend}>
            <span><div style={{...styles.legendDot, background:'#a78bfa'}}></div>Students</span>
            <span><div style={{...styles.legendDot, background:'#34d399'}}></div>Professors</span>
            <span><div style={{...styles.legendDot, background:'#f87171'}}></div>Admins</span>
          </div>
        </div>

        {/* Submission Trend Bar Chart */}
        <div style={styles.glassCard}>
          <h3 style={styles.chartTitle}>Recent Submission Trend</h3>
          <div style={styles.barChart}>
            {submissionTrend.map((d, i) => (
              <div key={i} style={styles.barItem}>
                <div style={{ height: `${(d.count / maxTrend) * 100}%`, ...styles.barFill }}></div>
                <span style={styles.barLabel}>{d.count}</span>
                <span style={styles.barDate}>{d.date}</span>
              </div>
            ))}
            {submissionTrend.length === 0 && <p style={styles.emptyChart}>No recent data</p>}
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div style={styles.tablesGrid}>
        <div style={styles.glassCard}>
          <div style={styles.tableHeader}>
            <span style={styles.tableIcon}>📢</span>
            <h3 style={styles.tableTitle}>Recent Announcements</h3>
          </div>
          <table style={styles.table}>
            <thead><tr>{['Title','Course','Created By','Date'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {data?.recent_announcements?.length ? data.recent_announcements.map(ann => (
                <tr key={ann.id} style={styles.tableRowHover}>
                  <td style={styles.td}>{ann.title}</td>
                  <td style={styles.td}>{ann.course_name || 'Global'}</td>
                  <td style={styles.td}>{ann.created_by_name}</td>
                  <td style={styles.td}>{new Date(ann.created_at).toLocaleDateString()}</td>
                </tr>
              )) : <tr><td colSpan="4" style={styles.emptyRow}>No announcements</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={styles.glassCard}>
          <div style={styles.tableHeader}>
            <span style={styles.tableIcon}>📥</span>
            <h3 style={styles.tableTitle}>Recent Submissions</h3>
          </div>
          <table style={styles.table}>
            <thead><tr>{['Student','Assignment','Course','Date','Status'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {data?.recent_submissions?.length ? data.recent_submissions.map(sub => (
                <tr key={sub.id} style={styles.tableRowHover}>
                  <td style={styles.td}>{sub.student_fullname}</td>
                  <td style={styles.td}>{sub.assignment_title}</td>
                  <td style={styles.td}>{sub.course_name}</td>
                  <td style={styles.td}>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <span style={{...styles.statusBadge, ...(sub.status === 'graded' ? styles.gradedBadge : styles.pendingBadge)}}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={styles.emptyRow}>No submissions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STYLES — Clean, Modern, Professional
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#475569',
  },
  navbar: {
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '900',
    color: 'white',
    margin: 0,
  },
  roleBadge: {
    background: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  userInfo: {
    textAlign: 'right',
    color: 'white',
  },
  userName: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
  },
  userEmail: {
    display: 'block',
    fontSize: '13px',
    opacity: 0.9,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  tabBar: {
    background: 'white',
    display: 'flex',
    padding: '0 40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    overflowX: 'auto',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '20px 28px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: '#64748b',
    borderBottom: '4px solid transparent',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    color: '#7c3aed',
    borderBottom: '4px solid #7c3aed',
  },
  mainContent: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  tabContent: {
    animation: 'fadeIn 0.4s ease',
  },
  pageTitle: {
    fontSize: '36px',
    fontWeight: '900',
    color: '#1e293b',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: '18px',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto 48px',
    lineHeight: '1.6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
    margin: '48px 0',
  },
  statCard: {
    background: 'white',
    padding: '32px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease',
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#7c3aed',
    display: 'block',
  },
  statLabel: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '8px',
    fontWeight: '600',
  },
  infoBox: {
    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #0ea5e9',
    marginTop: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  sectionDesc: {
    color: '#64748b',
    fontSize: '16px',
    marginBottom: '32px',
  },
  btnPrimary: {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '15px',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
  },
  placeholder: {
    background: '#f8fafc',
    padding: '80px 40px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '2px dashed #cbd5e1',
    color: '#94a3b8',
    fontSize: '18px',
    fontStyle: 'italic',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  miniStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  miniStat: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  miniStatNumber: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#7c3aed',
  },
  miniStatLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  filtersCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '16px',
  },
  searchIconSpan: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 45px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  filterSelect: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
  },
  sortOrderBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#e0e7ff',
    color: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  resultsCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  tableCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f8fafc',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    borderBottom: '2px solid #e2e8f0',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#1e293b',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
  },
  userFullname: {
    fontWeight: '600',
    color: '#0f172a',
  },
  userIdText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  roleBadge: {
    padding: '5px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
  },
  profBadge: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  studentBadge: {
    background: '#d1fae5',
    color: '#065f46',
  },
  statusDot: {
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusActiveColor: {
    color: '#10b981',
  },
  statusInactiveColor: {
    color: '#ef4444',
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
  },
  btnEdit: {
    background: '#e0e7ff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  btnDelete: {
    background: '#fee2e2',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  emptyCell: {
    padding: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '16px',
  },
  btnSecondary: {
    background: '#e0e7ff',
    color: '#7c3aed',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  paginationBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 0',
  },
  paginationBtn: {
    background: 'white',
    border: '2px solid #e2e8f0',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    transition: 'all 0.2s',
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paginationPages: {
    display: 'flex',
    gap: '6px',
  },
  pageNumber: {
    background: 'white',
    border: '2px solid #e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    minWidth: '38px',
    transition: 'all 0.2s',
  },
  pageNumberActive: {
    background: '#7c3aed',
    color: 'white',
    borderColor: '#7c3aed',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '560px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  errorAlert: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  formField: {
    marginBottom: '18px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    marginBottom: '18px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  btnCancel: {
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnSubmit: {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
  },
  
  // Delete Modal Warning
  warningBox: {
    background: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '10px',
    padding: '18px',
    display: 'flex',
    gap: '14px',
    marginBottom: '20px',
  },
  warningIcon: {
    fontSize: '28px',
  },
  warningTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '6px',
  },
  warningText: {
    fontSize: '14px',
    color: '#991b1b',
    marginBottom: '10px',
  },
  deleteUserInfo: {
    background: 'white',
    padding: '10px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
  },loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  miniStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  miniStat: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  miniStatNumber: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#7c3aed',
  },
  miniStatLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  filtersCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '16px',
  },
  searchIconSpan: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 45px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  filterSelect: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
  },
  sortOrderBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#e0e7ff',
    color: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  resultsCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  tableCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f8fafc',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    borderBottom: '2px solid #e2e8f0',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#1e293b',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
  },
  userFullname: {
    fontWeight: '600',
    color: '#0f172a',
  },
  userIdText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  roleBadge: {
    padding: '5px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
  },
  profBadge: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  studentBadge: {
    background: '#d1fae5',
    color: '#065f46',
  },
  statusDot: {
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusActiveColor: {
    color: '#10b981',
  },
  statusInactiveColor: {
    color: '#ef4444',
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
  },
  btnEdit: {
    background: '#e0e7ff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  btnDelete: {
    background: '#fee2e2',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  emptyCell: {
    padding: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '16px',
  },
  btnSecondary: {
    background: '#e0e7ff',
    color: '#7c3aed',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  paginationBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 0',
  },
  paginationBtn: {
    background: 'white',
    border: '2px solid #e2e8f0',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    transition: 'all 0.2s',
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paginationPages: {
    display: 'flex',
    gap: '6px',
  },
  pageNumber: {
    background: 'white',
    border: '2px solid #e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    minWidth: '38px',
    transition: 'all 0.2s',
  },
  pageNumberActive: {
    background: '#7c3aed',
    color: 'white',
    borderColor: '#7c3aed',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '560px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  errorAlert: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  formField: {
    marginBottom: '18px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    marginBottom: '18px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  btnCancel: {
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnSubmit: {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
  },
  
  // Delete Modal Warning
  warningBox: {
    background: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '10px',
    padding: '18px',
    display: 'flex',
    gap: '14px',
    marginBottom: '20px',
  },
  warningIcon: {
    fontSize: '28px',
  },
  warningTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '6px',
  },
  warningText: {
    fontSize: '14px',
    color: '#991b1b',
    marginBottom: '10px',
  },
  deleteUserInfo: {
    background: 'white',
    padding: '10px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
  },

// === ADD ALL THESE NEW STYLES BELOW ===

  heroHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: 'white',
    padding: '32px 40px',
    borderRadius: '20px',
    marginBottom: '32px',
    boxShadow: '0 12px 40px rgba(124,58,237,0.3)'
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  heroIcon: {
    fontSize: '48px'
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: 800,
    margin: 0
  },
  heroSubtitle: {
    opacity: 0.9,
    fontSize: '15px',
    margin: '8px 0 0'
  },
  refreshBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  refreshBtnError: {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  glassCard: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)', // Safari support
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
    transition: 'all 0.3s'
  },
  glassCardCentered: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  cardIcon: {
    fontSize: '28px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e293b'
  },
  cardBigNumber: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '8px 0'
  },
  progressBar: {
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '16px 0'
  },
  progressFill: {
    height: '100%',
    background: '#7c3aed',
    borderRadius: '4px',
    transition: 'width 0.8s ease'
  },
  miniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
    marginTop: '16px'
  },
  miniNumber: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a'
  },

  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '40px'
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '20px'
  },
  donutContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  donutSvg: {
    width: '220px',
    height: '220px',
    transform: 'rotate(-90deg)'
  },
  donutCenter: {
    fontSize: '32px',
    fontWeight: 800,
    fill: '#0f172a'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '20px',
    fontSize: '14px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px'
  },

  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '200px',
    padding: '0 20px'
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  barFill: {
    width: '40px',
    background: 'linear-gradient(to top, #7c3aed, #a855f7)',
    borderRadius: '8px 8px 0 0',
    transition: 'height 0.6s ease'
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a'
  },
  barDate: {
    fontSize: '12px',
    color: '#64748b',
    transform: 'rotate(-30deg)',
    width: '80px',
    textAlign: 'center'
  },

  tablesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  tableIcon: {
    fontSize: '28px'
  },
  tableTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a'
  },
  tableRowHover: {
    transition: 'background 0.3s',
    cursor: 'pointer'
  },
  gradedBadge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600
  },
  pendingBadge: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600
  },

  spinner: {
    width: '48px',
    height: '48px',
    border: '5px solid #e2e8f0',
    borderTop: '5px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '18px',
    marginTop: '16px',
    color: '#475569'
  },
  errorText: {
    fontSize: '18px',
    color: '#dc2626',
    marginBottom: '16px'
  },
  emptyChart: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: '40px'
  },
  emptyRow: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
    fontSize: '16px'
  },
};


// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    input:focus, select:focus {
      border-color: #7c3aed !important;
    }
    
    button:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    tr:hover {
      background: #f8fafc;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default AdminDashboard;