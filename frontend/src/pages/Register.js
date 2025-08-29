import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import API from "../api/axios";
import { FaPowerOff } from "react-icons/fa";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", { name, email, password, role });
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    
    <div className = "register-container">
      
      <div className = "login-header">
        <div className="header-gradient"></div>
        <FaPowerOff className='power-icon' />
        <h2 className="text">Register</h2>
      </div>

      <div className="register-body">
        {/* Left side image */}
        <div className="register-image">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
            alt="Illustration"
          />
    <div>
      
      <div className="register-form">
      <div className="avatar"></div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
      </form>
      </div>
    </div>
  </div>
  </div>
  </div>
  );
}
