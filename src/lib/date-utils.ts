import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getISOWeek,
  getISOWeekYear,
  addDays,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export const LOCALE = ptBR;

export const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");
export const toMonthKey = (d: Date) => format(d, "yyyy-MM");
export const toWeekKey = (d: Date) =>
  `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;

export const weekRange = (d: Date) => {
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
};

export const monthRange = (d: Date) => {
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  const gridStart = startOfWeek(start, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(end, { weekStartsOn: 1 });
  return {
    start, end,
    days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
  };
};

export const PERIOD_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
};

export const PERIODS = ["morning", "afternoon", "evening"] as const;

export const greetingFor = (d: Date) => {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

/** "Ontem", "Hoje", "Amanhã" quando aplicável; caso contrário, retorna null. */
export const relativeDayLabel = (d: Date, ref: Date = new Date()): string | null => {
  const diff = differenceInCalendarDays(d, ref);
  if (diff === -1) return "Ontem";
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return null;
};

export { addDays, isSameDay, parseISO, format, startOfWeek, endOfWeek };
