import React, { useState } from 'react';
import { Incident, PriorityLevel } from '../types/incident';
import { Search, Filter, AlertCircle, Clock, ShieldAlert, ArrowUpDown } from 'lucide-react';

interface IncidentQueueProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'AI_REVIEW' | 'P1' | 'P2' | 'UTILITIES' | 'TRANSIT' | 'RESOLVED'>('ALL');
  const [sortBy, setSortBy] = useState<'SLA' | 'PRIORITY' | 'RECENT'>('SLA');

  // Filter incidents
  const filtered = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inc.code.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.location.address.toLowerCase().includes(q) ||
      inc.category.toLowerCase().includes(q) ||
      inc.caller.name.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterTab === 'AI_REVIEW') {
      return (
        inc.aiRecommendedPriority?.reviewStatus === 'pending_review' ||
        inc.aiRecommendedPriority?.recommendedPriority !== inc.priority
      );
    }
    if (filterTab === 'P1') return inc.priority === 'P1';
    if (filterTab === 'P2') return inc.priority === 'P2';
    if (filterTab === 'UTILITIES')
      return inc.category === 'Water & Utilities' || inc.category === 'Power Grid';
    if (filterTab === 'TRANSIT') return inc.category === 'Traffic & Transit';
    if (filterTab === 'RESOLVED') return inc.status === 'resolved';

    return true;
  });

  // Sort incidents
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'SLA') {
      return a.slaDeadlineSeconds - b.slaDeadlineSeconds;
    }
    if (sortBy === 'PRIORITY') {
      const order: Record<PriorityLevel, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
      return order[a.priority] - order[b.priority];
    }
    // RECENT
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });

  const formatSlaTime = (seconds: number) => {
    if (seconds <= 0) return 'SLA BREACHED';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const getPriorityBorder = (priority: PriorityLevel, status: string) => {
    if (status === 'resolved') return 'border-l-emerald-600';
    switch (priority) {
      case 'P1':
        return 'border-l-[#BA1A1A]';
      case 'P2':
        return 'border-l-[#F97316]';
      case 'P3':
        return 'border-l-[#D97706]';
      default:
        return 'border-l-[#0159C5]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#CBD5E1] select-none">
      {/* Queue Header & Counter */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F8F9FF]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-sm font-bold tracking-tight text-[#001C33] uppercase">
              Triage Incident Feed
            </h2>
            <span className="text-xs font-mono font-bold bg-[#E2E8F0] text-[#161C21] px-1.5 py-0.5 rounded">
              {sorted.length}
            </span>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-1 text-[11px] text-[#5A6066]">
            <ArrowUpDown className="w-3 h-3 text-[#0159C5]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-[#001C33] cursor-pointer focus:outline-none"
            >
              <option value="SLA">Sort: SLA Urgent</option>
              <option value="PRIORITY">Sort: Priority</option>
              <option value="RECENT">Sort: Most Recent</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A6066]" />
          <input
            type="text"
            placeholder="Search ID, street, keyword, or caller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#CBD5E1] rounded text-[#001C33] placeholder:text-[#8896A6] focus:border-[#0159C5] focus:ring-1 focus:ring-[#0159C5] focus:outline-none transition-all"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'AI_REVIEW', label: '⚡ AI Review' },
            { id: 'P1', label: 'P1 Life-Safety' },
            { id: 'P2', label: 'P2 Urgent' },
            { id: 'UTILITIES', label: 'Utilities' },
            { id: 'TRANSIT', label: 'Transit' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-2 py-1 text-[11px] font-medium whitespace-nowrap rounded transition-colors cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-[#001C33] text-white font-semibold'
                  : 'text-[#5A6066] hover:bg-[#E9EEF5] hover:text-[#001C33]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-[#5A6066]">
            <AlertCircle className="w-8 h-8 mx-auto text-[#8896A6] mb-2" />
            <p className="text-xs font-semibold">No incidents found in this filter.</p>
            <p className="text-[11px] text-[#8896A6] mt-1">Try clearing your search query.</p>
          </div>
        ) : (
          sorted.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const isBreaching = inc.slaDeadlineSeconds < 300 && inc.status !== 'resolved';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3 transition-colors cursor-pointer border-l-4 ${getPriorityBorder(
                  inc.priority,
                  inc.status
                )} ${
                  isSelected
                    ? 'bg-[#EBF3FC] text-[#001C33]'
                    : 'bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Header Row: Code, Category & SLA */}
                <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-[#001C33]">{inc.code}</span>
                    <span className="text-[#8896A6]">·</span>
                    <span className="text-[#5A6066] font-sans">{inc.category}</span>
                  </div>

                  {/* SLA Countdown Timer */}
                  <div
                    className={`flex items-center gap-1 font-mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${
                      isBreaching
                        ? 'bg-[#FFDAD6] text-[#BA1A1A] animate-pulse font-bold'
                        : inc.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#F1F5F9] text-[#001C33]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="tabular-nums">{formatSlaTime(inc.slaDeadlineSeconds)}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-heading text-xs font-bold text-[#161C21] line-clamp-2 leading-snug mb-1">
                  {inc.title}
                </h3>

                {/* Location */}
                <p className="text-[11px] text-[#5A6066] truncate mb-2">
                  📍 {inc.location.address} · {inc.location.district.split('-')[0].trim()}
                </p>

                {/* Metadata Footer: AI Recommended Priority, Confidence & Dispatch Status */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F1F5F9] gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.2 bg-[#EBF3FC] border border-[#BFDBFE] rounded text-[10px] font-mono font-bold text-[#0159C5]">
                      AI {inc.aiConfidence.toFixed(0)}%
                    </span>
                    {inc.aiRecommendedPriority && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          inc.aiRecommendedPriority.recommendedPriority === 'P1'
                            ? 'bg-red-100 text-red-800'
                            : inc.aiRecommendedPriority.recommendedPriority === 'P2'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-[#001C33]'
                        }`}
                        title={`Automated Severity: ${inc.aiRecommendedPriority.automatedSeverityScore}/100. Pattern: ${inc.aiRecommendedPriority.historicalPattern.patternClusterId}`}
                      >
                        AI: {inc.aiRecommendedPriority.recommendedPriority} ({inc.aiRecommendedPriority.automatedSeverityScore})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded font-mono ${
                        inc.priority === 'P1'
                          ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                          : inc.priority === 'P2'
                          ? 'bg-[#FFF7ED] text-[#C2410C]'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {inc.priority}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded font-mono ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.status === 'on_scene'
                          ? 'bg-blue-100 text-blue-800'
                          : inc.status === 'dispatched' || inc.status === 'en_route'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
