import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

export default function LandingPage() {
  const { user } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  const features = [
    {
      title: "AI-Powered Scheduling",
      desc: "Let our intelligent algorithm resolve conflicts and optimize your timetable in seconds.",
      icon: "🤖",
      colorClass: "blue",
    },
    {
      title: "Instant Data Import",
      desc: "Upload classes, teachers, and rooms effortlessly with our smart import system.",
      icon: "📥",
      colorClass: "purple",
    },
    {
      title: "Real-time Substitution",
      desc: "Handle absences instantly with intelligent substitute suggestions.",
      icon: "⚡",
      colorClass: "pink",
    },
    {
      title: "Multi-Role Portals",
      desc: "Personalized dashboards for admins, teachers, and students.",
      icon: "👥",
      colorClass: "green",
    },
    {
      title: "Export Everything",
      desc: "Download schedules as PDF or Excel in seconds.",
      icon: "📤",
      colorClass: "orange",
    },
    {
      title: "24/7 Cloud Sync",
      desc: "Your data is always secure, accessible, and up-to-date.",
      icon: "☁️",
      colorClass: "cyan",
    },
  ];

  const steps = [
    { number: "1", title: "Upload Data", desc: "Import your institution's data in minutes" },
    { number: "2", title: "Configure", desc: "Set up constraints and preferences" },
    { number: "3", title: "Generate", desc: "AI creates an optimal timetable" },
    { number: "4", title: "Review", desc: "Check and make final adjustments" },
  ];

  const testimonials = [
    { name: "Sarah Johnson", role: "Principal, Tech Academy", text: "Smart Timetable saved us 40 hours of manual scheduling per semester. A game-changer!" },
    { name: "Ahmed Hassan", role: "Admin, Elite Institute", text: "The AI-powered scheduling is incredibly accurate. No more conflicts or complications." },
    { name: "Maria Garcia", role: "Coordinator, University", text: "Our students and teachers love the real-time updates. Highly recommended!" },
  ];

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="logo">
            SmartTimetable
          </motion.div>
          <nav className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="signup-btn">Sign Up</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div className="hero-badge">
              ✨ The Future of Academic Scheduling
            </motion.div>
            
            <h1 className="hero-title">
              <span style={{color:"#5954a0"}}>Schedule Your Future with</span>
              <span className="hero-title-gradient">
                AI Intelligence
              </span>
            </h1>
            
            <p className="hero-description" style={{color:"#8aa4c7"}}>
              Transform your institution's timetable management with our AI-powered scheduling platform. Save hours, eliminate conflicts, and keep everyone connected.
            </p>
            
            <motion.div
              className="hero-buttons"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link to="/register" className="btn-primary">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div
            className="hero-emoji"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            📅
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="features-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="section-title"
            style={{color:"#738fb4"}}
          >
            Powerful Features Built for You
          </motion.h2>

          <motion.div
            className="features-grid"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ staggerChildren: 0.2, delayChildren: 0.3 }}
            viewport={{ once: true }}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`feature-card feature-${feature.colorClass}`}
              >
                <div className="feature-card-bg" />
                <div className="feature-card-content" >
                  <div className="feature-card-icon">{feature.icon}</div>
                  <h3 className="feature-card-title" style={{color:"#8aa4c7"}}>{feature.title}</h3>
                  <p className="feature-card-desc" style={{color:"#485d79"}}>{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="how-it-works-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="section-title"
            style={{color:"#83ace2"}}
          >
            How It Works
          </motion.h2>

          <div className="steps-grid">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="step-card"
              >
                <div className="step-number">
                  {step.number}
                </div>
                <h3 className="step-title" style={{color:"#8aa4c7"}}>{step.title}</h3>
                <p className="step-desc" style={{color:"#485d79"}}>{step.desc}</p>
                {idx < steps.length - 1 && (
                  <div className="step-arrow">
                    <svg className="arrow-svg" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            {[
              { stat: "10,000+", label: "Active Schedules" },
              { stat: "99.9%", label: "Accuracy Rate" },
              { stat: "<2s", label: "Generation Time" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="stat-item"
              >
                <div className="stat-number">
                  {item.stat}
                </div>
                <p className="stat-label" style={{color:"#65636d"}}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="section-title"
            style={{color:"#8e8ac7"}}
          >
            Loved by Institutions
          </motion.h2>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="testimonial-card"
              >
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-text" style={{color:"#8aa4c7"}}>"{testimonial.text}"</p>
                <div>
                  <p className="testimonial-name" style={{color:"#3e79c5"}}>{testimonial.name}</p>
                  <p className="testimonial-role" style={{color:"#8aa4c7"}}>{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="cta-title"
          >
            Ready to Transform Your Scheduling?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            viewport={{ once: true }}
            className="cta-description"
            
          >
            Join hundreds of institutions. No credit card required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link to="/register" className="cta-button">
              Get Started Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem'}}>
            <div style={{flex: '1 1 250px'}}>
              <h3 className="footer-section-title" style={{marginBottom: '1rem', color: '#8e8ac7'}}>SmartTimetable</h3>
              <p className="footer-section-desc" style={{color: '#8aa4c7', fontSize: '1rem', maxWidth: 320}}>Revolutionizing academic scheduling with AI.</p>
            </div>
            <div style={{flex: '1 1 180px', minWidth: 180}}>
              <h4 className="footer-section-title" style={{marginBottom: '1rem', color: '#8e8ac7'}}>Legal</h4>
              <ul className="footer-section-links" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <li><Link to="/privacy-policy" className="footer-section-link" style={{color: '#8aa4c7', textDecoration: 'none', fontSize: '1rem'}}>Privacy Policy</Link></li>
                <li><Link to="/terms" className="footer-section-link" style={{color: '#8aa4c7', textDecoration: 'none', fontSize: '1rem'}}>Terms & Conditions</Link></li>
                <li><Link to="/cookies" className="footer-section-link" style={{color: '#8aa4c7', textDecoration: 'none', fontSize: '1rem'}}>Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-divider" style={{color: '#8aa4c7', borderTop: '1px solid #22304a', paddingTop: '2rem', textAlign: 'center', fontSize: '0.95rem'}}>
            <p>© 2026 Smart Timetable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

