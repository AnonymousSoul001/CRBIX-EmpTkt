import { useEffect, useState } from "react";
import API from "../api/axios";

export default function TimeLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    API.get("/timelogs")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Time Logs</h2>
      {logs.map((log) => (
        <div key={log._id}>
          {log.date} — {log.user?.name} — {log.totalHours?.toFixed(2)} hours
        </div>
      ))}
    </div>
  );
}
