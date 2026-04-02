import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY   = Deno.env.get("OPENAI_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, plan_date } = await req.json();
    if (!user_id || !plan_date) return json({ error: "Missing user_id or plan_date" }, 400);
    if (!OPENAI_API_KEY)         return json({ error: "OPENAI_API_KEY not set" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ── 1. Resolve user → class + grade ────────────────────────────────
    const { data: userRow, error: userErr } = await supabase
      .from("demo_users")
      .select("class_id, classes!demo_users_class_id_fkey(grade, class_section)")
      .eq("user_id", user_id)
      .single();

    if (userErr || !userRow) return json({ error: "User not found", detail: userErr?.message }, 404);

    const class_id      = userRow.class_id as string;
    const { grade, class_section } = userRow.classes as { grade: number; class_section: string };
    const dow           = new Date(`${plan_date}T12:00:00Z`).getUTCDay();

    // ── 2. Parallel DB fetches ──────────────────────────────────────────
    const [profileRes, homeworkRes, eventsRes, scheduleRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user_id).maybeSingle(),
      supabase.from("homework").select("*").eq("user_id", user_id).or("status.eq.pending,status.is.null").order("due_date", { ascending: true }),
      supabase.from("grade_events").select("*")
        .eq("grade_level", grade)
        .or(`class_section.eq.${class_section},class_section.is.null`)
        .gte("event_date", plan_date)
        .lte("event_date", offsetDate(plan_date, 7))
        .order("event_date", { ascending: true }),
      supabase.from("schedules").select("*").eq("class_id", class_id).eq("day_of_week", dow).order("period", { ascending: true }),
    ]);

    const dbError = profileRes.error || homeworkRes.error || eventsRes.error || scheduleRes.error;
    if (dbError) return json({ error: "DB fetch failed", detail: dbError.message }, 500);

    const profile  = profileRes.data;
    const homework = homeworkRes.data ?? [];
    const events   = eventsRes.data   ?? [];
    const schedule = scheduleRes.data ?? [];

    // ── 3. Build prompt ─────────────────────────────────────────────────
    const todayDow = new Date(`${plan_date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long" });

    const prompt = 
    `
    You are "Цагмэргэн", a smart and caring AI academic planner for Mongolian high school students.
    Respond in Mongolian language. Keep a warm, encouraging tone.

    ━━━━━━━━━━ STRICT RULES ━━━━━━━━━━
    1. Tasks MUST be generated from TODAY'S HOMEWORK first.
      - If homework exists, do NOT invent generic filler tasks.
      - If no homework exists, suggest light review or preparation for upcoming events.
    2. Mark a homework item URGENT if its due_date is today or tomorrow.
    3. Order tasks by: URGENT first → highest difficulty → shortest duration (easy wins build momentum).
    4. NEVER recommend a start time earlier than the student's home_arrival_time.
    5. Insert a 10-minute break after every 50 minutes of consecutive study.
    6. If stress_level is "high": cap total study time at 90 minutes, use a gentle supportive tone.
    7. If procrastination_risk is "high": put the shortest/easiest task first.
    8. If an upcoming event is within 3 days, mention it in the related task's "reason" field.
    9. Match every study_tip to the student's learning_style: "${profile?.learning_style ?? "unknown"}".
    10. Reference today's class schedule to know what subjects were just taught — prioritize fresh review.

    ━━━━━━━━━━ CONTEXT ━━━━━━━━━━
    Plan Date : ${plan_date} (${todayDow})

    STUDENT PROFILE:
    ${JSON.stringify(profile ?? {}, null, 2)}

    TODAY'S HOMEWORK (source of truth for tasks):
    ${JSON.stringify(homework, null, 2)}

    UPCOMING EVENTS (next 7 days):
    ${JSON.stringify(events, null, 2)}

    TODAY'S CLASS SCHEDULE:
    ${JSON.stringify(schedule, null, 2)}

    ━━━━━━━━━━ OUTPUT FORMAT ━━━━━━━━━━
    Return STRICT JSON only. No markdown. No explanation outside JSON.

    {
      "summary": "2–3 sentences. Mention the student's actual subjects and today's load. Written in Mongolian.",
      "stress_load": "low | medium | high",
      "recommended_start_time": "HH:mm",
      "tasks": [
        {
          "task": "Specific action tied to the actual homework title — not generic advice",
          "subject": "Exact subject name from homework",
          "homework_id": "uuid from homework row if linked, otherwise null",
          "duration_minutes": 30,
          "is_urgent": true,
          "reason": "Why this is prioritized today",
          "study_tip": "Concrete tip matched to their learning_style"
        }
      ],
      "ai_message": "Short 1–2 sentence motivational message. Personal, warm, Mongolian."
    }`;

    // ── 4. Call OpenAI ──────────────────────────────────────────────────
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an academic planner AI. Always return valid JSON only. Never include markdown fences or any text outside the JSON object." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) return json({ error: "OpenAI request failed", detail: await aiRes.text() }, 502);

    const rawContent: string = (await aiRes.json()).choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent.replace(/```json|```/g, "").trim());
    } catch {
      return json({ error: "AI returned invalid JSON", raw: rawContent }, 500);
    }

    // ── 5. Persist plan ─────────────────────────────────────────────────
    const { error: upsertErr } = await supabase.from("ai_plans").upsert({
      user_id,
      plan_date,
      summary:                parsed.summary,
      stress_load:            parsed.stress_load,
      recommended_start_time: parsed.recommended_start_time,
      ordered_tasks:          parsed.tasks,
      ai_message:             parsed.ai_message,
    }, { onConflict: "user_id,plan_date" });

    if (upsertErr) console.error("Upsert failed (non-fatal):", upsertErr.message);

    return json(parsed);

  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});