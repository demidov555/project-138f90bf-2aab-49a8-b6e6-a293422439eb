import { Task } from "../types";

export default function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Assignee</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id}>
            <td>{t.title}</td>
            <td>
              <span className={`badge priority-${t.priority}`}>{t.priority}</span>
            </td>
            <td>
              <span className={`badge status-${t.status}`}>{t.status}</span>
            </td>
            <td>{t.assignee_id || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
