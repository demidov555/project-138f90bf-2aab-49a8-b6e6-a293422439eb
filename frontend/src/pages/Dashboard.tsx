import { useEffect, useState } from "react";
import { listTasks } from "../api/tasks";
import { Task } from "../types";
import Loader from "../components/Loader";
import TaskList from "../components/TaskList";
import { useAuth } from "../hooks/useAuth";
import TaskFormModal from "../components/TaskFormModal";

export default function Dashboard() {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { items } = await listTasks();
    setTasks(items);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div className="dashboard">
      <header className="top-bar">
        <h2>Tasks</h2>
        <button onClick={() => setShowModal(true)}>+ New Task</button>
        <button onClick={logout}>Logout</button>
      </header>
      {loading ? <Loader /> : <TaskList tasks={tasks} />}
      {showModal && (
        <TaskFormModal
          onClose={() => setShowModal(false)}
          onCreated={fetch}
        />
      )}
    </div>
  );
}
