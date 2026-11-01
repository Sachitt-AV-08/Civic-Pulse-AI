import React, { useState } from 'react';
import { Incident, PriorityLevel } from '../../types/incident';
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  Building,
  CheckCircle,
  Download,
  RotateCw,
  Sliders,
  Send,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { playAcknowledgeBeep } from '../../utils/audio';

interface OperationsQueueViewProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onDispatchUnits: (incidentId: string) => void;
  onOpenIntakeModal: () => void;
}

export const OperationsQueueView: React.FC<OperationsQueueViewProps> = ({
  incidents,
  onSelectIncident,
  onDispatchUnits,
  onOpenIntakeModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFY' | 'DISPATCHED' | 'IN_PROGRESS' | 'OVERDUE' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>(['inc-01']);

  const formatSlaTime = (seconds: number) => {
    if (seconds <= 0) return 'OVERDUE';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const filtered = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inc.code.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.location.address.toLowerCase().includes(q) ||
      inc.primaryAgency.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'OVERDUE') return inc.slaDeadlineSeconds <= 300 && inc.status !== 'resolved';
    if (activeTab === 'VERIFY') return inc.status === 'triaged';
    if (activeTab === 'DISPATCHED') return inc.status === 'dispatched';
    if (activeTab === 'IN_PROGRESS') return inc.status === 'en_route' || inc.status === 'on_scene';
    if (activeTab === 'RESOLVED') return inc.status === 'resolved';

    if (agencyFilter !== 'ALL' && !inc.primaryAgency.includes(agencyFilter)) return false;
    if (severityFilter === 'CRITICAL' && inc.priority !== 'P1') return false;
    if (severityFilter === 'URGENT' && inc.priority !== 'P2') return false;
    if (severityFilter === 'HIGH' && inc.priority !== 'P3') return false;

    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((i) => i.id));
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ticket ID,Title,Category,Severity,Agency,SLA Seconds,Status']
        .concat(
          filtered.map(
            (i) =>
              `"${i.code}","${i.title.replace(/"/g, '""')}","${i.category}","${i.priority}","${i.primaryAgency}",${i.slaDeadlineSeconds},"${i.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Ward_112_Dispatch_Manifest.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full text-[#161C21] select-none">
      {/* Header Bar */}
      <div className="w-full bg-white px-6 lg:px-10 py-5 border-b border-[#DCE3EE] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[#43474D] text-xs font-mono mb-1 uppercase tracking-wider">
              <span>Operations Command</span>
              <span>›</span>
              <span>Ward 112 (Indiranagar)</span>
              <span>›</span>
              <span className="text-[#0259C5] font-bold">Department Dispatch Desk</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-xl font-bold tracking-tight text-[#161C21]">
                Ward 112 Operations Queue — Multi-Agency Department Dispatch
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E2FF] text-[#001A43] text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[#0259C5] animate-pulse"></span>
                Live Quad-Agency Bridge Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded bg-[#EFF4FB] flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[#0259C5] text-[18px]">verified_user</span>
              <span className="font-mono text-[#43474D]">Telemetry Integrity: <strong className="text-[#0259C5]">99.94%</strong></span>
            </div>
            <button
              onClick={onOpenIntakeModal}
              className="px-4 py-2 rounded bg-[#001C33] hover:bg-[#012745] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <span className="text-base leading-none">+</span>
              <span>Manual Incident Intake</span>
            </button>
          </div>
        </div>

        {/* Status Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Active', count: 142 },
            { id: 'VERIFY', label: 'Needs Verification', count: 14 },
            { id: 'DISPATCHED', label: 'Dispatched', count: 48 },
            { id: 'IN_PROGRESS', label: 'In Progress', count: 62 },
            { id: 'OVERDUE', label: 'Overdue SLA', count: 2, isError: true },
            { id: 'RESOLVED', label: 'Resolved Audit', count: 16 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  tab.isError
                    ? isActive
                      ? 'bg-[#FFDAD6] text-[#93000A] font-bold border border-[#BA1A1A]/30'
                      : 'bg-white text-[#BA1A1A] hover:bg-[#FFDAD6]/40 border border-[#BA1A1A]/20'
                    : isActive
                    ? 'bg-[#011D34] text-white font-bold shadow-xs'
                    : 'bg-[#EFF4FB] text-[#43474D] hover:bg-[#E9EEF5] hover:text-[#161C21]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[10.5px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E3E9F0] text-[#161C21]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center text-xs">
          <div className="xl:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#74777E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ticket ID (e.g. CV-8490), street, landmark, or contractor..."
              className="w-full h-10 pl-9 pr-3 rounded bg-[#EFF4FB] border border-[#CBD5E1] text-[#161C21] placeholder:text-[#74777E] focus:outline-none focus:border-[#0259C5]"
            />
          </div>

          <div className="xl:col-span-3">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="w-full h-10 px-3 rounded bg-[#EFF4FB] border border-[#CBD5E1] text-[#161C21] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Agencies (Quad-Grid Active)</option>
              <option value="BESCOM">BESCOM Electrical</option>
              <option value="BBMP">BBMP Road Infrastructure</option>
              <option value="BWSSB">BWSSB Water & Sewage</option>
            </select>
          </div>

          <div className="xl:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full h-10 px-3 rounded bg-[#EFF4FB] border border-[#CBD5E1] text-[#161C21] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (Tier 1 Life-Safety)</option>
              <option value="URGENT">Urgent (Tier 2)</option>
              <option value="HIGH">High Priority</option>
            </select>
          </div>

          <div className="xl:col-span-2">
            <select className="w-full h-10 px-3 rounded bg-[#EFF4FB] border border-[#CBD5E1] text-[#161C21] focus:outline-none cursor-pointer">
              <option>Ward 112 (Indiranagar HQ)</option>
              <option>Ward 111 (Shantala Nagar)</option>
              <option>Ward 113 (Domlur Grid)</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 bg-[#EFF4FB] px-4 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bulkSelectAll"
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded accent-[#0259C5] cursor-pointer"
              />
              <label htmlFor="bulkSelectAll" className="font-semibold cursor-pointer">
                Select All ({selectedIds.length} selected)
              </label>
            </div>
            <span className="text-[#C3C6CD]">|</span>
            <button
              onClick={() => {
                selectedIds.forEach((id) => onDispatchUnits(id));
                playAcknowledgeBeep();
              }}
              className="px-3 py-1 rounded bg-white text-[#0259C5] font-semibold border border-[#CBD5E1] hover:bg-[#D9E2FF] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Batch Verify ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => playAcknowledgeBeep()}
              className="px-3 py-1 rounded bg-white text-[#161C21] font-medium border border-[#CBD5E1] hover:bg-[#E9EEF5] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-[#74777E]" />
              <span>Re-route Agency</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1 rounded bg-white text-[#43474D] hover:text-[#161C21] font-semibold border border-[#CBD5E1] hover:bg-[#E9EEF5] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Manifest CSV</span>
            </button>
            <button
              onClick={() => playAcknowledgeBeep()}
              className="p-1.5 rounded bg-white text-[#43474D] hover:text-[#161C21] border border-[#CBD5E1] hover:bg-[#E9EEF5] cursor-pointer shadow-xs"
              title="Refresh Live Queue"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Operations Dispatch Table */}
      <div className="p-6 lg:p-10">
        <div className="bg-white rounded-xl border border-[#DCE3EE] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E9EEF5] bg-[#F8F9FF] text-[#43474D] uppercase font-mono text-[11px]">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4 font-bold">Ticket ID</th>
                  <th className="py-3 px-4 font-bold">Incident Headline & Landmark</th>
                  <th className="py-3 px-4 font-bold">Agency Handshake</th>
                  <th className="py-3 px-4 font-bold">Active Priority</th>
                  <th className="py-3 px-4 font-bold">AI Rec & Severity</th>
                  <th className="py-3 px-4 font-bold">SLA Degradation</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((inc) => {
                  const isChecked = selectedIds.includes(inc.id);
                  const isOverdue = inc.slaDeadlineSeconds <= 300 && inc.status !== 'resolved';

                  return (
                    <tr
                      key={inc.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isChecked ? 'bg-[#EFF4FB]/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(inc.id)}
                          className="w-4 h-4 rounded accent-[#0259C5] cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#011D34] whitespace-nowrap">
                        {inc.code}
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <div
                          onClick={() => onSelectIncident(inc)}
                          className="font-bold text-[#161C21] hover:text-[#0259C5] cursor-pointer leading-snug line-clamp-1"
                        >
                          {inc.title}
                        </div>
                        <p className="text-[11px] text-[#43474D] truncate mt-0.5 font-mono">
                          📍 {inc.location.address}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#EFF4FB] border border-[#D9E2FF] text-[#001A43] font-semibold font-mono text-[11px]">
                          {inc.primaryAgency.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10.5px] uppercase ${
                            inc.priority === 'P1'
                              ? 'bg-[#FFDAD6] text-[#93000A] border border-[#BA1A1A]/30'
                              : inc.priority === 'P2'
                              ? 'bg-[#FFDBCA] text-[#783200] border border-[#D95F00]/30'
                              : inc.priority === 'P3'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#EFF4FB] text-[#0259C5]'
                          }`}
                        >
                          {inc.priority} · {inc.priorityLabel.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inc.aiRecommendedPriority ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  inc.aiRecommendedPriority.recommendedPriority === 'P1'
                                    ? 'bg-[#FFDAD6] text-[#93000A]'
                                    : inc.aiRecommendedPriority.recommendedPriority === 'P2'
                                    ? 'bg-[#FFDBCA] text-[#783200]'
                                    : 'bg-[#EFF4FB] text-[#001A43]'
                                }`}
                              >
                                {inc.aiRecommendedPriority.recommendedPriority}
                              </span>
                              <span className="font-extrabold text-[#011D34] text-[11px]">
                                {inc.aiRecommendedPriority.automatedSeverityScore}/100
                              </span>
                              {inc.aiRecommendedPriority.reviewStatus === 'accepted' && (
                                <span className="text-emerald-700 font-bold text-[10px]">✓</span>
                              )}
                            </div>
                            <span
                              className="text-[10px] text-[#5A6066] font-mono truncate max-w-[130px]"
                              title={inc.aiRecommendedPriority.historicalPattern.patternClusterId}
                            >
                              {inc.aiRecommendedPriority.historicalPattern.patternClusterId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <div
                          className={`flex items-center gap-1.5 ${
                            isOverdue ? 'text-[#BA1A1A] animate-pulse' : 'text-[#161C21]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatSlaTime(inc.slaDeadlineSeconds)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold uppercase ${
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
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectIncident(inc)}
                            className="p-1.5 rounded bg-white hover:bg-[#EFF4FB] border border-[#CBD5E1] text-[#0259C5] cursor-pointer"
                            title="Inspect in Live Map & Triage"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inc.status === 'triaged' && (
                            <button
                              onClick={() => {
                                onDispatchUnits(inc.id);
                                playAcknowledgeBeep();
                              }}
                              className="px-2.5 py-1 rounded bg-[#001C33] hover:bg-[#012745] text-white font-bold text-[11px] cursor-pointer shadow-xs"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
