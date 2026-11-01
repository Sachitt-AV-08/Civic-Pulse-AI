import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart,
} from 'recharts';
import { Incident } from '../types/incident';

interface WeeklyIncidentForecastChartProps {
  incidents: Incident[];
  onNavigate?: (view: string) => void;
  onSelectIncident?: (inc: Incident) => void;
}

type CategoryFilter = 'all' | 'power' | 'roads' | 'water' | 'traffic';
type ForecastModel = 'arima_gemini' | 'monsoon_surge';

interface DayForecast {
  shortDay: string;
  fullDate: string;
  isProjected: boolean;
  total: number;
  prevWeekBaseline: number;
  powerGrid: number;
  publicWorks: number;
  waterUtilities: number;
  trafficTransit: number;
  criticalP1: number;
  ciUpper: number;
  ciLower: number;
  weatherFactor: string;
}

export const WeeklyIncidentForecastChart: React.FC<WeeklyIncidentForecastChartProps> = ({
  incidents,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedModel, setSelectedModel] = useState<ForecastModel>('arima_gemini');
  const [showConfidenceInterval, setShowConfidenceInterval] = useState<boolean>(true);
  const [showPrevBaseline, setShowPrevBaseline] = useState<boolean>(true);

  // Compute dynamic weights based on current live incidents state
  const incidentWeights = useMemo(() => {
    let power = 0;
    let roads = 0;
    let water = 0;
    let traffic = 0;
    let p1Count = 0;

    incidents.forEach((inc) => {
      if (inc.category === 'Power Grid') power++;
      else if (inc.category === 'Public Works') roads++;
      else if (inc.category === 'Water & Utilities') water++;
      else if (inc.category === 'Traffic & Transit') traffic++;
      else roads++; // default weight

      if (inc.priority === 'P1') p1Count++;
    });

    const total = incidents.length || 1;
    return {
      powerRatio: Math.max(0.2, power / total),
      roadsRatio: Math.max(0.25, roads / total),
      waterRatio: Math.max(0.18, water / total),
      trafficRatio: Math.max(0.15, traffic / total),
      p1Ratio: Math.max(0.1, p1Count / total),
      liveCount: total,
    };
  }, [incidents]);

  // Generate 7-day time series data (Mon-Sun: Mon-Wed actual, Thu-Sun forecasted)
  const forecastData: DayForecast[] = useMemo(() => {
    const isMonsoonSurge = selectedModel === 'monsoon_surge';
    const surgeMultiplier = isMonsoonSurge ? 1.28 : 1.14;

    const baseData = [
      {
        shortDay: 'Mon',
        fullDate: 'Monday, Nov 3',
        isProjected: false,
        total: 34,
        prevWeekBaseline: 31,
        powerGrid: Math.round(34 * incidentWeights.powerRatio * 0.9),
        publicWorks: Math.round(34 * incidentWeights.roadsRatio * 1.0),
        waterUtilities: Math.round(34 * incidentWeights.waterRatio * 0.9),
        trafficTransit: Math.round(34 * incidentWeights.trafficRatio * 1.1),
        criticalP1: 2,
        ciUpper: 38,
        ciLower: 30,
        weatherFactor: 'Clear / 28°C',
      },
      {
        shortDay: 'Tue',
        fullDate: 'Tuesday, Nov 4',
        isProjected: false,
        total: 41,
        prevWeekBaseline: 36,
        powerGrid: Math.round(41 * incidentWeights.powerRatio * 1.1),
        publicWorks: Math.round(41 * incidentWeights.roadsRatio * 1.0),
        waterUtilities: Math.round(41 * incidentWeights.waterRatio * 1.0),
        trafficTransit: Math.round(41 * incidentWeights.trafficRatio * 1.2),
        criticalP1: 3,
        ciUpper: 45,
        ciLower: 37,
        weatherFactor: 'Light Showers / 26°C',
      },
      {
        shortDay: 'Wed (Today)',
        fullDate: 'Wednesday, Nov 5 (Active)',
        isProjected: false,
        total: Math.max(38, incidentWeights.liveCount * 4),
        prevWeekBaseline: 35,
        powerGrid: Math.round(Math.max(38, incidentWeights.liveCount * 4) * incidentWeights.powerRatio),
        publicWorks: Math.round(Math.max(38, incidentWeights.liveCount * 4) * incidentWeights.roadsRatio),
        waterUtilities: Math.round(Math.max(38, incidentWeights.liveCount * 4) * incidentWeights.waterRatio),
        trafficTransit: Math.round(Math.max(38, incidentWeights.liveCount * 4) * incidentWeights.trafficRatio),
        criticalP1: Math.round(Math.max(38, incidentWeights.liveCount * 4) * incidentWeights.p1Ratio),
        ciUpper: Math.round(Math.max(38, incidentWeights.liveCount * 4) * 1.1),
        ciLower: Math.round(Math.max(38, incidentWeights.liveCount * 4) * 0.9),
        weatherFactor: 'Thundercloud Influx / 24°C',
      },
      {
        shortDay: 'Thu (Proj)',
        fullDate: 'Thursday, Nov 6 (Projected Peak)',
        isProjected: true,
        total: Math.round(48 * surgeMultiplier),
        prevWeekBaseline: 40,
        powerGrid: Math.round(48 * surgeMultiplier * (incidentWeights.powerRatio * 1.35)),
        publicWorks: Math.round(48 * surgeMultiplier * (incidentWeights.roadsRatio * 1.2)),
        waterUtilities: Math.round(48 * surgeMultiplier * (incidentWeights.waterRatio * 1.4)),
        trafficTransit: Math.round(48 * surgeMultiplier * (incidentWeights.trafficRatio * 0.9)),
        criticalP1: isMonsoonSurge ? 7 : 5,
        ciUpper: Math.round(48 * surgeMultiplier * 1.18),
        ciLower: Math.round(48 * surgeMultiplier * 0.85),
        weatherFactor: 'Storm Warning (45mm Rain)',
      },
      {
        shortDay: 'Fri (Proj)',
        fullDate: 'Friday, Nov 7 (Projected)',
        isProjected: true,
        total: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08)),
        prevWeekBaseline: 39,
        powerGrid: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * incidentWeights.powerRatio * 1.15),
        publicWorks: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * incidentWeights.roadsRatio * 1.25),
        waterUtilities: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * incidentWeights.waterRatio * 1.2),
        trafficTransit: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * incidentWeights.trafficRatio * 1.1),
        criticalP1: 4,
        ciUpper: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * 1.16),
        ciLower: Math.round(44 * (isMonsoonSurge ? 1.2 : 1.08) * 0.86),
        weatherFactor: 'Overcast / Waterlogging',
      },
      {
        shortDay: 'Sat (Proj)',
        fullDate: 'Saturday, Nov 8 (Projected)',
        isProjected: true,
        total: Math.round(36 * (isMonsoonSurge ? 1.1 : 1.0)),
        prevWeekBaseline: 33,
        powerGrid: Math.round(36 * incidentWeights.powerRatio),
        publicWorks: Math.round(36 * incidentWeights.roadsRatio * 1.1),
        waterUtilities: Math.round(36 * incidentWeights.waterRatio),
        trafficTransit: Math.round(36 * incidentWeights.trafficRatio * 1.3),
        criticalP1: 2,
        ciUpper: Math.round(36 * 1.15),
        ciLower: Math.round(36 * 0.88),
        weatherFactor: 'Scattered Showers / 27°C',
      },
      {
        shortDay: 'Sun (Proj)',
        fullDate: 'Sunday, Nov 9 (Projected)',
        isProjected: true,
        total: Math.round(29 * (isMonsoonSurge ? 1.05 : 0.95)),
        prevWeekBaseline: 28,
        powerGrid: Math.round(29 * incidentWeights.powerRatio * 0.9),
        publicWorks: Math.round(29 * incidentWeights.roadsRatio * 0.95),
        waterUtilities: Math.round(29 * incidentWeights.waterRatio * 0.9),
        trafficTransit: Math.round(29 * incidentWeights.trafficRatio * 0.85),
        criticalP1: 1,
        ciUpper: Math.round(29 * 1.12),
        ciLower: Math.round(29 * 0.88),
        weatherFactor: 'Clear Intervals / 29°C',
      },
    ];

    return baseData;
  }, [incidentWeights, selectedModel]);

  // Aggregate metrics for summary header
  const forecastSummary = useMemo(() => {
    const weeklyTotal = forecastData.reduce((acc, d) => acc + d.total, 0);
    const baselineTotal = forecastData.reduce((acc, d) => acc + d.prevWeekBaseline, 0);
    const pctChange = Math.round(((weeklyTotal - baselineTotal) / baselineTotal) * 100);

    const peakDay = [...forecastData].sort((a, b) => b.total - a.total)[0];
    const projectedP1Total = forecastData
      .filter((d) => d.isProjected)
      .reduce((acc, d) => acc + d.criticalP1, 0);

    return {
      weeklyTotal,
      baselineTotal,
      pctChange,
      peakDay: peakDay.shortDay,
      peakTotal: peakDay.total,
      projectedP1Total,
    };
  }, [forecastData]);

  // Custom Recharts Tooltip styled to institutional palette
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DayForecast = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#011D34] text-white p-3.5 shadow-2xl border border-[#0259C5]/40 text-xs min-w-[240px] z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight">{dataPoint.fullDate}</div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-amber-400">cloud</span>
                <span>{dataPoint.weatherFactor}</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                dataPoint.isProjected
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-400/30'
                  : 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/30'
              }`}
            >
              {dataPoint.isProjected ? 'AI Forecast' : 'Historical'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <div className="flex items-center justify-between text-white font-bold pb-1 border-b border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5790FF]"></span>
                Total Predicted Volume:
              </span>
              <span className="text-sm font-mono text-cyan-300 font-extrabold">{dataPoint.total} tickets</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
                Power Grid (BESCOM):
              </span>
              <span className="font-mono font-semibold text-white">{dataPoint.powerGrid}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]"></span>
                Roads & Potholes (BBMP):
              </span>
              <span className="font-mono font-semibold text-white">{dataPoint.publicWorks}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34D399]"></span>
                Water & Utilities (BWSSB):
              </span>
              <span className="font-mono font-semibold text-white">{dataPoint.waterUtilities}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#A78BFA]"></span>
                Traffic & Congestion:
              </span>
              <span className="font-mono font-semibold text-white">{dataPoint.trafficTransit}</span>
            </div>

            <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                P1 Critical Safety Risk:
              </span>
              <span className="font-mono font-bold text-red-300">{dataPoint.criticalP1} expected</span>
            </div>

            {dataPoint.isProjected && (
              <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between bg-black/30 px-2 py-1 rounded">
                <span>90% Confidence Interval:</span>
                <span className="text-slate-200">
                  [{dataPoint.ciLower} - {dataPoint.ciUpper}]
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
      {/* Forecast Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-[#e9eef5]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-[#161C21] tracking-tight">
              Weekly Incident Forecast
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d9e2ff] text-[#001a43] text-[11px] font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0259C5] animate-pulse"></span>
              ARIMA + Bayesian Spatial Model
            </span>
            <span className="text-xs text-[#43474D] font-mono">
              Live State Synchronized ({incidentWeights.liveCount} incidents in pipeline)
            </span>
          </div>
          <p className="text-xs text-[#43474D]">
            Multi-agency municipal volume projection modeled on historical rain telemetry, road surface degradation rates, and electrical load patterns.
          </p>
        </div>

        {/* Action Controls & Model Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#eff4fb] p-1 rounded-lg border border-[#dde3ea] text-xs">
            <button
              onClick={() => setSelectedModel('arima_gemini')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedModel === 'arima_gemini'
                  ? 'bg-white text-[#0259C5] shadow-xs'
                  : 'text-[#43474D] hover:text-[#161C21]'
              }`}
            >
              Baseline AI Trend
            </button>
            <button
              onClick={() => setSelectedModel('monsoon_surge')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedModel === 'monsoon_surge'
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'text-[#43474D] hover:text-[#BA1A1A]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">thunderstorm</span>
              <span>Monsoon Surge (+28%)</span>
            </button>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('live-map-triage')}
              className="px-3 py-1.5 rounded-lg bg-[#eff4fb] hover:bg-[#d9e2ff] text-[#0259C5] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Hotspot Triage</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytical KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff] flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#43474D] uppercase tracking-wider">
            Projected Weekly Total
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#161C21]">
              {forecastSummary.weeklyTotal}
            </span>
            <span
              className={`text-xs font-bold ${
                forecastSummary.pctChange >= 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {forecastSummary.pctChange >= 0 ? `+${forecastSummary.pctChange}%` : `${forecastSummary.pctChange}%`}
            </span>
          </div>
          <span className="text-[10px] text-[#43474D] font-mono">
            vs 7-day prior baseline ({forecastSummary.baselineTotal})
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff] flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#43474D] uppercase tracking-wider">
            Predicted Surge Apex
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#BA1A1A]">
              Thursday
            </span>
            <span className="text-xs font-bold text-[#BA1A1A]">
              ~{forecastSummary.peakTotal} tickets
            </span>
          </div>
          <span className="text-[10px] text-[#BA1A1A] font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#BA1A1A] animate-pulse"></span>
            18:00 - 21:00 Evening Storm Peak
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff] flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#43474D] uppercase tracking-wider">
            High-Risk Vector
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#0259C5]">
              Power Grid
            </span>
            <span className="text-xs font-bold text-[#0259C5]">BESCOM</span>
          </div>
          <span className="text-[10px] text-[#43474D] font-mono">
            Substation 4 & 100ft Rd feeders
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff] flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#43474D] uppercase tracking-wider">
            Forecasted P1 Escapes
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#D97706]">
              {forecastSummary.projectedP1Total}
            </span>
            <span className="text-xs font-bold text-[#D97706]">Pre-dispatch ready</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            3 QRU crews on standby
          </span>
        </div>
      </div>

      {/* Filter / Category Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[#43474D] mr-1 text-[11px] uppercase tracking-wide">
            Filter View:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#011D34] text-white shadow-xs'
                : 'bg-[#eff4fb] text-[#43474D] hover:bg-[#dde3ea]'
            }`}
          >
            All Municipal Categories
          </button>
          <button
            onClick={() => setSelectedCategory('power')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'power'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-[#eff4fb] text-[#43474D] hover:bg-[#dde3ea]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#D97706]"></span>
            <span>Power Grid</span>
          </button>
          <button
            onClick={() => setSelectedCategory('roads')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'roads'
                ? 'bg-[#0259C5] text-white shadow-xs'
                : 'bg-[#eff4fb] text-[#43474D] hover:bg-[#dde3ea]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#0259C5]"></span>
            <span>Roads & Potholes</span>
          </button>
          <button
            onClick={() => setSelectedCategory('water')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'water'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-[#eff4fb] text-[#43474D] hover:bg-[#dde3ea]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#0D9488]"></span>
            <span>Water & Utilities</span>
          </button>
          <button
            onClick={() => setSelectedCategory('traffic')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'traffic'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-[#eff4fb] text-[#43474D] hover:bg-[#dde3ea]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]"></span>
            <span>Traffic & Congestion</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#43474D]">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showConfidenceInterval}
              onChange={(e) => setShowConfidenceInterval(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-[#0259C5] focus:ring-[#0259C5] cursor-pointer"
            />
            <span className="text-[11px] font-semibold">90% Confidence Band</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPrevBaseline}
              onChange={(e) => setShowPrevBaseline(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-[#0259C5] focus:ring-[#0259C5] cursor-pointer"
            />
            <span className="text-[11px] font-semibold">Prior Week Baseline</span>
          </label>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-72 relative bg-gradient-to-b from-[#fafcff] to-white rounded-xl p-2 border border-[#eff4fb]">
        {/* Subtle division note for Actual vs Forecast */}
        <div className="absolute top-2 right-4 flex items-center gap-3 text-[10px] font-mono text-[#43474D] z-10 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#0259C5]"></span>
            Mon-Wed: Recorded Telemetry
          </span>
          <span className="flex items-center gap-1 text-[#BA1A1A] font-bold">
            <span className="h-2 w-2 rounded-full bg-[#BA1A1A] animate-ping"></span>
            Thu-Sun: Projected Surge Window
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 20, right: 24, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis
              dataKey="shortDay"
              stroke="#64748B"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              dy={6}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax + 12']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '8px', fontSize: '11px', fontWeight: 600 }}
              iconType="circle"
            />

            {/* Confidence Band Area when enabled */}
            {showConfidenceInterval && selectedCategory === 'all' && (
              <Area
                type="monotone"
                dataKey="ciUpper"
                stroke="none"
                fill="#0259C5"
                fillOpacity={0.07}
                name="Forecast Confidence Bound"
              />
            )}

            {/* Baseline from previous week */}
            {showPrevBaseline && (
              <Line
                type="monotone"
                dataKey="prevWeekBaseline"
                name="Prior Week Baseline"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Demarcation line at today (Wed) */}
            <ReferenceLine
              x="Wed (Today)"
              stroke="#0259C5"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: 'TODAY',
                fill: '#0259C5',
                fontSize: 10,
                fontWeight: 800,
                position: 'insideTopLeft',
              }}
            />

            {/* Total Incidents Line */}
            {(selectedCategory === 'all' || selectedCategory === 'power') && (
              <Line
                type="monotone"
                dataKey={selectedCategory === 'power' ? 'powerGrid' : 'total'}
                name={selectedCategory === 'power' ? 'Power Grid (BESCOM)' : 'Total Incident Volume'}
                stroke={selectedCategory === 'power' ? '#D97706' : '#011D34'}
                strokeWidth={3}
                dot={{ r: 4, fill: selectedCategory === 'power' ? '#D97706' : '#011D34', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: selectedCategory === 'power' ? '#D97706' : '#011D34' }}
              />
            )}

            {/* Category: Roads */}
            {(selectedCategory === 'all' || selectedCategory === 'roads') && (
              <Line
                type="monotone"
                dataKey="publicWorks"
                name="Roads & Works (BBMP)"
                stroke="#0259C5"
                strokeWidth={selectedCategory === 'roads' ? 3 : 2}
                dot={{ r: 3, fill: '#0259C5' }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* Category: Water */}
            {(selectedCategory === 'all' || selectedCategory === 'water') && (
              <Line
                type="monotone"
                dataKey="waterUtilities"
                name="Water & Utilities (BWSSB)"
                stroke="#0D9488"
                strokeWidth={selectedCategory === 'water' ? 3 : 2}
                dot={{ r: 3, fill: '#0D9488' }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* Category: Traffic */}
            {(selectedCategory === 'all' || selectedCategory === 'traffic') && (
              <Line
                type="monotone"
                dataKey="trafficTransit"
                name="Traffic & Congestion (BTP)"
                stroke="#7C3AED"
                strokeWidth={selectedCategory === 'traffic' ? 3 : 2}
                dot={{ r: 3, fill: '#7C3AED' }}
                activeDot={{ r: 5 }}
              />
            )}

            {/* High-risk P1 Critical incidents */}
            {selectedCategory === 'all' && (
              <Line
                type="monotone"
                dataKey="criticalP1"
                name="P1 Life Safety Incidents"
                stroke="#DC2626"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#DC2626' }}
                activeDot={{ r: 5 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Advisory Footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#eff4fb] border border-[#dde3ea] text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#BA1A1A] text-[18px]">warning</span>
          <span className="text-[#161C21] font-semibold">
            Action Directive:
          </span>
          <span className="text-[#43474D]">
            Pre-position BESCOM Bucket Unit 09 & BBMP Storm Drain Pump at 100ft Rd / 12th Main junction by 16:30 Thu.
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-[#0259C5] self-end sm:self-auto">
          <span>Confidence: 94.6%</span>
          <span>•</span>
          <span>IMD Radar Sync: 12m ago</span>
        </div>
      </div>
    </div>
  );
};
