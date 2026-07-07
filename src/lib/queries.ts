import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type Habit = Database["public"]["Tables"]["habits"]["Row"] & { reminder_time?: string | null };
export type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"] & { reminder_time?: string | null };
export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type PeriodGoal = Database["public"]["Tables"]["period_goals"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type GoalMilestone = Database["public"]["Tables"]["goal_milestones"]["Row"];

export type DayOff = { id: string; user_id: string; day_date: string; note: string | null; created_at: string };
export type MonthSummary = {
  id: string; user_id: string; month_key: string;
  habits_done: number; habits_total: number; completion_pct: number;
  moments_count: number; goals_done: number;
  reflection: string | null; photos: string[];
  created_at: string; updated_at: string;
};
export type YearSummary = {
  id: string; user_id: string; year_key: string;
  habits_done: number; habits_total: number; avg_pct: number;
  moments_count: number; goals_done: number;
  retrospective: string | null; photos: string[];
  created_at: string; updated_at: string;
};

export type GoalHorizon = "year" | "5y" | "10y" | "20y";
export const HORIZON_LABELS: Record<GoalHorizon, string> = {
  year: "Este ano",
  "5y": "5 anos",
  "10y": "10 anos",
  "20y": "20 anos",
};

const sb = supabase as unknown as {
  from: (t: string) => {
    select: (c?: string) => any;
    insert: (v: any) => any;
    update: (v: any) => any;
    delete: () => any;
    upsert: (v: any, o?: any) => any;
  };
};

const ANON_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function currentUserId() {
  return ANON_USER_ID;
}

// TASKS
export async function fetchTasksByDate(date: string) {
  const { data, error } = await supabase
    .from("tasks").select("*").eq("due_date", date).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllTasksBetween(start: string, end: string) {
  const { data, error } = await supabase
    .from("tasks").select("*")
    .gte("due_date", start).lte("due_date", end).order("due_date");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPendingTasks() {
  const { data, error } = await supabase
    .from("tasks").select("*")
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

// HABITS
export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits").select("*").eq("archived", false).order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Habit[];
}

export async function fetchHabitLogsBetween(start: string, end: string) {
  const { data, error } = await supabase
    .from("habit_logs").select("*").gte("log_date", start).lte("log_date", end);
  if (error) throw error;
  return data ?? [];
}

// EVENTS
export async function fetchEventsBetween(start: string, end: string) {
  const { data, error } = await supabase
    .from("events").select("*")
    .gte("event_date", start).lte("event_date", end)
    .order("event_date").order("start_time");
  if (error) throw error;
  return data ?? [];
}

// PERIOD GOALS
export async function fetchGoals(scope: "week" | "month", key: string) {
  const { data, error } = await supabase
    .from("period_goals").select("*")
    .eq("scope", scope).eq("period_key", key).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// BIG GOALS
export async function fetchAllGoals() {
  const { data, error } = await supabase
    .from("goals").select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function fetchGoalsByHorizon(horizon: GoalHorizon) {
  const { data, error } = await supabase
    .from("goals").select("*").eq("horizon", horizon)
    .order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function fetchMilestonesForGoals(goalIds: string[]) {
  if (goalIds.length === 0) return [] as GoalMilestone[];
  const { data, error } = await supabase
    .from("goal_milestones").select("*").in("goal_id", goalIds).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// DAY OFFS
export async function fetchDayOffsBetween(start: string, end: string): Promise<DayOff[]> {
  const { data, error } = await sb.from("day_offs").select("*").gte("day_date", start).lte("day_date", end);
  if (error) throw error;
  return (data ?? []) as DayOff[];
}

// SUMMARIES
export async function fetchMonthSummaries(): Promise<MonthSummary[]> {
  const { data, error } = await sb.from("month_summaries").select("*").order("month_key", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MonthSummary[];
}
export async function fetchYearSummaries(): Promise<YearSummary[]> {
  const { data, error } = await sb.from("year_summaries").select("*").order("year_key", { ascending: false });
  if (error) throw error;
  return (data ?? []) as YearSummary[];
}
