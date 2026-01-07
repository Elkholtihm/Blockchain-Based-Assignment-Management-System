import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showSubmitAssignment, setShowSubmitAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'student') {
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
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <h1 style={styles.logo}>🎓 BlockEduc</h1>
          <span style={styles.professorBadge}>Student</span>
        </div>
        
        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.fullname || 'Student'}</span>
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
          📤 My Submissions
        </button>
        
        <button
          onClick={() => setActiveTab('grades')}
          style={{...styles.tab, ...(activeTab === 'grades' ? styles.tabActive : {})}}
        >
          ✅ Grades
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
        {activeTab === 'assignments' && <AssignmentsTab onSubmit={(assignment) => {
          setSelectedAssignment(assignment);
          setShowSubmitAssignment(true);
        }} />}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'grades' && <GradesTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'blockchain' && <BlockchainTab />}
      </div>

      {/* Modals */}
      {showSubmitAssignment && (
      <SubmitAssignmentModal 
        assignment={selectedAssignment} 
        onClose={() => setShowSubmitAssignment(false)}
        onSuccess={() => {
          // Refresh la liste des devoirs pour mettre à jour has_submitted
          // Tu peux re-fetch ou juste recharger
          window.location.reload();
        }}
      />
    )}
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
      if (user.role !== "student") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/student/courses/?student_email=${encodeURIComponent(user.email)}`
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
          <p style={styles.tabSubtitle}>View your enrolled courses</p>
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
            Vous n'êtes inscrit à aucun cours pour le moment.<br />
            Contactez l'administrateur si cela semble incorrect.
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} style={styles.courseCard}>
              <div style={styles.courseHeader}>
                <span style={styles.courseCode}>{course.course_code}</span>
                <span style={styles.enrollmentBadge}>Professor: Pr. {course.professor_fullname}</span>
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

const AssignmentsTab = ({ onSubmit }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states for details
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showPublicKeyModal, setShowPublicKeyModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "student") {
        setError("Access denied.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/student/assignments/?student_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) {
          throw new Error("Failed to load assignments.");
        }

        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const openDescriptionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDescriptionModal(true);
  };

  const openPublicKeyModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowPublicKeyModal(true);
  };

  const copyPublicKey = () => {
    navigator.clipboard.writeText(selectedAssignment.public_key);
    alert("Public key copied to clipboard!");
  };

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '40px' }}>
        Loading assignments...
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
          <h2 style={styles.tabTitle}>My Assignments</h2>
          <p style={styles.tabSubtitle}>View details and submit encrypted responses</p>
        </div>
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
          No assignments have been assigned yet.
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Assignment</th>
                <th style={styles.th}>Course</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Blockchain Proof</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Submit</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const isSubmitted = assignment.has_submitted === true;
                const isOverdue = new Date() > new Date(assignment.due_date);
                const canSubmit = !isSubmitted && !isOverdue;

                return (
                  <tr key={assignment.id}>
                    <td style={styles.td}>
                      <strong>{assignment.title}</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        by {assignment.professor_fullname || 'Professor'}
                      </small>
                      <br />
                      <small style={styles.smallText}>
                        Created: {new Date(assignment.created_at).toLocaleDateString()}
                      </small>
                      {assignment.description && (
                        <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#475569' }}>
                          {assignment.description.length > 100
                            ? assignment.description.substring(0, 100) + '...'
                            : assignment.description}
                        </p>
                      )}
                    </td>

                    <td style={styles.td}>
                      {assignment.course_name}
                      <br />
                      <small style={{ color: '#64748b' }}>({assignment.course_code})</small>
                    </td>

                    <td style={styles.td}>
                      {new Date(assignment.due_date).toLocaleString()}
                      {isOverdue && (
                        <span style={{ color: '#dc2626', marginLeft: '8px', fontWeight: '600' }}>
                          (Overdue)
                        </span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(isSubmitted ? styles.statusGraded : styles.statusPending)
                      }}>
                        {isSubmitted ? '✅ Submitted' : '⏳ Pending'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {assignment.blockchain_transaction_hash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${assignment.blockchain_transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1e40af' }}
                        >
                          <code style={styles.txHash}>
                            {assignment.blockchain_transaction_hash.substring(0, 10)}...
                          </code>
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Pending</span>
                      )}
                    </td>

                    {/* Details Buttons */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          style={{ ...styles.btnSmallSecondary, fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => openDescriptionModal(assignment)}
                        >
                          📄 View Description
                        </button>
                        <button
                          style={{ ...styles.btnSmallSecondary, fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => openPublicKeyModal(assignment)}
                        >
                          🔑 View Public Key
                        </button>
                      </div>
                    </td>

                    {/* Submit Button */}
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.btnSmall,
                          opacity: canSubmit ? 1 : 0.5,
                          cursor: canSubmit ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => canSubmit && onSubmit(assignment)}
                        disabled={!canSubmit}
                      >
                        {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Submit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Description Modal */}
      {showDescriptionModal && selectedAssignment && (
        <div style={styles.modalOverlay} onClick={() => setShowDescriptionModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Assignment Description</h2>
              <button onClick={() => setShowDescriptionModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e40af' }}>{selectedAssignment.title}</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px', color: '#334155' }}>
                {selectedAssignment.description || 'No description available.'}
              </p>
              <div style={styles.modalActions}>
                <button onClick={() => setShowDescriptionModal(false)} style={styles.btnSubmit}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public Key Modal */}
      {showPublicKeyModal && selectedAssignment && (
        <div style={styles.modalOverlay} onClick={() => setShowPublicKeyModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Public Key</h2>
              <button onClick={() => setShowPublicKeyModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#475569' }}>
                This public key is used to encrypt your submission. It is automatically applied when you click "Submit".
              </p>
              <pre style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {selectedAssignment.public_key}
              </pre>
              <div style={styles.modalActions}>
                <button onClick={copyPublicKey} style={styles.btnSmallSecondary}>
                  📋 Copy to Clipboard
                </button>
                <button onClick={() => setShowPublicKeyModal(false)} style={styles.btnSubmit}>
                  Close
                </button>
              </div>
            </div>
          </div>
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
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "student") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/student/submissions/?student_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement des soumissions");

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
        <p style={{ fontSize: '18px', color: '#64748b' }}>Chargement de vos soumissions...</p>
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
          <h2 style={styles.tabTitle}>My Submissions</h2>
          <p style={styles.tabSubtitle}>Track your submitted assignments, grades, and blockchain records</p>
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
          📭 Aucune soumission pour le moment.<br /><br />
          Une fois que vous aurez soumis un devoir chiffré, il apparaîtra ici avec son statut, sa note et la preuve blockchain.
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Assignment</th>
                <th style={styles.th}>Course</th>
                <th style={styles.th}>Professor</th>
                <th style={styles.th}>Submitted At</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Blockchain Proof</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td style={styles.td}>
                    <strong>{sub.assignment_title || sub.assignment}</strong>
                  </td>
                  <td style={styles.td}>
                    {sub.course_name}
                    <br />
                    <small style={{ color: '#64748b' }}>({sub.course_code})</small>
                  </td>
                  <td style={styles.td}>
                    Pr. {sub.professor_name || 'Unknown'}
                  </td>
                  <td style={styles.td}>
                    {new Date(sub.submitted_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(sub.status === 'graded' ? styles.statusGraded : styles.statusPending)
                    }}>
                      {sub.status === 'graded' ? '✅ Graded' : '⏳ Submitted'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: sub.status === 'graded' ? '#065f46' : '#d97706' }}>
                      {sub.grade !== null ? `${sub.grade}/20` : 'Pending'}
                    </strong>
                    {sub.feedback && (
                      <div style={{ marginTop: '6px', fontSize: '13px', color: '#475569' }}>
                        {sub.feedback}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {sub.blockchain_transaction_hash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${sub.blockchain_transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1e40af', textDecoration: 'none' }}
                      >
                        <code style={styles.txHash}>
                          {sub.blockchain_transaction_hash.substring(0, 12)}...
                        </code>
                        <br />
                        <small>View on Explorer ↗</small>
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>
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

const GradesTab = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "student") {
        setError("Accès refusé");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/student/grades/?student_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) throw new Error("Erreur de chargement des notes");

        const data = await response.json();
        setGrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '100px' }}>
        <p style={{ fontSize: '19px', color: '#64748b' }}>Chargement de vos notes...</p>
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
          <h2 style={styles.tabTitle}>Mes Notes</h2>
          <p style={styles.tabSubtitle}>Consultez vos notes et les retours de vos professeurs</p>
        </div>
      </div>

      {grades.length === 0 ? (
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
          📭 Aucune note pour le moment.<br /><br />
          Vos professeurs publieront vos notes ici une fois qu'ils auront corrigé vos devoirs.
        </div>
      ) : (
        <div style={styles.gradingGrid}>
          {grades.map((grade) => (
            <div key={grade.id} style={styles.gradingCard}>
              <div style={styles.gradingHeader}>
                <div>
                  <h3 style={styles.studentName}>{grade.assignment}</h3>
                  <p style={styles.studentEmail}>
                    📚 {grade.course_name} — Prof. {grade.professor_name}
                  </p>
                </div>
                <div style={{
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '24px',
                  fontWeight: '800'
                }}>
                  {grade.grade}/20
                </div>
              </div>

              <div style={styles.gradingBody}>
                <p style={styles.submittedDate}>
                  Noté le {new Date(grade.graded_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                {grade.feedback ? (
                  <div style={{
                    background: '#f0fdf4',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #bbf7d0',
                    marginTop: '16px'
                  }}>
                    <p style={{ fontWeight: '600', color: '#166534', margin: '0 0 8px 0' }}>
                      💬 Feedback du professeur :
                    </p>
                    <p style={{ margin: 0, color: '#15803d', lineHeight: '1.6' }}>
                      {grade.feedback}
                    </p>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '16px' }}>
                    Aucun commentaire pour cette note.
                  </p>
                )}

                {grade.blockchain_transaction_hash && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' }}>
                      🔗 Preuve blockchain (immuable) :
                    </p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${grade.blockchain_transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1e40af', fontWeight: '600' }}
                    >
                      Voir la transaction ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnnouncementsTab = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== "student") {
        setError("Access denied");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/student/announcements/?student_email=${encodeURIComponent(user.email)}`
        );

        if (!response.ok) {
          throw new Error("Failed to load announcements");
        }

        const data = await response.json();
        // Tri par date décroissante
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAnnouncements(data);
      } catch (err) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.tabContent, textAlign: 'center', padding: '60px' }}>
        Loading announcements...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.tabContent, color: 'red', textAlign: 'center', padding: '60px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.tabTitle}>Announcements</h2>
          <p style={styles.tabSubtitle}>Latest updates from your professors</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          color: '#64748b',
          fontSize: '18px'
        }}>
          No announcements yet.<br />
          Your professors will post important updates here.
        </div>
      ) : (
        <div style={styles.announcementsList}>
          {announcements.map((ann) => (
            <div key={ann.id} style={styles.announcementCard}>
              <div style={styles.announcementHeader}>
                <h3 style={styles.announcementTitle}>{ann.title}</h3>
                <span style={styles.announcementDate}>
                  {new Date(ann.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {ann.course_name ? (
                <p style={styles.announcementCourse}>
                  📚 {ann.course_name} ({ann.course_code})
                </p>
              ) : (
                <p style={styles.announcementCourse}>
                  🌍 Global Announcement
                </p>
              )}

              <p style={{ ...styles.announcementContent, whiteSpace: 'pre-wrap' }}>
                {ann.content}
              </p>

              <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                By Professor {ann.created_by_name || 'Unknown'}
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
        // ✅ USE THE UNIFIED ENDPOINT
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
const SubmitAssignmentModal = ({ assignment, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Veuillez écrire votre réponse avant de soumettre.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error("Vous n'êtes pas connecté.");

      const user = JSON.parse(userData);

      if (!assignment?.id || !assignment?.public_key) {
        throw new Error("Informations du devoir manquantes.");
      }

      // Hash étudiant (anti-plagiat)
      const encoder = new TextEncoder();
      const studentIdData = encoder.encode(user.email);
      const studentIdHashArray = await crypto.subtle.digest('SHA-256', studentIdData);
      const studentIdHashHex = Array.from(new Uint8Array(studentIdHashArray))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Contenu à chiffrer
      const contentToEncrypt = `${content.trim()}\n\n--- Hash étudiant (anti-plagiat): ${studentIdHashHex} ---`;

      // Import clé publique
      const cleanPem = assignment.public_key.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
      const binaryDer = Uint8Array.from(atob(cleanPem), c => c.charCodeAt(0));

      const publicKey = await crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      // Chiffrement
      const encrypted = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoder.encode(contentToEncrypt)
      );

      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

      // ENVOI À L'URL EXACTE
      const response = await fetch('http://127.0.0.1:8000/api/student/create/submissions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignment.id,
          encrypted_content: encryptedBase64,
          student_id_hash: studentIdHashHex,
          student_email: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Échec de la soumission");
      }

      alert("Soumission réussie !\nVotre réponse chiffrée a été enregistrée en toute sécurité.");
      onSuccess?.(); // Pour refresh
      onClose();

    } catch (err) {
      console.error("Erreur soumission:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Soumettre : {assignment?.title}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Votre réponse *</label>
            <textarea
              placeholder="Écrivez votre réponse complète ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="14"
              disabled={loading}
              style={styles.textarea}
            />
          </div>

          <div style={{
            background: '#fffbeb',
            padding: '18px',
            borderRadius: '10px',
            border: '2px solid #f59e0b',
            margin: '20px 0'
          }}>
            <p style={{ margin: '0', fontSize: '14.5px', color: '#92400e', fontWeight: '600' }}>
              🔒 Sécurité :<br />
              • Chiffrement RSA-2048 avec la clé publique du professeur<br />
              • Hash unique de votre identité ajouté<br />
              • Seul le professeur peut déchiffrer<br />
              • Enregistrement permanent
            </p>
          </div>

          {error && (
            <div style={{ color: '#dc2626', background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
              <strong>Erreur :</strong> {error}
            </div>
          )}

          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={loading}>
              Annuler
            </button>
            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Soumettre chiffré'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// STYLES (exactement les mêmes que le professeur pour l'organisation)
 // (Copiez le bloc styles du code du professeur ici)

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

export default StudentDashboard;