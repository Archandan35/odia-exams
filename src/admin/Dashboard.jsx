import AdminLayout from "./AdminLayout";

export default function Dashboard() {

  return (

    <AdminLayout>

      <div className="dashboard-grid">

        <div className="analytics-card">
          <h3>Total Subjects</h3>
          <h1>4</h1>
          <p>View Subjects</p>
        </div>

        <div className="analytics-card">
          <h3>Total Topics</h3>
          <h1>36</h1>
          <p>Across all subjects</p>
        </div>

        <div className="analytics-card">
          <h3>Total Questions</h3>
          <h1>1200</h1>
          <p>Question bank</p>
        </div>

        <div className="analytics-card">
          <h3>Total Attempts</h3>
          <h1>26</h1>
          <p>View Results</p>
        </div>

        <div className="analytics-card">
          <h3>Average Performance</h3>
          <h1>22.8%</h1>
          <p>Across all exams</p>
        </div>

      </div>

    </AdminLayout>
  );
}
