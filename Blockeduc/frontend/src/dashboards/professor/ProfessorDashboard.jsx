import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'professor') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    setLoading(false);
    
    // TODO: Fetch professor data
    // fetchMyCourses();
    // fetchMyAssignments();
    // fetchSubmissions();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <h1 style={styles.logo}>🎓 BlockEduc</h1>
          <span style={styles.professorBadge}>Professor</span>
        </div>
        
        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.fullname || 'Professor'}</span>
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
          onClick={() => setActiveTab('courses')}
          style={{...styles.tab, ...(activeTab === 'courses' ? styles.tabActive : {})}}
        >
          📚 My Courses
        </button>
        
        <button
          onClick={() => setActiveTab('assignments')}
          style={{...styles.tab, ...(activeTab === 'assignments' ? styles.tabActive : {})}}
        >
          📝 Assignments
        </button>
        
        <button
          onClick={() => setActiveTab('submissions')}
          style={{...styles.tab, ...(activeTab === 'submissions' ? styles.tabActive : {})}}
        >
          📤 Submissions
        </button>
        
        <button
          onClick={() => setActiveTab('grading')}
          style={{...styles.tab, ...(activeTab === 'grading' ? styles.tabActive : {})}}
        >
          ✅ Grading
        </button>
        
        <button
          onClick={() => setActiveTab('announcements')}
          style={{...styles.tab, ...(activeTab === 'announcements' ? styles.tabActive : {})}}
        >
          📢 Announcements
        </button>
        
        <button
          onClick={() => setActiveTab('blockchain')}
          style={{...styles.tab, ...(activeTab === 'blockchain' ? styles.tabActive : {})}}
        >
          ⛓️ Blockchain
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'assignments' && (
          <AssignmentsTab 
            onCreateNew={() => setShowCreateAssignment(true)}
            onRefresh={() => window.dispatchEvent(new Event('refreshAssignments'))}
          />
        )}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'grading' && <GradingTab onGrade={(submission) => {
          setSelectedSubmission(submission);
          setShowGradeModal(true);
        }} />}
        {activeTab === 'announcements' && <AnnouncementsTab onCreateNew={() => setShowCreateAnnouncement(true)} />}

        {showCreateAnnouncement && (
          <CreateAnnouncementModal 
            onClose={() => setShowCreateAnnouncement(false)}
            onSuccess={() => {
              // Force refresh des annonces
              window.location.reload(); // ou tu peux faire un fetch plus propre
            }}
          />
        )}
        {activeTab === 'blockchain' && <BlockchainTab />}
      </div>

      {/* Modals */}
      {showCreateAssignment && (
      <CreateAssignmentModal 
        onClose={() => setShowCreateAssignment(false)}
        onRefresh={() => window.dispatchEvent(new Event('refreshAssignments'))}
      />
      )}
      {showCreateAnnouncement && <CreateAnnouncementModal onClose={() => setShowCreateAnnouncement(false)} />}
      {showGradeModal && <GradeSubmissionModal submission={selectedSubmission} onClose={() => setShowGradeModal(false)} />}
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const CoursesTab = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "professor") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/courses/?professor_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement des cours");

        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '40px' }}>
        Chargement des cours...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, color: 'red', textAlign: 'center', padding: '40px' }}>
        Erreur : {error}
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>My Courses</h2>
          <p style={styles.tabSubtitle}>Manage your courses and enrolled students</p>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        {courses.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            color: '#64748b',
            fontSize: '18px'
          }}>
            Aucun cours assigné pour le moment.<br />
            Contactez l'administrateur si cela semble incorrect.
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} style={styles.courseCard}>
              <div style={styles.courseHeader}>
                <span style={styles.courseCode}>{course.course_code}</span>
                <span style={styles.enrollmentBadge}>Students: {course.enrollments}</span>
              </div>
              <h3 style={styles.courseTitle}>{course.course_name}</h3>
              <p style={styles.courseDescription}>
                {course.description || 'Aucune description disponible.'}
              </p>
              <div style={styles.courseStats}>
                <span>Assignments: {course.assignments}</span>
              </div>
              <button style={styles.btnPrimary}>View Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


