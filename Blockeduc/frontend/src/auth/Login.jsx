import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔗 Django API Login Endpoint (ready to connect)
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Save token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Redirect based on role
        if (role === "student") navigate("/student");
        if (role === "professor") navigate("/professor");
        if (role === "admin") navigate("/admin");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      // ⚠️ TEMPORARY: If API not ready, use fake login
      console.warn("API not available, using temporary login");
      if (email && password) {
        if (role === "student") navigate("/student");
        if (role === "professor") navigate("/professor");
        if (role === "admin") navigate("/admin");
      } else {
        setError("Please fill in all fields");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Animation */}
      <div style={styles.backgroundAnimation}>
        <div style={styles.circle1}></div>
        <div style={styles.circle2}></div>
        <div style={styles.circle3}></div>
      </div>

      <div style={styles.card}>
        {/* Logo/Icon */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.title}>BlockEduc</h1>
          <p style={styles.subtitle}>Blockchain Education System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="student@ensa.ac.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Login As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="student">👨‍🎓 Student</option>
              <option value="professor">👨‍🏫 Professor</option>
              <option value="admin">👔 Admin</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {}),
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={styles.spinner}></span>
                Logging in...
              </>
            ) : (
              <>
                <span>Login</span>
                <span style={styles.arrow}>→</span>
              </>
            )}
          </button>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Secured by blockchain technology 🔒
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  backgroundAnimation: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    zIndex: 0,
  },
  circle1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.1)",
    top: "-100px",
    left: "-100px",
    animation: "float 6s ease-in-out infinite",
  },
  circle2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.05)",
    bottom: "-50px",
    right: "-50px",
    animation: "float 8s ease-in-out infinite",
  },
  circle3: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.08)",
    top: "50%",
    right: "20%",
    animation: "float 7s ease-in-out infinite",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "50px 40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    zIndex: 1,
    animation: "slideIn 0.5s ease-out",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "40px",
  },
  logo: {
    fontSize: "60px",
    marginBottom: "10px",
    animation: "bounce 2s infinite",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "5px 0 0 0",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    padding: "14px 16px",
    fontSize: "16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },
  select: {
    padding: "14px 16px",
    fontSize: "16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    background: "white",
    fontFamily: "inherit",
  },
  button: {
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  arrow: {
    fontSize: "20px",
    transition: "transform 0.3s ease",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #fecaca",
  },
  errorIcon: {
    fontSize: "18px",
  },
  footer: {
    marginTop: "20px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },
};

// Add CSS animations (put this in your global CSS or index.css)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  input:focus, select:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  }

  button:hover:not(:disabled) span:last-child {
    transform: translateX(5px);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);
