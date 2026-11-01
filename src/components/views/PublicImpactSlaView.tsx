import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Award,
  TrendingDown,
  Building,
  Scale,
  FileCheck2,
} from 'lucide-react';

export const PublicImpactSlaView: React.FC = () => {
  return (
    <div className="w-full px-6 lg:px-10 py-6 flex flex-col gap-6 text-[#161C21] select-none">
      {/* Top Header */}
      <section className="bg-white p-6 rounded-xl border border-[#DCE3EE] shadow-sm flex flex-col gap-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#43474D] uppercase tracking-wider mb-1">
              <span>Ward 112 Indiranagar</span>
              <span>›</span>
              <span className="text-[#0259C5] font-bold">Citizens Charter Accountability</span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#161C21]">
              Public Impact &amp; Municipal SLA Performance Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#D9E2FF] text-[#001A43] text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#0259C5] animate-pulse"></span>
              Gov-Led Algorithmic Audit Active
            </span>
          </div>
        </div>
        <p className="text-xs text-[#43474D] max-w-3xl leading-relaxed">
          Statutory verification metrics under the Karnataka Municipal Citizen Charter. Every municipal agency dispatch is audited with timestamped SHA-256 telemetry.
        </p>
      </section>

      {/* 6 Core KPI Metric Cards (Matches Stitch) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Incidents */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">Total Incidents</span>
            <span className="w-7 h-7 rounded bg-[#EFF4FB] flex items-center justify-center text-[#43474D]">
              <span className="material-symbols-outlined text-[16px]">report</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#161C21]">1,420</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#0259C5] font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.2% vs last month</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#EFF4FB] px-2 py-1 rounded text-[10.5px] text-[#43474D] font-mono">
            100% Geotagged • 0 Unverified
          </div>
        </div>

        {/* KPI 2: Resolved */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">Resolved Audit</span>
            <span className="w-7 h-7 rounded bg-[#D9E2FF] flex items-center justify-center text-[#001A43]">
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#161C21]">1,346</span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#0259C5] font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>94.8% Resolution rate</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#EFF4FB] px-2 py-1 rounded text-[10.5px] text-[#43474D] font-mono">
            74 In-flight / Scheduled
          </div>
        </div>

        {/* KPI 3: Avg Resolution Time */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">Avg Resolution</span>
            <span className="w-7 h-7 rounded bg-[#EFF4FB] flex items-center justify-center text-[#43474D]">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#161C21]">3h 42m</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#0259C5] font-semibold mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-41% since AI dispatch</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#EFF4FB] px-2 py-1 rounded text-[10.5px] text-[#43474D] font-mono">
            Prior Baseline: 6h 15m
          </div>
        </div>

        {/* KPI 4: Emergency SLA */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">Charter Tier-1</span>
            <span className="w-7 h-7 rounded bg-[#D9E2FF] flex items-center justify-center text-[#001A43]">
              <span className="material-symbols-outlined text-[16px]">security</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#0259C5]">99.1%</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#0259C5] font-semibold mt-1">
              <span>15-min Critical Met</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#EFF4FB] px-2 py-1 rounded text-[10.5px] text-[#43474D] font-mono">
            Life Safety Escalation Guard
          </div>
        </div>

        {/* KPI 5: Overdue Breaches */}
        <div className="bg-white p-4 rounded-xl border border-[#BA1A1A]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#BA1A1A] font-bold">Overdue Breaches</span>
            <span className="w-7 h-7 rounded bg-[#FFDAD6] flex items-center justify-center text-[#93000A]">
              <span className="material-symbols-outlined text-[16px]">timer_off</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#BA1A1A]">14</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#BA1A1A] font-bold mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"></span>
              <span>0.9% breach rate</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#FFDAD6] px-2 py-1 rounded text-[10.5px] text-[#93000A] font-mono font-bold">
            ₹1.4L Auto-penalty logged
          </div>
        </div>

        {/* KPI 6: Public Trust Index */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">Public Trust Index</span>
            <span className="w-7 h-7 rounded bg-[#D9E2FF] flex items-center justify-center text-[#001A43]">
              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
            </span>
          </div>
          <div>
            <span className="font-heading text-2xl font-bold tracking-tight text-[#161C21]">94.8%</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#0259C5] font-semibold mt-1">
              <span>Ward 112 Rank #1</span>
            </div>
          </div>
          <div className="mt-3 pt-2 bg-[#EFF4FB] px-2 py-1 rounded text-[10.5px] text-[#43474D] font-mono">
            89% 1st-Time Resolution
          </div>
        </div>
      </section>

      {/* Agency Performance Breakdown Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quad-Agency SLA Compliance Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0259C5]" />
              <h3 className="font-heading text-sm font-bold text-[#161C21]">
                Agency SLA Compliance Comparison
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#43474D]">30-Day Window</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>BESCOM Electrical Distribution</span>
                <span className="font-mono text-[#0259C5]">99.4% (Avg 42m)</span>
              </div>
              <div className="h-2 w-full bg-[#E9EEF5] rounded-full overflow-hidden">
                <div className="h-full bg-[#0259C5] rounded-full" style={{ width: '99.4%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>BWSSB Water &amp; Sanitation</span>
                <span className="font-mono text-[#0259C5]">98.1% (Avg 2.1h)</span>
              </div>
              <div className="h-2 w-full bg-[#E9EEF5] rounded-full overflow-hidden">
                <div className="h-full bg-[#5790FF] rounded-full" style={{ width: '98.1%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>BBMP Road Infrastructure &amp; Pavement</span>
                <span className="font-mono text-[#D95F00]">96.2% (Avg 4.8h)</span>
              </div>
              <div className="h-2 w-full bg-[#E9EEF5] rounded-full overflow-hidden">
                <div className="h-full bg-[#D95F00] rounded-full" style={{ width: '96.2%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>BBMP Solid Waste Marshals</span>
                <span className="font-mono text-[#0259C5]">97.9% (Avg 1.9h)</span>
              </div>
              <div className="h-2 w-full bg-[#E9EEF5] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '97.9%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Statutory Penalty Audit Ledger */}
        <div className="bg-white p-5 rounded-xl border border-[#DCE3EE] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#BA1A1A]" />
              <h3 className="font-heading text-sm font-bold text-[#161C21]">
                Citizen Charter Auto-Penalty Audit Ledger
              </h3>
            </div>
            <span className="text-[10.5px] font-mono text-[#BA1A1A] font-bold bg-[#FFDAD6] px-2 py-0.5 rounded">
              ENFORCED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8F9FF] border border-[#CBD5E1] rounded-lg">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="font-bold text-[#001C33]">TICKET #CV-8431 • BBMP Road Div</span>
                <span className="text-[#BA1A1A] font-bold">₹12,000 PENALTY</span>
              </div>
              <p className="text-[11px] text-[#43474D]">
                Pothole on 100 Feet Road exceeded 48-hour Citizen Charter SLA by 14 hours. Statutory deduction debited from contractor retention fund.
              </p>
            </div>

            <div className="p-3 bg-[#F8F9FF] border border-[#CBD5E1] rounded-lg">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="font-bold text-[#001C33]">TICKET #CV-8389 • BWSSB Main Ops</span>
                <span className="text-[#BA1A1A] font-bold">₹25,000 PENALTY</span>
              </div>
              <p className="text-[11px] text-[#43474D]">
                Drinking water valve replacement delayed 3.2 hours beyond public notice. Direct citizen compensation disbursed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
