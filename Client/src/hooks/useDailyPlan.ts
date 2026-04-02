import { useState } from "react";
import { supabase } from "../lib/supabase";


export interface Task {
  task: string;
  subject: string;
  homework_id: string | null;
  duration_minutes: number;
  is_urgent: boolean;
  reason: string;
  study_tip: string;
}

export interface DailyPlan {
  summary: string;
  stress_load: "low" | "medium" | "high";
  recommended_start_time: string;
  tasks: Task[];
  ai_message: string;
}


export function useDailyPlan() {

  const [plan, setPlan]       = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const generatePlan = async (userId: string, planDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("build-and-plan", {
        body: { user_id: userId, plan_date: planDate ?? new Date().toLocaleDateString("en-CA") },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      });
      if (err || data?.error) throw new Error(err?.message ?? data.error);
      setPlan(data as DailyPlan);
    } catch (e) {
      setError((e as Error).message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPlan(null); setError(null); };

  return { plan, loading, error, generatePlan, reset };
  
}