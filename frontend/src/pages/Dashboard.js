import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";


export default function Dashboard() {
  const [stats, setStats] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    API.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>{user?.role === "admin" ? "Admin" : "Employee"} Dashboard</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
