import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Landingpage.css";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>Welcome to Employee Punching</h1>
        <p>Please log in or register to continue and access your tasks.</p>
      </div>

      <div className="landing-buttons">
        <Link to="/login" style={{ textDecoration: "none" }}>
          <button className="landing-button login-btn">Login</button>
        </Link>

        <Link to="/register" style={{ textDecoration: "none" }}>
          <button className="landing-button register-btn">Register</button>
        </Link>
      </div>
    </div>
  );
}
