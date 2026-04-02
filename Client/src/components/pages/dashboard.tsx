"use client";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface DbHomework {
    id?: number | string;
    title?: string;
    subject?: string;
    description?: string | null;
    assigned_date?: string | null;
    due_date?: string | null;
    difficulty?: string | null;
    estimated_minutes?: number | null;
    status?: string | null;
    [key: string]: unknown;
}

interface DbSchedule {
    id?: string;
    day_of_week?: number; // 0=Sun … 6=Sat
    period?: number;
    subject?: string;
    start_time?: string;
    end_time?: string;
}

interface DbProfile {
    learning_style?: string | null;
    stress_level?: string | null;
    study_start_time?: string | null;
    home_arrival_time?: string | null;
    sleep_time?: string | null;
    [key: string]: unknown;
}

interface Props {
    user: {
        user_id?: string;
        first_name?: string;
        class_id?: string;
        classes?: { grade?: number; class_section?: string; class_name?: string };
        [key: string]: unknown;
    };
    homework?: DbHomework[];
    schedule?: DbSchedule[];
    profile?: DbProfile | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PILL_THEMES = [
    { color: "bg-[#eef0fc] text-[#606fce]", dot: "bg-[#a6aff4]" },
    { color: "bg-[#fceede] text-[#fc6e35]", dot: "bg-[#ffc1a6]" },
    { color: "bg-[#e6f9ed] text-[#27d861]", dot: "bg-[#9ef0b8]" },
    { color: "bg-[#fff8e7] text-[#f9c02d]", dot: "bg-[#ffeca4]" },
    { color: "bg-[#e7f9fb] text-[#26d0e6]", dot: "bg-[#abf0f8]" },
];

const DIFFICULTY_BADGE: Record<string, string> = {
    easy:   "bg-[#e6f9ed] text-[#27d861]",
    medium: "bg-[#fff8e7] text-[#e5a800]",
    hard:   "bg-[#fce8e8] text-[#d83a3a]",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDue(dateStr: string | null | undefined): string {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function buildCalendar() {
    const now        = new Date();
    const year       = now.getFullYear();
    const month      = now.getMonth();
    const monthName  = now.toLocaleDateString("en-US", { month: "long" });
    const today      = now.getDate();
    const formattedDate = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

    const firstDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const cells: { num: number; faded?: boolean; isToday?: boolean }[] = [];

    for (let i = firstDow - 1; i >= 0; i--)  cells.push({ num: daysInPrev - i, faded: true });
    for (let d = 1; d <= daysInMonth; d++)    cells.push({ num: d, isToday: d === today });

    const trailing = 7 - (cells.length % 7);
    if (trailing < 7) for (let d = 1; d <= trailing; d++) cells.push({ num: d, faded: true });

    return { cells, monthName, today, formattedDate };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudentDashboard({ user, homework, schedule = [], profile }: Props) {
    const homeworks =
        homework && homework.length > 0
            ? homework.map((hw, i) => ({
                  id:         hw.id ?? i,
                  subject:    hw.subject || "Assignment",
                  task:       hw.title || "Untitled",
                  description: hw.description || "",
                  time:       formatDue(hw.due_date),
                  color:      PILL_THEMES[i % PILL_THEMES.length].color,
                  dot:        PILL_THEMES[i % PILL_THEMES.length].dot,
                  status:     capitalize(hw.status || "pending"),
                  difficulty: hw.difficulty || null,
                  minutes:    hw.estimated_minutes || null,
              }))
            : [];

    const { cells, monthName, today, formattedDate } = buildCalendar();

    const displayName = (user?.first_name as string) || user?.user_id || "Student";
    const classLabel  = user?.classes?.class_name
        ? `Grade ${user.classes.grade} — Section ${user.classes.class_section}`
        : null;

    const todayDow      = new Date().getDay();
    const todaySchedule = schedule
        .filter((s) => s.day_of_week === todayDow)
        .sort((a, b) => (a.period ?? 0) - (b.period ?? 0));

    const focusSubject = homeworks[0]?.subject ?? todaySchedule[0]?.subject ?? "No tasks";
    const focusTopic   = homeworks[0]?.task    ?? (todaySchedule[0] ? `${todaySchedule[0].start_time} – ${todaySchedule[0].end_time}` : "");

    return (
        <div className="font-sans max-w-[1200px] w-full mx-auto px-6 py-10 text-[#1a1b24] bg-white min-h-screen">

            {/* ── Header ── */}
            <header className="mb-12">
                <h1 className="text-[28px] font-medium text-[#a0a3bd] m-0">
                    Hello, <span className="text-[#1a1b24] font-extrabold">{displayName}!</span>
                </h1>
                {classLabel && (
                    <p className="text-xs font-semibold text-[#a0a3bd] mt-1 tracking-wide">
                        {classLabel}
                    </p>
                )}
            </header>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-20">
w
                {/* ══ LEFT: HOMEWORK ══ */}
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[#1a1b24] mb-1">Homework Tracker</h2>
                    <p className="text-sm text-[#a0a3bd] font-medium mb-10">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                    </p>

                    {homeworks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="text-5xl mb-4">📚</div>
                            <p className="text-[#a0a3bd] text-[15px] font-medium">No homework assigned yet</p>
                            <p className="text-[#cbd0d9] text-[13px] mt-1">When your teachers add homework, it will show up here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {homeworks.map((hw) => (
                                <div key={hw.id} className="flex items-center gap-5">
                                    {/* Due label */}
                                    <div className={`text-[14px] font-bold min-w-[64px] text-right ${hw.time === "Overdue" ? "text-[#d83a3a]" : hw.time === "Today" ? "text-[#f9c02d]" : "text-[#a0a3bd]"}`}>
                                        {hw.time}
                                    </div>

                                    {/* Pill */}
                                    <div className={`flex-1 flex items-center px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] ${hw.color}`}>
                                        <div className={`w-5 h-5 rounded-full mr-4 shrink-0 ${hw.dot}`} />
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <span className="text-[15px] font-bold leading-tight">{hw.subject}</span>
                                            <span className="text-xs font-medium opacity-70 truncate">{hw.task}</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3 shrink-0">
                                            {hw.difficulty && (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${DIFFICULTY_BADGE[hw.difficulty] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {hw.difficulty}
                                                </span>
                                            )}
                                            {hw.minutes && (
                                                <span className="text-[11px] font-semibold opacity-60">{hw.minutes}min</span>
                                            )}
                                            <div className="text-[13px] font-bold">{hw.status}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══ RIGHT: CALENDAR ══ */}
                <div className="flex flex-col xl:border-l-2 xl:border-[#f4f5f7] xl:pl-16 pt-10 xl:pt-0 border-t-2 xl:border-t-0 border-[#f4f5f7]">

                    {/* Upcoming bubbles + focus */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[#e2e4e8] text-2xl font-light">←</span>

                            {/* Today bubble (large) */}
                            <div className="w-20 h-20 rounded-full bg-[#ffebb2] text-white flex items-center justify-center text-3xl font-extrabold drop-shadow-sm">
                                {today}
                            </div>

                            {/* Small accent bubbles */}
                            <div className="w-11 h-11 rounded-full bg-[#ffc6bd] flex items-center justify-center text-[15px] font-bold text-white">
                                {today + 4 <= 31 ? today + 4 : today - 4}
                            </div>
                            <div className="w-11 h-11 rounded-full bg-[#ffc6bd] flex items-center justify-center text-[15px] font-bold text-white opacity-50">
                                {today + 12 <= 31 ? today + 12 : today - 12}
                            </div>
                            <div className="w-11 h-11 rounded-full bg-[#e0e4fe] flex items-center justify-center text-[15px] font-bold text-white">
                                {today - 6 > 0 ? today - 6 : today + 6}
                            </div>

                            <span className="text-[#e2e4e8] text-2xl font-light">→</span>
                        </div>

                        <h4 className="text-sm font-bold text-[#f9c02d] mb-1">Today's Focus</h4>
                        <p className="text-[13px] font-medium text-[#a0a3bd]">
                            {focusSubject}{focusTopic ? ` — ${focusTopic}` : ""}
                        </p>
                    </div>

                    {/* Calendar card */}
                    <div>
                        {/* Calendar header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[16px] font-extrabold text-[#1a1b24] m-0">Calendar</h3>
                                <p className="text-xs font-bold text-[#fc6e35] mt-1">{formattedDate}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[#e2e4e8] text-2xl font-light leading-none">‹</span>
                                <span className="text-[#e2e4e8] text-2xl font-light leading-none">›</span>
                            </div>
                        </div>

                        {/* Month name */}
                        <h4 className="text-center text-[15px] font-bold text-[#1a1b24] mb-6">
                            {monthName}
                        </h4>

                        {/* Day-of-week headers + dates */}
                        <div className="grid grid-cols-7 text-center mb-10 gap-y-4">
                            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                                <div key={d} className="text-[11px] font-bold text-[#a0a3bd] uppercase mb-2">
                                    {d}
                                </div>
                            ))}

                            {cells.map((cell, idx) => (
                                <div
                                    key={idx}
                                    className={[
                                        "text-[13px] font-semibold h-8 flex items-center justify-center",
                                        cell.faded
                                            ? "text-[#cbd0d9]"
                                            : cell.isToday
                                                ? "text-white bg-[#f9c02d] rounded-full w-8 mx-auto"
                                                : "text-[#1a1b24]",
                                    ].join(" ")}
                                >
                                    {cell.num}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex gap-6 justify-center border-t border-[#f4f5f7] pt-6 flex-wrap">
                            {[
                                { color: "bg-[#606fce]", label: "Activities" },
                                { color: "bg-[#fc6e35]", label: "Homework"   },
                                { color: "bg-[#f9c02d]", label: "Today"      },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2 text-[11px] font-semibold text-[#1a1b24]">
                                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