const AssignmentsTab = ({ onCreateNew }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "professor") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/assignments/?professor_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement des devoirs");

        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '40px' }}>
        Chargement des devoirs...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, color: 'red', textAlign: 'center', padding: '40px' }}>
        Erreur : {error}
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>My Assignments</h2>
          <p style={styles.tabSubtitle}>Create and manage assignments for your courses</p>
        </div>
        <button onClick={onCreateNew} style={styles.btnCreate}>
          + Create New Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          color: '#64748b',
          fontSize: '18px'
        }}>
          Aucun devoir créé pour le moment.<br />
          Cliquez sur "Create New Assignment" pour commencer.
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Assignment Title</th>
                <th style={styles.th}>Course</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Submissions</th>
                <th style={styles.th}>Blockchain TX</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id}>
                  <td style={styles.td}>
                    <strong>{assignment.title}</strong>
                    <br />
                    <small style={styles.smallText}>Created: {new Date(assignment.created_at).toLocaleDateString()}</small>
                  </td>
                  <td style={styles.td}>{assignment.course_name} ({assignment.course_code})</td>
                  <td style={styles.td}>{new Date(assignment.due_date).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={styles.progressText}>
                      {assignment.submissions_count || 0}/{assignment.total_students || 0}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {assignment.blockchain_transaction_hash ? (
                      <code style={styles.txHash}>
                        {assignment.blockchain_transaction_hash.slice(0, 10)}...
                      </code>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button style={styles.btnSmall}>View</button>
                      <button style={styles.btnSmallSecondary}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "professor") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/professor/submissions/?professor_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement");

        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '80px' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Chargement des soumissions reçues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '80px' }}>
        <p style={{ color: '#dc2626', fontSize: '18px' }}>Erreur : {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>Received Submissions</h2>
          <p style={styles.tabSubtitle}>All encrypted submissions from your students</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '100px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          color: '#64748b',
          fontSize: '19px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          📭 Aucune soumission reçue pour le moment.<br /><br />
          Les réponses chiffrées des étudiants apparaîtront ici dès qu'ils auront soumis un devoir.
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Assignment</th>
                <th style={styles.th}>Course</th>
                <th style={styles.th}>Submitted At</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Encrypted Content Preview</th>
                <th style={styles.th}>Blockchain Proof</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td style={styles.td}>
                    <strong>{sub.student_fullname}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{sub.student_email}</small>
                  </td>
                  <td style={styles.td}>
                    <strong>{sub.assignment_title}</strong>
                  </td>
                  <td style={styles.td}>
                    {sub.course_name}
                    <br />
                    <small style={{ color: '#64748b' }}>({sub.course_code})</small>
                  </td>
                  <td style={styles.td}>
                    {new Date(sub.submitted_at).toLocaleDateString('fr-FR')} à {new Date(sub.submitted_at).toLocaleTimeString('fr-FR')}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(sub.status === 'graded' ? styles.statusGraded : styles.statusPending)
                    }}>
                      {sub.status === 'graded' ? '✅ Noté' : '⏳ En attente'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <code style={{ ...styles.encryptedContent, fontSize: '12px' }}>
                      {sub.encrypted_content.substring(0, 60)}...
                    </code>
                  </td>
                  <td style={styles.td}>
                    {sub.blockchain_transaction_hash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${sub.blockchain_transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1e40af' }}
                      >
                        <code style={styles.txHash}>
                          {sub.blockchain_transaction_hash.substring(0, 10)}...
                        </code>
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const GradingTab = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  useEffect(() => {
    const fetchPendingSubmissions = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "professor") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/professor/pending-submissions/?professor_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement des soumissions en attente");

        const data = await response.json();
        setPendingSubmissions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingSubmissions();
  }, []);

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setShowGradeModal(true);
  };

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '100px' }}>
        <p style={{ fontSize: '19px', color: '#64748b' }}>Chargement des soumissions à noter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '100px' }}>
        <p style={{ color: '#dc2626', fontSize: '19px' }}>Erreur : {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>Noter les soumissions</h2>
          <p style={styles.tabSubtitle}>Déchiffrer les réponses chiffrées et attribuer une note</p>
        </div>
      </div>

      {pendingSubmissions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '120px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          color: '#64748b',
          fontSize: '20px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          ✅ Félicitations !<br /><br />
          Toutes les soumissions ont été notées.<br />
          Aucune action requise pour le moment.
        </div>
      ) : (
        <div style={styles.gradingGrid}>
          {pendingSubmissions.map((sub) => (
            <div key={sub.id} style={styles.gradingCard}>
              <div style={styles.gradingHeader}>
                <div>
                  <h3 style={styles.studentName}>{sub.student_fullname}</h3>
                  <p style={styles.studentEmail}>{sub.student_email}</p>
                </div>
                <span style={styles.pendingBadge}>⏳ En attente de notation</span>
              </div>

              <div style={styles.gradingBody}>
                <p style={styles.assignmentTitle}>📝 Devoir : {sub.assignment_title}</p>
                <p style={styles.submittedDate}>
                  Soumis le {new Date(sub.submitted_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                <div style={styles.encryptedBox}>
                  <p style={styles.encryptedLabel}>🔒 Contenu chiffré (RSA-2048) :</p>
                  <code style={styles.encryptedContent}>
                    {sub.encrypted_content.substring(0, 100)}...
                  </code>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '14px', color: '#92400e' }}>
                  <strong>Hash étudiant (anti-plagiat) :</strong><br />
                  <code>{sub.student_id_hash}</code>
                </div>
              </div>

              <div style={styles.gradingActions}>
                <button 
                  style={styles.btnGrade}
                  onClick={() => openGradeModal(sub)}
                >
                  🔓 Déchiffrer & Noter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de notation */}
      {showGradeModal && selectedSubmission && (
        <GradeSubmissionModal
          submission={selectedSubmission}
          onClose={() => {
            setShowGradeModal(false);
            setSelectedSubmission(null);
          }}
          onSuccess={() => {
            window.location.reload(); // ou re-fetch
          }}
        />
      )}
    </div>
  );
};


const AnnouncementsTab = ({ onCreateNew }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== "professor") {
      setError("Access denied");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/professor/announcements/?professor_email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) throw new Error("Failed to load announcements");

      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRefresh = () => {
    fetchAnnouncements();
  };

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '40px' }}>
        Loading announcements...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, color: 'red', textAlign: 'center', padding: '40px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>My Announcements</h2>
          <p style={styles.tabSubtitle}>Share updates and information with your students</p>
        </div>
        <button onClick={onCreateNew} style={styles.btnCreate}>
          + New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          color: '#64748b',
          fontSize: '18px'
        }}>
          No announcements yet.<br />
          Click "New Announcement" to inform your students.
        </div>
      ) : (
        <div style={styles.announcementsList}>
          {announcements.map(ann => (
            <div key={ann.id} style={styles.announcementCard}>
              <div style={styles.announcementHeader}>
                <h3 style={styles.announcementTitle}>{ann.title}</h3>
                <span style={styles.announcementDate}>
                  {new Date(ann.created_at).toLocaleDateString()} at {new Date(ann.created_at).toLocaleTimeString()}
                </span>
              </div>
              {ann.course_name && (
                <p style={styles.announcementCourse}>📚 {ann.course_name}</p>
              )}
              {!ann.course_name && (
                <p style={styles.announcementCourse}>🌍 Global Announcement (all students)</p>
              )}
              <p style={styles.announcementContent}>{ann.content}</p>
              <div style={styles.announcementActions}>
                <button style={styles.btnSmallSecondary} onClick={handleRefresh}>
                  🔄 Refresh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const BlockchainTab = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlockchainData = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/blockchain/info/?user_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Failed to load blockchain data");

        const data = await response.json();
        setBlockchainInfo(data.blockchain_info);
        setTransactions(data.transactions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchainData();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '100px' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Loading blockchain data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '100px' }}>
        <p style={{ color: '#dc2626', fontSize: '18px' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Blockchain Transactions</h2>
      <p style={styles.tabSubtitle}>View all blockchain transactions related to your activities</p>
      
      {/* Network Info */}
      <div style={styles.blockchainInfo}>
        <div style={styles.blockchainStat}>
          <span style={styles.statLabel}>Network Status</span>
          <span style={styles.statValue}>
            {blockchainInfo?.connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div style={styles.blockchainStat}>
          <span style={styles.statLabel}>Current Block</span>
          <span style={styles.statValue}>{blockchainInfo?.block_number || 'N/A'}</span>
        </div>
        <div style={styles.blockchainStat}>
          <span style={styles.statLabel}>Chain ID</span>
          <span style={styles.statValue}>{blockchainInfo?.chain_id || 'N/A'}</span>
        </div>
        <div style={styles.blockchainStat}>
          <span style={styles.statLabel}>Total Transactions</span>
          <span style={styles.statValue}>{transactions.length}</span>
        </div>
      </div>

      {/* Contract Stats */}
      {blockchainInfo && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>
            📊 Smart Contract Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Total Assignments</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                {blockchainInfo.assignment_count || 0}
              </p>
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Total Submissions</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {blockchainInfo.submission_count || 0}
              </p>
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Total Grades</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {blockchainInfo.result_count || 0}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
            <code style={{ fontSize: '13px', color: '#166534' }}>
              Contract Address: {blockchainInfo.contract_address}
            </code>
          </div>
        </div>
      )}
      
      {/* Transactions List */}
      <div style={styles.transactionsList}>
        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '12px',
            color: '#64748b'
          }}>
            No blockchain transactions yet.
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} style={styles.transactionCard}>
              <div style={styles.transactionIcon}>
                {tx.type === 'Assignment Created' && '📝'}
                {tx.type === 'Submission Received' && '📤'}
                {tx.type === 'Grade Published' && '✅'}
                {tx.type === 'Grade Received' && '🎯'}
              </div>
              <div style={styles.transactionDetails}>
                <h4 style={styles.transactionType}>{tx.type}</h4>
                <p style={styles.transactionInfo}>{tx.details}</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <code style={styles.transactionHash}>
                    TX: {tx.tx_hash.substring(0, 20)}...
                  </code>
                  {tx.blockchain_id && (
                    <code style={{ ...styles.transactionHash, background: '#dbeafe' }}>
                      ID: #{tx.blockchain_id}
                    </code>
                  )}
                </div>
              </div>
              <div style={styles.transactionTime}>
                <span style={styles.timestamp}>
                  {new Date(tx.timestamp).toLocaleDateString()} at{' '}
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
                <span style={{
                  padding: '4px 12px',
                  background: '#d1fae5',
                  color: '#065f46',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// MODAL COMPONENTS
// ============================================

const CreateAssignmentModal = ({ onClose, onRefresh }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
  });

  useEffect(() => {
    const loadCourses = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) return;

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/courses/?professor_email=${encodeURIComponent(user.email)}`
        );
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    loadCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.course_id) {
      alert("Please select a course.");
      return;
    }

    setLoading(true);

    try {
      // Generate RSA-2048 key pair in browser (secure)
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Export public key in PEM format
      const publicKeyExported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)));
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;

      // Export private key (for professor only)
      const privateKeyExported = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyExported)));
      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

      // Copy private key to clipboard
      await navigator.clipboard.writeText(privateKeyPem);

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('http://127.0.0.1:8000/api/assignments/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          course_id: formData.course_id,
          due_date: formData.due_date,
          public_key: publicKeyPem,
          professor_email: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create assignment");
      }

      const assignment = await response.json();

      alert(
        `Assignment created successfully!\n\n` +
        `Title: ${assignment.title}\n` +
        `Course: ${assignment.course_name} (${assignment.course_code})\n` +
        `Due Date: ${new Date(assignment.due_date).toLocaleString()}\n\n` +
        `Public key saved on server.\n` +
        `PRIVATE KEY COPIED TO CLIPBOARD\n\n` +
        `SAVE IT SECURELY!\n` +
        `It will never be shown or stored again.\n` +
        `You will need it to decrypt student submissions.`
      );

      onRefresh?.();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '700px', width: '95%' }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Create New Assignment</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Assignment Title *</label>
            <input
              type="text"
              placeholder="e.g., Final Project - Blockchain Architecture"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              placeholder="Describe the requirements, objectives, and grading criteria..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="6"
              disabled={loading}
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
              disabled={loading}
              style={styles.select}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} — {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Due Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={{
            background: '#fffbeb',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #f59e0b',
            margin: '20px 0'
          }}>
            <p style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#92400e',
              lineHeight: '1.6'
            }}>
              A 2048-bit RSA key pair will be generated in your browser.<br />
              • The <strong>public key</strong> will be sent to the server and shared with students.<br />
              • The <strong>private key</strong> will be copied to your clipboard.<br /><br />
              <strong style={{ color: '#dc2626' }}>
                SAVE IT IMMEDIATELY AND SECURELY!
              </strong><br />
              It will never be stored or displayed again.
            </p>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              style={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create & Publish on Blockchain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateAnnouncementModal = ({ onClose, onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    course_id: '', // '' = global announcement
  });

  useEffect(() => {
    const loadCourses = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) return;

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/courses/?professor_email=${encodeURIComponent(user.email)}`
        );
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    loadCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        title: formData.title,
        content: formData.content,
        course_id: formData.course_id || null,
        professor_email: user.email,
      };

      const response = await fetch('http://127.0.0.1:8000/api/announcements/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create announcement");
      }

      alert("Announcement created and published successfully!");
      onSuccess?.(); // Refresh the list
      onClose();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '700px', width: '95%' }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Create New Announcement</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              placeholder="e.g., Exam date changed"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Message *</label>
            <textarea
              placeholder="Write your announcement here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows="8"
              disabled={loading}
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Target Course (optional)</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              disabled={loading}
              style={styles.select}
            >
              <option value="">All students (global announcement)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} — {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            background: '#f0fdf4',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #bbf7d0',
            margin: '20px 0'
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#166534' }}>
              <strong>ℹ️ Information:</strong><br />
              • This announcement will be visible to selected students.<br />
              • It will be permanently recorded (blockchain ready).
            </p>
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              style={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GradeSubmissionModal = ({ submission, onClose, onSuccess }) => {
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedContent, setDecryptedContent] = useState('');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDecrypt = async () => {
    if (!privateKey.trim()) {
      setError("Veuillez coller votre clé privée.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Nettoyer la clé privée PEM
      const cleanPem = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
      const binaryDer = Uint8Array.from(atob(cleanPem), c => c.charCodeAt(0));

      const privKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );

      // Déchiffrement
      const encryptedBytes = Uint8Array.from(atob(submission.encrypted_content), c => c.charCodeAt(0));
      const decrypted = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privKey,
        encryptedBytes
      );

      const text = new TextDecoder().decode(decrypted);
      setDecryptedContent(text);
    } catch (err) {
      console.error("Erreur déchiffrement:", err);
      setError("Clé privée invalide ou contenu corrompu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!grade || grade < 0 || grade > 20) {
      setError("Note entre 0 et 20 requise.");
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('http://127.0.0.1:8000/api/professor/grade-submission/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          grade: parseFloat(grade),
          feedback: feedback,
          professor_email: user.email,
        }),
      });

      if (!response.ok) throw new Error("Échec de l'enregistrement de la note");

      alert("Note enregistrée avec succès !");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '800px', width: '95%' }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Noter : {submission.student_fullname}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Devoir</label>
            <p style={{ margin: '8px 0', fontWeight: '600' }}>{submission.assignment_title}</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Clé privée (PEM) *</label>
            <textarea
              placeholder="Collez votre clé privée ici (-----BEGIN PRIVATE KEY----- ...)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              rows="6"
              style={styles.textarea}
            />
            <button onClick={handleDecrypt} style={styles.btnDecrypt} disabled={loading}>
              {loading ? 'Déchiffrement...' : 'Déchiffrer le contenu'}
            </button>
          </div>

          {decryptedContent && (
            <div style={{ margin: '20px 0', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <p style={{ fontWeight: '600', color: '#166534', margin: '0 0 12px 0' }}>Contenu déchiffré :</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#15803d', margin: 0 }}>
                {decryptedContent}
              </pre>
            </div>
          )}

          {error && (
            <div style={{ color: '#dc2626', background: '#fee2e2', padding: '12px', borderRadius: '8px', margin: '16px 0' }}>
              <strong>Erreur :</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmitGrade}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Note /20 *</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Feedback</label>
              <textarea
                placeholder="Commentaires constructifs..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="4"
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={onClose} style={styles.btnCancel}>
                Annuler
              </button>
              <button type="submit" style={styles.btnSubmit} disabled={loading || !decryptedContent}>
                {loading ? 'Enregistrement...' : 'Enregistrer la note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  
  // Navbar
  navbar: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'white',
    margin: 0,
  },
  professorBadge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    color: 'white',
    fontWeight: '600',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    color: 'white',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '600',
  },
  userEmail: {
    fontSize: '12px',
    opacity: 0.8,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  
  // Tab Bar
  tabBar: {
    background: 'white',
    display: 'flex',
    padding: '0 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    gap: '5px',
    overflowX: 'auto',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '16px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#1e40af',
    borderBottom: '3px solid #1e40af',
  },
  
  // Main Content
  mainContent: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  tabContent: {
    animation: 'fadeIn 0.3s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  tabTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  tabSubtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  btnCreate: {
    background: '#1e40af',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
  },
  
  // Cards
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  courseCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  courseCode: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700',
  },
  enrollmentBadge: {
    fontSize: '13px',
    color: '#64748b',
  },
  courseTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 12px 0',
  },
  courseDescription: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  courseStats: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '16px',
  },
  btnPrimary: {
    background: '#1e40af',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    width: '100%',
  },
  
  // Table
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e2e8f0',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '600',
  },
  td: {
    padding: '16px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    color: '#1e293b',
  },
  smallText: {
    color: '#94a3b8',
    fontSize: '12px',
  },
  progressText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  txHash: {
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  btnSmall: {
    background: '#1e40af',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  btnSmallSecondary: {
    background: '#e0e7ff',
    color: '#1e40af',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  btnSmallDanger: {
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusPending: {
    background: '#fef3c7',
    color: '#d97706',
  },
  statusGraded: {
    background: '#d1fae5',
    color: '#065f46',
  },
  
  // Grading
  gradingGrid: {
    display: 'grid',
    gap: '24px',
  },
  gradingCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  gradingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  studentName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  studentEmail: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  pendingBadge: {
    background: '#fef3c7',
    color: '#d97706',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  gradingBody: {
    marginBottom: '20px',
  },
  assignmentTitle: {
    fontSize: '16px',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  submittedDate: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  encryptedBox: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
  },
  encryptedLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  encryptedContent: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#64748b',
    wordBreak: 'break-all',
  },
  gradingActions: {
    display: 'flex',
    gap: '12px',
  },
  btnDecrypt: {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
  },
  btnGrade: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
  },
  
  // Announcements
  announcementsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  announcementCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #1e40af',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  announcementTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  announcementDate: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  announcementCourse: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '12px',
  },
  announcementContent: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  announcementActions: {
    display: 'flex',
    gap: '8px',
  },
  
  // Blockchain
  blockchainInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  blockchainStat: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  transactionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  transactionIcon: {
    fontSize: '32px',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  transactionInfo: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px 0',
  },
  transactionHash: {
    fontSize: '12px',
    fontFamily: 'monospace',
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  transactionTime: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  btnViewOnChain: {
    background: '#e0e7ff',
    color: '#1e40af',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  
  // Modal
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
    padding: '0',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
  },
  form: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  infoBox: {
    background: '#f0f9ff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
    marginBottom: '20px',
  },
  infoText: {
    fontSize: '13px',
    color: '#0c4a6e',
    margin: 0,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
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
    background: '#1e40af',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  submissionInfo: {
    padding: '24px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  decryptSection: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
  },
  decryptedBox: {
    marginTop: '16px',
    background: '#f0fdf4',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
  },
  decryptedLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#166534',
    margin: '0 0 8px 0',
  },
  decryptedContent: {
    fontSize: '14px',
    color: '#15803d',
    lineHeight: '1.6',
  },
};

export default ProfessorDashboard;