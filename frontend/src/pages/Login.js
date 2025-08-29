import React, { useState } from "react";
import "./Login.css";
import { FaPowerOff } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (email && password) {
      try {
        
        const response = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          alert("Invalid credentials");
          return;
        }

        const data = await response.json();

        if (data.role === "admin") {
          navigate("/dashboard");
        } else if (data.role === "employee") {
          navigate("/tasks");
        } else {
          alert("Role not recognized");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong. Try again.");
      }
    } else {
      alert("Please enter email and password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="header-gradient"></div>
        <FaPowerOff className="power-icon" />
        <h2>Login</h2>
      </div>

      <div className="login-body">
        <div className="login-image">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
            alt="Illustration"
          />
        </div>

        <div className="login-form">
          <div className="avatar"></div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );
}
