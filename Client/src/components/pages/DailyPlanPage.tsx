import { useDailyPlan, type Task } from "../../hooks/useDailyPlan";
import "./DailyPlanPage.css";

interface DailyPlanPageProps { userId: string; onBack?: () => void; }

const stressLabel: Record<string, string> = { low: "Тайван", medium: "Дунд", high: "Өндөр" };
const stressClass:  Record<string, string> = { low: "badge--low", medium: "badge--medium", high: "badge--high" };

const todayISO = () => new Date().toLocaleDateString("en-CA");
const formatDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("mn-MN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

function TaskCard({ task, index }: { task: Task; index: number }) {
  return (
    <div className={`task-card${task.is_urgent ? " task-card--urgent" : ""}`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="task-header">
        <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
        <div className="task-meta">
          <span className="task-subject">{task.subject}</span>
          {task.is_urgent && <span className="urgent-badge">Яаралтай</span>}
        </div>
        <span className="task-duration">{task.duration_minutes}мин</span>
      </div>
      <p className="task-title">{task.task}</p>
      <div className="task-footer">
        <div className="task-reason"><span className="footer-label">Яагаад өнөөдөр?</span><span>{task.reason}</span></div>
        <div className="task-tip"><span className="footer-label">Зөвлөгөө</span><span>{task.study_tip}</span></div>
      </div>
    </div>
  );
}

export default function DailyPlanPage({ userId, onBack }: DailyPlanPageProps) {
  const { plan, loading, error, generatePlan, reset } = useDailyPlan();
  const today = todayISO();

  return (
    <div className="page">
      <header className="page-header">
        {onBack && <button className="btn-back" onClick={onBack}>← Буцах</button>}
        <div className="header-eyebrow">Цагмэргэн</div>
        <h1 className="header-title">Өнөөдрийн төлөвлөгөө</h1>
        <p className="header-date">{formatDate(today)}</p>
      </header>

      {!plan && !loading && (
        <div className="cta-section">
          <p className="cta-text">AI танд өнөөдрийн хичээлийн ачааллыг тооцоолж, оновчтой цагийн хуваарь гаргаж өгнө.</p>
          <button className="btn-generate" onClick={() => generatePlan(userId, today)}>Төлөвлөгөө үүсгэх</button>
          {error && <p className="error-msg">⚠ {error}</p>}
        </div>
      )}

      {loading && (
        <div className="loading-section">
          <div className="loader" />
          <p className="loading-text">боловсруулж байна…</p>
        </div>
      )}

      {plan && !loading && (
        <div className="plan-section">
          <div className="overview-card">
            <div className="overview-row">
              <div className="overview-item">
                <span className="overview-label">Стресс</span>
                <span className={`badge ${stressClass[plan.stress_load]}`}>{stressLabel[plan.stress_load] ?? plan.stress_load}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Эхлэх цаг</span>
                <span className="overview-value">{plan.recommended_start_time}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Даалгавар</span>
                <span className="overview-value">{plan.tasks.length}</span>
              </div>
            </div>
            <p className="overview-summary">{plan.summary}</p>
          </div>

          <div className="tasks-list">
            {plan.tasks.map((task, i) => <TaskCard key={task.homework_id ?? i} task={task} index={i} />)}
          </div>

          <div className="ai-message">
            <span className="ai-message-icon">✦</span>
            <p>{plan.ai_message}</p>
          </div>

          <div className="regen-row">
            <button className="btn-regen" onClick={reset}>← Буцах</button>
          </div>
        </div>
      )}
    </div>
  );
}