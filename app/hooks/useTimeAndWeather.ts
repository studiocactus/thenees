import { useState, useEffect } from "react";
import type { BrazilDate, SantosWeather } from "../types";

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

export const describeSantosWeather = (code:number,isDay:boolean):Pick<SantosWeather,"label"|"icon"> => {
  if(code===0)return {label:isDay?"CÉU LIMPO":"NOITE LIMPA",icon:isDay?"sun":"night"};
  if([1,2,3].includes(code))return {label:code===3?"NUBLADO":"PARCIALMENTE NUBLADO",icon:"cloud"};
  if([45,48].includes(code))return {label:"NEBLINA",icon:"fog"};
  if(code>=95)return {label:"TEMPESTADE",icon:"storm"};
  if((code>=51&&code<=82)||(code>=85&&code<=86))return {label:"CHUVA",icon:"rain"};
  return {label:"TEMPO VARIÁVEL",icon:"cloud"};
};

export function useTimeAndWeather() {
  const [time, setTime] = useState("--:--:--");
  const [brazilToday, setBrazilToday] = useState<BrazilDate | null>(null);
  const [santosWeather, setSantosWeather] = useState<SantosWeather>({temperature:null,label:"CARREGANDO CLIMA",icon:"cloud"});

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }));
      setBrazilToday(getBrazilDate(now));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller=new AbortController();
    const loadWeather=async()=>{
      try{
        const response=await fetch("https://api.open-meteo.com/v1/forecast?latitude=-23.9608&longitude=-46.3336&current=temperature_2m,weather_code,is_day&timezone=America%2FSao_Paulo",{signal:controller.signal});
        if(!response.ok)throw new Error("weather_unavailable");
        const payload=await response.json() as {current?:{temperature_2m?:number;weather_code?:number;is_day?:number}};
        const current=payload.current;
        if(!current||typeof current.temperature_2m!=="number"||typeof current.weather_code!=="number")throw new Error("weather_invalid");
        setSantosWeather({temperature:Math.round(current.temperature_2m),...describeSantosWeather(current.weather_code,current.is_day===1)});
      }catch(error){if(!controller.signal.aborted)setSantosWeather({temperature:null,label:"CLIMA INDISPONÍVEL",icon:"cloud"});}
    };
    void loadWeather();
    const timer=window.setInterval(()=>void loadWeather(),15*60*1000);
    return()=>{controller.abort();window.clearInterval(timer)};
  },[]);

  return { time, brazilToday, santosWeather };
}
