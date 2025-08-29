import { useEffect, useState } from "react";
import API from "../api/axios";
import "./Tasks.css";
import { FaPowerOff } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    API.get("/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/tasks/${id}`, { status });
      setTasks(tasks.map((t) => (t._id === id ? { ...t, status } : t)));
    } catch (err) {
      alert("Failed to update task");
    }
  };

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-gradient"></div>
        <FaPowerOff className="power-icon" />
        <h2>Tasks</h2>
      </div>

      {/* Tasks List */}
      {tasks.map((task) => (
        <div key={task._id} className="task-card">
          <div className="task-title">{task.title}</div>
          <div className="task-status">Status: {task.status}</div>

          {user.role === "employee" && (
            <select
              value={task.status}
              onChange={(e) => updateStatus(task._id, e.target.value)}
              className="task-select"
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
