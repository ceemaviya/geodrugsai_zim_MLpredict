import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const r = await API.post("/login", form);
      if (r.data.success && r.data.token) {
        localStorage.setItem("geodrugs_token", r.data.token);
        localStorage.setItem("geodrugs_logged_in", "true");
        navigate("/dashboard");
      }
    } catch (error) {
      setMsg(error.response?.data?.detail || "Backend not connected. Start FastAPI first.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={login}>
        <h1>GeoDrugs AI</h1>
        <p>Hotspot Mapping and Drug Risk Prediction System</p>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button>Login</button>
        {msg && <p className="error">{msg}</p>}
      </form>
    </div>
  );
}

export default Login;
