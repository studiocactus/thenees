import type { BrazilDate, SantosWeather } from "../types";

export const describeSantosWeather = (code: number, isDay: boolean): Pick<SantosWeather, "label" | "icon"> => {
  if (code === 0) return { label: isDay ? "CÉU LIMPO" : "NOITE LIMPA", icon: isDay ? "sun" : "night" };
  if ([1, 2, 3].includes(code)) return { label: code === 3 ? "NUBLADO" : "PARCIALMENTE NUBLADO", icon: "cloud" };
  if ([45, 48].includes(code)) return { label: "NEBLINA", icon: "fog" };
  if (code >= 95) return { label: "TEMPESTADE", icon: "storm" };
  if ((code >= 51 && code <= 82) || (code >= 85 && code <= 86)) return { label: "CHUVA", icon: "rain" };
  return { label: "TEMPO VARIÁVEL", icon: "cloud" };
};

export function getBrazilDate(date: Date): BrazilDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  return { year, month, day, weekDay: new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() };
}

export function addBrazilCalendarDays(date: BrazilDate, amount: number): BrazilDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + amount, 12));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(), weekDay: shifted.getUTCDay() };
}

export const formatBrazilDay = (date: BrazilDate) => `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}`;

export const getYouTubeId = (url: string) => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1] ?? "";

export const formatScheduleDate = (iso: string) => {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: value("weekday").replace(".", "").toUpperCase(), date: `${value("day")}/${value("month")}`, hour: `${value("hour")}:${value("minute")}` };
};
