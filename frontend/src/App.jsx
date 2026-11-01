import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, getSavedRole, saveRole } from "./api";

const STATUS_LABELS = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened"
};

const STATUS_TONE = {
  reported: "bg-surface-container text-on-surface-variant border-outline-variant",
  verified: "bg-secondary-fixed text-on-secondary-fixed border-secondary/20",
  assigned: "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/20",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-300",
  reopened: "bg-red-100 text-red-800 border-red-200"
};

const SEVERITY_COLOR = {
  1: "#16a34a",
  2: "#0259c5",
  3: "#d97706",
  4: "#f97316",
  5: "#ba1a1a"
};

const OPEN_STATUSES = ["reported", "verified", "assigned", "in_progress", "reopened"];
const CATEGORY_META = [
  { slug: "pothole", label: "Road / pothole", icon: "construction" },
  { slug: "garbage", label: "Garbage / waste", icon: "delete" },
  { slug: "streetlight", label: "Streetlight", icon: "lightbulb" },
  { slug: "water", label: "Water / leak", icon: "water_drop" },
  { slug: "signage", label: "Signage / traffic", icon: "signpost" }
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "live-map", label: "Live Map & Triage", icon: "map" },
  { id: "report", label: "Report Issue", icon: "add_circle" },
  { id: "queue", label: "Operations Queue", icon: "inbox" },
  { id: "impact", label: "Public Impact", icon: "query_stats" },
  { id: "community", label: "Community", icon: "forum" },
  { id: "alerts", label: "Alerts", icon: "notifications_active" },
  { id: "profile", label: "Profile", icon: "account_circle" }
];

const severityLabel = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Urgent",
  5: "Critical"
};

function SeverityPalette(value) {
  const color = SEVERITY_COLOR[value] || "#73777e";
  return { background: `${color}16`, color, border: `${color}55` };
}

function Badge({ children, tone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${tone}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONE[status] || STATUS_TONE.reported}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

function MetricCard({ icon, label, value, hint, emphasis = "normal" }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-outline-variant">
      <div className="flex items-center justify-between">
        <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{label}</span>
        <span className={`p-1.5 rounded flex items-center justify-center ${emphasis === "danger" ? "bg-error-container text-on-error-container" : "bg-surface-container-low text-secondary"}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
      </div>
      <div className="my-space-sm">
        <div className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">{value}</div>
        <div className="font-label-sm text-on-surface-variant mt-0.5">{hint}</div>
      </div>
      {emphasis === "danger" && (
        <div className="pt-space-xs flex items-center gap-1.5 font-label-sm font-semibold text-error">
          <span className="h-2 w-2 rounded-full bg-error animate-ping" />
          Escalated
        </div>
      )}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm ${className}`}>{children}</div>;
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm">
      <div className="flex flex-col gap-space-xs">
        <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">{title}</h2>
        {subtitle && <p className="font-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-space-xs">
      <span className="font-label-md uppercase text-on-surface-variant font-semibold">{label}</span>
      {children}
      {hint && <span className="font-body-sm text-on-surface-variant">{hint}</span>}
    </label>
  );
}

function inputClass() {
  return "h-11 w-full rounded bg-surface-container-lowest border border-outline-variant px-space-sm text-on-surface font-body-md focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all";
}

function SmallButton({ children, tone = "secondary", className = "", busy = false, ...props }) {
  const styles = {
    primary: "bg-secondary text-on-secondary hover:bg-secondary/90",
    secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
    municipal: "bg-primary text-on-primary hover:bg-primary-container",
    outline: "bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container",
    ghost: "bg-surface-container-low text-on-surface-variant hover:text-on-surface",
    urgent: "bg-error text-on-error hover:bg-error/90"
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 h-10 px-space-md rounded font-label-md font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 ${styles[tone] || styles.secondary} ${className}`}
      {...props}
    >
      {busy && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
      {!busy && children}
      {busy && <span>working</span>}
    </button>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-container p-space-sm">
      <div className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">{label}</div>
      <div className="font-tabular-md text-on-surface">{value}</div>
    </div>
  );
}

function markIcon(issue, selected) {
  const color = SEVERITY_COLOR[issue.severity] || SEVERITY_COLOR[3];
  return L.divIcon({
    className: "pulse-marker",
    html: `<span style="display:inline-flex;width:32px;height:32px;border-radius:9999px;background:${color};color:#fff;border:2px solid #fff;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:0 2px 6px rgba(0,28,51,.28);${selected ? "outline:3px solid rgba(2,89,197,.35);" : ""}">${issue.severity}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function LeafletMap({ issues, selectedId, onSelect }) {
  const center = issues.length
    ? [
        issues.reduce((sum, i) => sum + i.latitude, 0) / issues.length,
        issues.reduce((sum, i) => sum + i.longitude, 0) / issues.length
      ]
    : [12.9784, 77.6408];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {issues.map((issue) => (
        <Marker
          key={issue.id}
          position={[issue.latitude, issue.longitude]}
          icon={markIcon(issue, issue.id === selectedId)}
          eventHandlers={{ click: () => onSelect(issue.id) }}
        >
          <Popup>
            <div className="flex flex-col gap-1">
              <strong>{issue.title}</strong>
              <span>{issue.id} • {issue.status} • {issue.severity}/5</span>
              <span>{issue.department}</span>
              <span>Support {issue.support_count || 0} • Comments {issue.comment_count || 0}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function App() {
  const [role, setRole] = useState(getSavedRole());
  const [tab, setTab] = useState("dashboard");
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [feed, setFeed] = useState({ trending_issues: [], recent_comments: [], stats: { issues: 0, comments: 0, supports: 0 } });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsBusy, setCommentsBusy] = useState(false);
  const [supportBusy, setSupportBusy] = useState(null);
  const [queueBusy, setQueueBusy] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [filters, setFilters] = useState({ status: "open", category: "", minSeverity: "0" });
  const [reportDraft, setReportDraft] = useState({
    description: "",
    title: "",
    category: "",
    address: "Indiranagar Metro Station, 12th Main Road",
    latitude: 12.9784,
    longitude: 77.6408,
    reporter_name: "Demo resident"
  });
  const [triageDraft, setTriageDraft] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);

  const triageTimer = useRef(null);

  const visibleIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const open = filters.status === "all" ? true : filters.status === "open" ? OPEN_STATUSES.includes(issue.status) : issue.status === filters.status;
        const category = !filters.category || issue.category === filters.category;
        const severity = filters.minSeverity === "0" || issue.severity >= Number(filters.minSeverity);
        return open && category && severity;
      })
      .sort((a, b) => {
        if (b.severity !== a.severity) return b.severity - a.severity;
        if ((b.support_count || 0) !== (a.support_count || 0)) return (b.support_count || 0) - (a.support_count || 0);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [issues, filters]);

  const openIssues = useMemo(() => issues.filter((i) => OPEN_STATUSES.includes(i.status)), [issues]);
  const criticalIssues = useMemo(() => issues.filter((i) => i.severity >= 4 && OPEN_STATUSES.includes(i.status)), [issues]);
  const queueIssues = useMemo(() => issues.filter((i) => OPEN_STATUSES.includes(i.status)), [issues]);
  const issueCenter = useMemo(() => {
    if (issues.length === 0) return [12.9784, 77.6408];
    return [
      issues.reduce((sum, issue) => sum + issue.latitude, 0) / issues.length,
      issues.reduce((sum, issue) => sum + issue.longitude, 0) / issues.length
    ];
  }, [issues]);

  async function loadAll() {
    try {
      const [list, stat, community] = await Promise.all([
        api.listIssues({ limit: 1000 }),
        api.getStats(),
        api.getCommunityFeed()
      ]);
      setIssues(list);
      setStats(stat);
      setFeed(community);
      setError("");
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshIssue(id) {
    try {
      const detail = await api.getIssue(id);
      const list = await api.listComments(id);
      setSelected(detail);
      setComments(list);
    } catch (err) {
      setError(err.message);
    }
  }

  async function runStatusUpdate(issue, status) {
    setQueueBusy(issue.id);
    try {
      await api.updateStatus(issue.id, {
        status,
        note: `Moved to ${STATUS_LABELS[status]}`,
        crew: "Field operations"
      });
      await loadAll();
      if (selectedId === issue.id) await refreshIssue(issue.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setQueueBusy(null);
    }
  }

  async function handleSupport(issue) {
    setSupportBusy(issue.id);
    try {
      await api.supportIssue(issue.id, { actor_label: issue.reporter_name || "Resident" });
      await loadAll();
      if (selectedId === issue.id) await refreshIssue(issue.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSupportBusy(null);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    setReportBusy(true);
    try {
      const created = await api.createIssue({
        title: reportDraft.title || undefined,
        description: reportDraft.description,
        address: reportDraft.address,
        latitude: Number(reportDraft.latitude),
        longitude: Number(reportDraft.longitude),
        reporter_name: reportDraft.reporter_name
      });
      await loadAll();
      setReportDraft((old) => ({ ...old, description: "", title: "" }));
      setSelectedId(created.id);
      setTab("live-map");
    } catch (err) {
      setError(err.message);
    } finally {
      setReportBusy(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadAll();
        if (!selectedId && issues.length) setSelectedId(issues[0].id);
      } catch {
        setError("Could not connect to civic services");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (issues.length === 0) return;
    if (!selectedId || !issues.some((item) => item.id === selectedId)) {
      setSelectedId(issues[0].id);
    }
  }, [issues, selectedId]);

  useEffect(() => {
    if (selectedId) {
      refreshIssue(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const text = reportDraft.description.trim();
    if (text.length < 5) {
      setTriageDraft(null);
      return;
    }
    if (triageTimer.current) window.clearTimeout(triageTimer.current);
    triageTimer.current = window.setTimeout(() => {
      api.previewTriage({ description: reportDraft.description, category: reportDraft.category })
        .then(setTriageDraft)
        .catch(() => setTriageDraft(null));
    }, 250);
    return () => {
      if (triageTimer.current) window.clearTimeout(triageTimer.current);
    };
  }, [reportDraft.description, reportDraft.category]);

  async function handleComment(issue, body) {
    if (!body?.trim()) return;
    setCommentsBusy(true);
    try {
      await api.addComment(issue.id, {
        author: role === "admin" ? "Municipal responder" : "Resident",
        body
      });
      setCommentDraft("");
      await refreshIssue(issue.id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentsBusy(false);
    }
  }

  function changeRole(newRole) {
    setRole(newRole);
    saveRole(newRole);
  }

  const incidentsByCategory = Object.entries(stats?.by_category || {});
  const incidentsBySeverity = Object.entries(stats?.by_severity || {}).sort((a, b) => Number(b[0]) - Number(a[0]));
  const maxDaily = Math.max(1, ...(stats?.recent_daily || []).map((d) => d.count));
  const mapCenter = issueCenter;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-space-sm">
          <span className="material-symbols-outlined text-[40px] text-secondary animate-spin">progress_activity</span>
          <p className="font-body-md text-on-surface-variant">Loading civic data...</p>
        </div>
      </div>
    );
  }

  function Shell({ children }) {
    return (
      <div className="min-h-screen bg-background font-body-md text-on-surface antialiased flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant shadow-[0_2px_8px_-2px_rgba(0,28,51,0.06)]">
          <div className="max-w-[1720px] mx-auto h-20 px-margin-lg flex items-center justify-between gap-space-md">
            <a
              className="flex items-center gap-space-lg shrink-0"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTab("dashboard");
              }}
            >
              <span className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[24px]">account_balance</span>
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">Civic Pulse AI</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-label-sm font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    AI
                  </span>
                </div>
                <span className="hidden md:block font-label-sm text-on-surface-variant">Zone: Bengaluru East • Ward 112 (Indiranagar)</span>
              </div>
            </a>
            <nav className="hidden xl:flex items-center h-full gap-space-md">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`h-full px-3 flex items-center gap-1.5 font-body-md rounded-md transition-colors ${
                    tab === item.id ? "bg-secondary-fixed text-on-secondary-fixed font-semibold" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="hidden lg:flex items-center gap-space-md shrink-0">
              <span className="flex items-center gap-2 px-space-sm py-1 rounded bg-surface-container-low border border-outline-variant font-label-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                Live telemetry • {loaded ? "synced" : "connecting"}
              </span>
              <div className="flex items-center p-0.5 bg-surface-container rounded-lg border border-outline-variant">
                <button className={`px-2.5 py-1 rounded text-[11px] font-label-sm font-medium transition-all ${role === "citizen" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant"}`} onClick={() => changeRole("citizen")}>
                  Citizen
                </button>
                <button className={`px-2.5 py-1 rounded text-[11px] font-label-sm font-medium transition-all ${role === "admin" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant"}`} onClick={() => changeRole("admin")}>
                  Officer
                </button>
              </div>
              <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg" onClick={() => setTab("alerts")}>
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {criticalIssues.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />}
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-outline-variant">
                <div className="text-right hidden 2xl:block">
                  <div className="font-label-md font-semibold text-on-surface leading-tight">Inspector R. Sharma</div>
                  <div className="font-label-sm text-on-surface-variant leading-tight">Ward 112 Command</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <aside className="hidden xl:flex fixed left-0 top-20 bottom-0 w-64 bg-surface-container-lowest border-r border-outline-variant z-40 flex-col p-space-md gap-space-md">
          <div className="flex flex-col gap-space-md">
            <div className="px-space-sm py-1">
              <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Operations Command</span>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-3 px-space-md py-2.5 rounded-lg text-body-md transition-all font-medium ${
                    tab === item.id ? "bg-secondary-fixed text-on-secondary-fixed shadow-sm" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto rounded-lg bg-surface-container-low border border-outline-variant p-space-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm font-semibold text-on-surface">Indiranagar 112 Grid</span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </div>
            <p className="font-body-sm text-on-surface-variant">
              {stats ? `${stats.open} open • ${stats.overdue} overdue • ${stats.avg_resolution_hours || 0}h average` : "Loading live SLA telemetry..."}
            </p>
          </div>
        </aside>

        <main className="relative w-full min-h-screen bg-background pt-20 pb-24 xl:pb-6 xl:pl-64">
          <div className="max-w-[1720px] mx-auto px-margin-lg py-space-lg flex flex-col gap-space-lg">
            {error && (
              <div className="rounded-lg border border-error-container bg-error-container text-on-error-container px-space-md py-space-sm font-label-md font-semibold flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{error}</span>
              </div>
            )}
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-2px_8px_rgba(0,28,51,0.06)] xl:hidden">
          <div className="grid grid-cols-5">
            {NAV.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 text-[10px] font-label-sm ${
                  tab === item.id ? "text-secondary font-semibold" : "text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <Shell>
      {tab === "dashboard" && (
        <>
          <div className="relative overflow-hidden rounded-xl bg-primary-container p-space-xl text-on-primary shadow-md">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
              <div className="flex flex-col gap-space-sm max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm font-semibold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  Ward 112 live grid active
                </span>
                <h1 className="font-display-lg text-display-lg font-bold tracking-tight">Civic Operations & Accountability Console</h1>
                <p className="font-body-md text-primary-fixed-dim max-w-2xl leading-relaxed">
                  Real-time issue triage, department routing, SLA governance, and transparent resolution for Bengaluru East.
                </p>
              </div>
              <div className="flex flex-wrap gap-space-sm">
                <button
                  type="button"
                  onClick={() => setTab("report")}
                  className="flex items-center gap-2 px-space-md py-2.5 rounded bg-secondary text-on-secondary font-label-md font-semibold shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Report an issue
                </button>
                <button
                  type="button"
                  onClick={loadAll}
                  className="flex items-center gap-2 px-space-md py-2.5 rounded bg-surface-container-lowest text-on-surface font-label-md font-semibold hover:bg-surface-container shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-lg">
            <MetricCard icon="emergency_home" label="Active issues" value={stats?.open || 0} hint="Under active jurisdiction" />
            <MetricCard icon="timer_off" label="Overdue SLAs" value={stats?.overdue || 0} hint="Escalated for review" emphasis={stats?.overdue ? "danger" : "normal"} />
            <MetricCard icon="bolt" label="Avg. resolution" value={`${stats?.avg_resolution_hours || 0}h`} hint="From report to closure" />
            <MetricCard icon="verified" label="Citizen trust" value={`${((stats?.avg_rating || 0) * 20).toFixed(0)}%`} hint="From resolved audits" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
            <div className="xl:col-span-8">
              <Card className="p-space-md flex flex-col gap-space-md">
                <SectionHeader
                  title="Live Ward 112 Hotspot Geometry"
                  subtitle="Real-time incident densities and field emergency coverage"
                  right={
                    <div className="flex flex-wrap gap-space-sm">
                      <ButtonPill label="All" active />
                      <ButtonPill label="Severity 3+" />
                      <ButtonPill label="Overdue" />
                    </div>
                  }
                />
                <div className="h-[58vh] min-h-[460px] overflow-hidden rounded-lg border border-outline-variant relative bg-surface-container">
                  <LeafletMap issues={visibleIssues} selectedId={selectedId} onSelect={setSelectedId} />
                </div>
              </Card>
          </div>
            <aside className="xl:col-span-4 flex flex-col gap-space-lg">
              <Inspector
                issue={selected}
                comments={comments}
                role={role}
                running={queueBusy === selected?.id}
                onStatus={runStatusUpdate}
                onSupport={handleSupport}
                supportBusy={supportBusy === selected?.id}
                commentDraft={commentDraft}
                onCommentChange={setCommentDraft}
                onComment={(body) => selected && handleComment(selected, body)}
                commentBusy={commentsBusy}
              />
              <Card className="p-space-lg flex flex-col gap-space-md">
                <SectionHeader title="Community signal" subtitle="Resident confirmations entering the system" />
                <div className="flex flex-col gap-space-sm">
                  {(feed.trending_issues || []).slice(0, 3).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setSelectedId(issue.id);
                        setTab("live-map");
                      }}
                      className="group flex items-center gap-space-sm rounded-lg p-space-sm hover:bg-surface-container-low transition-colors"
                    >
                      <span style={SeverityPalette(issue.severity)} className="flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold">
                        {issue.severity}
                      </span>
                      <span className="flex-1 min-w-0 text-left">
                        <span className="block font-title-md text-on-surface truncate">{issue.title}</span>
                        <span className="block font-body-sm text-on-surface-variant">{issue.support_count || 0} backed • {issue.comment_count || 0} comments</span>
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                  ))}
                  {(feed.trending_issues || []).length === 0 && <p className="font-body-sm text-on-surface-variant">No community activity yet.</p>}
                </div>
              </Card>
            </aside>

          </div>
        </>
      )}

      {tab === "live-map" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
          <div className="xl:col-span-8">
            <Card className="p-space-md flex flex-col gap-space-md">
              <SectionHeader
                title="Live map and AI triage"
                subtitle="Select a marker to inspect SLA, audit trail, and resolution workflow"
                right={
                  <div className="flex flex-wrap gap-space-sm">
                    <select className={inputClass() + " h-9 w-[150px]"} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                      <option value="open">Open issues</option>
                      <option value="all">All statuses</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <select className={inputClass() + " h-9 w-[150px]"} value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                      <option value="">All categories</option>
                      {CATEGORY_META.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                    </select>
                    <select className={inputClass() + " h-9 w-[140px]"} value={filters.minSeverity} onChange={(e) => setFilters((p) => ({ ...p, minSeverity: e.target.value }))}>
                      <option value="0">Any severity</option>
                      <option value="3">Moderate+</option>
                      <option value="4">High+</option>
                      <option value="5">Critical only</option>
                    </select>
                  </div>
                }
              />
              <div className="h-[68vh] min-h-[520px] overflow-hidden rounded-lg border border-outline-variant relative bg-surface-container">
                <LeafletMap issues={visibleIssues} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            </Card>
          </div>
          <div className="xl:col-span-4">
            <Inspector
              issue={selected}
              comments={comments}
              role={role}
              running={queueBusy === selected?.id}
              onStatus={runStatusUpdate}
              onSupport={handleSupport}
              supportBusy={supportBusy === selected?.id}
              commentDraft={commentDraft}
              onCommentChange={setCommentDraft}
              onComment={(body) => selected && handleComment(selected, body)}
              commentBusy={commentsBusy}
            />
          </div>
        </div>
      )}

      {tab === "report" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
          <div className="xl:col-span-7">
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="Report an issue" subtitle="Residents describe what they see. AI triage suggests category, severity, department, and SLA." />
              <form className="flex flex-col gap-space-md" onSubmit={submitReport}>
                <Field label="Description">
                  <textarea className={inputClass() + " min-h-[160px] py-space-sm"} required value={reportDraft.description} onChange={(e) => setReportDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Example: Overhead wire near bus stop, live hazard, traffic blocked, urgent repair needed." />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <Field label="Title (optional)"><input className={inputClass()} value={reportDraft.title} onChange={(e) => setReportDraft((p) => ({ ...p, title: e.target.value }))} /></Field>
                  <Field label="Reporter name"><input className={inputClass()} value={reportDraft.reporter_name} onChange={(e) => setReportDraft((p) => ({ ...p, reporter_name: e.target.value }))} /></Field>
                  <Field label="Address / landmark"><input className={inputClass()} value={reportDraft.address} onChange={(e) => setReportDraft((p) => ({ ...p, address: e.target.value }))} /></Field>
                  <Field label="Category hint">
                    <select className={inputClass()} value={reportDraft.category} onChange={(e) => setReportDraft((p) => ({ ...p, category: e.target.value }))}>
                      <option value="">Auto-detect</option>
                      {CATEGORY_META.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Latitude"><input className={inputClass()} value={reportDraft.latitude} onChange={(e) => setReportDraft((p) => ({ ...p, latitude: e.target.value }))} /></Field>
                  <Field label="Longitude"><input className={inputClass()} value={reportDraft.longitude} onChange={(e) => setReportDraft((p) => ({ ...p, longitude: e.target.value }))} /></Field>
                </div>
                <div className="flex flex-wrap gap-space-sm pt-space-xs">
                  <SmallButton type="submit" busy={reportBusy}><span className="material-symbols-outlined text-[18px]">add_circle</span>{reportBusy ? "Creating..." : "Create issue"}</SmallButton>
                  <SmallButton type="button" tone="ghost" onClick={loadAll}><span className="material-symbols-outlined text-[18px]">refresh</span>Refresh data</SmallButton>
                </div>
              </form>
            </Card>
          </div>
          <div className="xl:col-span-5">
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="AI triage preview" subtitle="Updates as resident text changes" />
              {triageDraft ? (
                <div className="flex flex-col gap-space-md">
                  <div className="rounded-lg bg-surface-container-low border border-outline-variant p-space-md">
                    <div className="flex items-center justify-between gap-space-sm">
                      <span className="font-title-md text-on-surface">{triageDraft.category_label || triageDraft.category}</span>
                      <Badge tone="bg-secondary-fixed text-on-secondary-fixed border-secondary/20">{Math.round((triageDraft.confidence || 0.8) * 100)}% confidence</Badge>
                    </div>
                    <div className="mt-space-sm grid grid-cols-2 gap-space-sm">
                      <Fact label="Severity" value={`${triageDraft.severity}/5 ${severityLabel[triageDraft.severity]}`} />
                      <Fact label="Urgency" value={triageDraft.urgency} />
                      <Fact label="Department" value={triageDraft.department} />
                      <Fact label="SLA" value={`${triageDraft.sla_hours} hours`} />
                    </div>
                    <p className="mt-space-sm font-body-sm text-on-surface-variant">{triageDraft.reason}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-surface-container-low border border-outline-variant p-space-md font-body-sm text-on-surface-variant">
                  Type at least five characters to see a triage preview.
                </div>
              )}
              <div className="flex flex-col gap-space-sm">
                <SectionHeader title="Community intelligence" subtitle="What residents are already reporting" />
                <div className="grid grid-cols-1 gap-space-sm">
                  {(feed.trending_issues || []).slice(0, 4).map((issue) => (
                    <div key={issue.id} className="flex items-start gap-space-sm rounded-lg border border-outline-variant p-space-sm">
                      <span style={SeverityPalette(issue.severity)} className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                        {issue.severity}
                      </span>
                      <div className="min-w-0">
                        <div className="font-title-md text-on-surface">{issue.title}</div>
                        <div className="font-body-sm text-on-surface-variant">{issue.support_count || 0} backed • {issue.comment_count || 0} comments • {issue.status}</div>
                      </div>
                    </div>
                  ))}
                  {(feed.trending_issues || []).length === 0 && <p className="font-body-sm text-on-surface-variant">No community activity yet.</p>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "queue" && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-space-md p-space-lg">
            <SectionHeader title="Operations queue" subtitle="Verified issues, routing decisions, SLA countdown, and evidence-based resolution" right={
              <div className="flex flex-wrap gap-space-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-sm font-semibold bg-error-container text-on-error-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-error animate-ping" /> {stats?.overdue || 0} overdue
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-sm font-semibold bg-surface-container text-on-surface-variant">
                  {visibleIssues.length} visible
                </span>
              </div>
            } />
            <div className="flex flex-wrap gap-space-sm">
              <select className={inputClass() + " h-9 w-[150px]"} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="open">Open issues</option>
                <option value="all">All statuses</option>
                <option value="resolved">Resolved</option>
              </select>
              <select className={inputClass() + " h-9 w-[150px]"} value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                <option value="">All categories</option>
                {CATEGORY_META.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
              <select className={inputClass() + " h-9 w-[140px]"} value={filters.minSeverity} onChange={(e) => setFilters((p) => ({ ...p, minSeverity: e.target.value }))}>
                <option value="0">Any severity</option>
                <option value="3">Moderate+</option>
                <option value="4">High+</option>
                <option value="5">Critical only</option>
              </select>
            </div>
            <div className="flex flex-col gap-space-sm">
              {visibleIssues.map((issue) => (
                <div key={issue.id} className={`rounded-xl p-space-md shadow-sm flex flex-col gap-space-md transition-all ${issue.is_overdue ? "border border-error bg-error-container/40" : "border border-outline-variant bg-surface-container-lowest hover:shadow-md"}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
                    <div className="flex items-start gap-space-md min-w-0">
                      <div style={SeverityPalette(issue.severity)} className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                        {issue.severity}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="font-tabular-sm text-on-surface-variant">{issue.id}</span>
                          <StatusBadge status={issue.status} />
                          {issue.is_overdue && <Badge tone="bg-error-container text-on-error-container border-error-container">Overdue {issue.sla_hours}h SLA</Badge>}
                        </div>
                        <h3 className="mt-1 font-title-md text-on-surface">{issue.title}</h3>
                        <p className="font-body-sm text-on-surface-variant">{issue.description}</p>
                        <div className="mt-space-xs flex flex-wrap gap-space-sm font-body-sm text-on-surface-variant">
                          <span>{issue.department}</span><span>•</span><span>{issue.address || "Unknown ward"}</span><span>•</span><span>{issue.reported_count || 1} reports</span><span>•</span><span>{Math.round((issue.ai_confidence || 0.8) * 100)}% confidence</span><span>•</span><span>{issue.support_count || 0} residents back this</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <select className={inputClass() + " h-9 w-[150px]"} value={issue.status} disabled={queueBusy === issue.id} onChange={(e) => runStatusUpdate(issue, e.target.value)}>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <SmallButton disabled={queueBusy === issue.id || issue.status !== "in_progress"} onClick={() => runStatusUpdate(issue, "resolved")}>Resolve</SmallButton>
                    </div>
                  </div>
                </div>
              ))}
              {visibleIssues.length === 0 && <div className="rounded-xl bg-surface-container-low p-space-xl text-center font-body-md text-on-surface-variant">No open issues match the current filters.</div>}
            </div>
          </div>
        </Card>
      )}

      {tab === "impact" && (
        <div className="flex flex-col gap-space-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter-lg">
            <MetricCard icon="data_usage" label="Total reports" value={stats?.total || 0} hint="All issue statuses" />
            <MetricCard icon="assignment_late" label="Unresolved" value={stats?.open || 0} hint="Under municipal review" />
            <MetricCard icon="task_alt" label="Resolved" value={stats?.resolved || 0} hint="Citizen verified" />
            <MetricCard icon="timer" label="Overdue" value={stats?.overdue || 0} hint="SLA breach risk" emphasis={(stats?.overdue || 0) > 0 ? "danger" : "normal"} />
            <MetricCard icon="schedule" label="Average resolution" value={`${stats?.avg_resolution_hours || 0}h`} hint="From report to closure" />
            <MetricCard icon="star" label="Citizen score" value={stats?.avg_rating || 0} hint="Out of 5" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter-lg">
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="By category" subtitle="Issue volume across civic services" />
              <div className="flex flex-col gap-space-sm">
                {Object.entries(stats?.by_category || {}).map(([name, count]) => {
                  const max = Math.max(1, ...Object.values(stats?.by_category || {}));
                  return (
                    <div key={name} className="flex items-center gap-space-sm">
                      <span className="w-24 font-label-md text-on-surface-variant">{name}</span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-surface-container-low">
                        <div className="h-full rounded bg-secondary" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right font-tabular-sm text-on-surface">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="Severity distribution" subtitle="Priority load across all incidents" />
              <div className="flex flex-col gap-space-sm">
                {Object.entries(stats?.by_severity || {}).sort((a, b) => Number(b[0]) - Number(a[0])).map(([name, count]) => {
                  const max = Math.max(1, ...Object.values(stats?.by_severity || {}));
                  return (
                    <div key={name} className="flex items-center gap-space-sm">
                      <span className="w-20 font-label-md text-on-surface-variant">Level {name}</span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-surface-container-low">
                        <div className="h-full rounded" style={{ width: `${(count / max) * 100}%`, background: { 1: "#16a34a", 2: "#0259c5", 3: "#d97706", 4: "#f97316", 5: "#ba1a1a" }[name] || "#0259c5" }} />
                      </div>
                      <span className="w-10 text-right font-tabular-sm text-on-surface">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          <Card className="p-space-lg flex flex-col gap-space-md">
            <SectionHeader title="Recent daily volume" subtitle="New reports entering the system" />
            <div className="grid grid-cols-7 gap-space-sm items-end h-40">
              {(stats?.recent_daily || []).map((d) => {
                const max = Math.max(1, ...(stats?.recent_daily || []).map((i) => i.count));
                return (
                  <div key={d.date} className="flex flex-col items-center gap-space-xs">
                    <div className="w-full max-w-[52px] rounded bg-secondary transition-all" style={{ height: `${Math.max(6, (d.count / max) * 128)}px` }} />
                    <span className="font-tabular-sm text-on-surface-variant text-[10px]">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "community" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="Community feed" subtitle="Residents supporting, validating, and discussing civic issues" right={
                <div className="flex flex-wrap gap-space-sm">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-sm font-semibold bg-secondary-fixed text-on-secondary-fixed">Live crowd signal</span>
                  <SmallButton tone="outline" onClick={loadAll}>Refresh</SmallButton>
                </div>
              } />
              <div className="flex flex-col gap-space-sm">
                {(feed.trending_issues || []).map((issue) => {
                  const local = issues.find((i) => i.id === issue.id) || {};
                  const strength = Math.min(100, (issue.support_count || 0) * 12 + (issue.comment_count || 0) * 20);
                  return (
                    <div key={issue.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-space-md">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-sm">
                        <div className="min-w-0">
                          <div className="font-title-md text-on-surface">{issue.title}</div>
                          <div className="font-body-sm text-on-surface-variant">
                            {(issue.category || local.category || "civic")} • {(issue.support_count || 0)} backed • {(issue.comment_count || 0)} comments • {issue.status || local.status}
                          </div>
                        </div>
                        <SmallButton tone="ghost" onClick={() => { setSelectedId(issue.id); setTab("live-map"); }}>
                          <span className="material-symbols-outlined text-[18px]">map</span>
                          View
                        </SmallButton>
                      </div>
                      <div className="mt-space-sm h-2 overflow-hidden rounded bg-surface-container-low">
                        <div className="h-full rounded bg-secondary transition-all" style={{ width: `${strength}%` }} />
                      </div>
                      <div className="mt-space-sm flex flex-wrap gap-space-sm">
                        <SmallButton tone="ghost" busy={supportBusy === issue.id} onClick={() => handleSupport(local || issue)}>
                          <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                          Support {issue.support_count || 0}
                        </SmallButton>
                        <SmallButton tone="ghost" onClick={() => { setSelectedId(issue.id); setTab("live-map"); }}>
                          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                          Comment
                        </SmallButton>
                      </div>
                    </div>
                  );
                })}
                {(feed.trending_issues || []).length === 0 && <div className="rounded-xl bg-surface-container-low p-space-xl text-center font-body-sm text-on-surface-variant">No community activity yet. Support or comment on an issue to start the civic feed.</div>}
              </div>
            </Card>
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="Recent resident comments" subtitle="Context, safety notes, and field observations" />
              <div className="flex flex-col gap-space-sm">
                {(feed.recent_comments || []).map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-surface-container-low p-space-sm">
                    <div className="flex items-center justify-between gap-space-sm">
                      <span className="font-title-md text-on-surface">{comment.author}</span>
                      <span className="font-tabular-sm text-on-surface-variant">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="font-body-md text-on-surface mt-1">{comment.body}</p>
                    <p className="font-body-sm text-on-surface-variant mt-1">{comment.issue_title}</p>
                  </div>
                ))}
                {(feed.recent_comments || []).length === 0 && <p className="font-body-sm text-on-surface-variant">No comments yet.</p>}
              </div>
            </Card>
          </div>
          <aside className="xl:col-span-4 flex flex-col gap-space-lg">
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="Community metrics" subtitle="Resident participation and crowd validation" />
              <div className="grid grid-cols-1 gap-space-sm">
                <MetricCard icon="groups" label="Resident issues" value={feed.stats?.issues || 0} hint="Backed or discussed" />
                <MetricCard icon="thumb_up" label="Supports" value={feed.stats?.supports || 0} hint="Community confirmations" />
                <MetricCard icon="chat_bubble" label="Comments" value={feed.stats?.comments || 0} hint="Public context" />
              </div>
            </Card>
            <Card className="p-space-lg flex flex-col gap-space-md">
              <SectionHeader title="How the feed works" subtitle="Non-toxic public civic signal" />
              <ul className="flex flex-col gap-space-sm font-body-md text-on-surface-variant">
                <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">thumb_up</span>Residents confirm only issues visible in their immediate area.</li>
                <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">chat_bubble</span>Comments add safety context, not just opinions.</li>
                <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">visibility</span>Comments can be read by all stakeholders for transparent resolution.</li>
              </ul>
            </Card>
          </aside>
        </div>
      )}

      {tab === "alerts" && (
        <div className="flex flex-col gap-space-lg">
          <SectionHeader title="Alerts and SLA triage" subtitle="Urgent incidents, time-critical breaches, and resolution signals" />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg">
            <div className="xl:col-span-8 flex flex-col gap-space-sm">
              {(issues || []).filter((issue) => issue.severity >= 4 || issue.is_overdue).map((issue) => (
                <div key={issue.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-sm">
                    <div>
                      <div className="flex items-center gap-space-sm">
                        <StatusBadge status={issue.status} />
                        <Badge tone="bg-error-container text-on-error-container border-error-container">{issue.severity >= 5 ? "Critical" : "Urgent"}</Badge>
                      </div>
                      <h3 className="font-title-md text-on-surface mt-1">{issue.title}</h3>
                      <p className="font-body-sm text-on-surface-variant">{issue.department} • {issue.address || "Unknown ward"} • SLA {issue.sla_hours}h
                      </p>
                    </div>
                    <SmallButton tone="outline" onClick={() => { setSelectedId(issue.id); setTab("live-map"); }}>
                      <span className="material-symbols-outlined text-[18px]">map</span>
                      Inspect
                    </SmallButton>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-on-surface">
                    {issue.ai_reason || "Issue remains under operational review."}
                  </div>
                </div>
              ))}
              {issues.filter((issue) => issue.severity >= 4 || issue.is_overdue).length === 0 && (
                <div className="rounded-xl bg-surface-container-low p-space-xl text-center font-body-sm text-on-surface-variant">
                  No active alerts.
                </div>
              )}
            </div>
            <aside className="xl:col-span-4 flex flex-col gap-space-lg">
              <Card className="p-space-lg flex flex-col gap-space-md">
                <SectionHeader title="Alert metrics" subtitle="Noise-free critical signal" />
                <MetricCard icon="emergency_home" label="Critical / urgent" value={issues.filter((i) => i.severity >= 4).length} hint="Severity 4+" />
                <MetricCard icon="timer_off" label="Overdue" value={stats?.overdue || 0} hint="SLA breaches" emphasis={(stats?.overdue || 0) > 0 ? "danger" : "normal"} />
              </Card>
              <Card className="p-space-lg flex flex-col gap-space-md">
                <SectionHeader title="Alert policy" subtitle="What becomes an alert" />
                <ul className="flex flex-col gap-space-sm font-body-md text-on-surface-variant">
                  <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-error">error</span> Life-safety or critical infrastructure incidents.</li>
                  <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-tertiary">schedule</span> SLA threshold approaching or exceeded.</li>
                  <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">groups</span> Community confirmation crossing support threshold.</li>
                </ul>
              </Card>
            </aside>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg">
          <Card className="xl:col-span-4 p-space-lg flex flex-col gap-space-md">
            <SectionHeader title="Profile and role" subtitle="Demo identity and operational preferences" />
            <p className="font-body-md text-on-surface-variant">
              Current mode: <span className="font-semibold text-on-surface">{role === "admin" ? "Officer / Operations" : "Citizen Resident"}</span>
            </p>
            <div className="flex gap-space-sm">
              <SmallButton tone={role === "citizen" ? "secondary" : "ghost"} onClick={() => changeRole("citizen")}>
                <span className="material-symbols-outlined text-[18px]">person</span>
                Citizen
              </SmallButton>
              <SmallButton tone={role === "admin" ? "municipal" : "ghost"} onClick={() => changeRole("admin")}>
                <span className="material-symbols-outlined text-[18px]">shield</span>
                Officer
              </SmallButton>
            </div>
          </Card>
          <Card className="xl:col-span-8 p-space-lg flex flex-col gap-space-md">
            <SectionHeader title="Settings" subtitle="Notification, accessibility, and municipal command preferences" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <div className="font-title-md text-on-surface">Notification edge cases</div>
                <p className="font-body-sm text-on-surface-variant mt-1">SLA warnings, dispatch assignment updates, resolution evidence, and critical alerts.</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <div className="font-title-md text-on-surface">Accessibility safeguards</div>
                <p className="font-body-sm text-on-surface-variant mt-1">High contrast status patterns, reduced motion, keyboard navigation, tabular numeric values, and screen reader fallback.</p>
              </div>
            </div>
            <ul className="flex flex-col gap-space-sm font-body-md text-on-surface-variant">
              <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">schedule</span> SLA escalation intervention now active.</li>
              <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">groups</span> Ward 112 verified neighbor network enabled.</li>
              <li className="flex gap-space-sm"><span className="material-symbols-outlined text-[18px] text-secondary">visibility</span> Public transparency feed enabled for resolved tickets.</li>
            </ul>
          </Card>
        </div>
      )}
    </Shell>
  );
}
function ButtonPill({ label, active = false, selected = false }) {
  return (
    <button className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${active || selected ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"}`}>
      {label}
    </button>
  );
}

function Inspector({ issue, comments, role, running, onStatus, onSupport, supportBusy, commentDraft, onCommentChange, onComment, commentBusy }) {
  if (!issue) {
    return <Card className="p-space-lg"><div className="rounded-xl bg-surface-container-low p-space-xl text-center font-body-sm text-on-surface-variant">No issue selected.</div></Card>;
  }
  return (
    <Card className="sticky top-24 p-space-lg flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <span className="font-tabular-sm text-on-surface-variant">{issue.id}</span>
        <StatusBadge status={issue.status} />
      </div>
      <h3 className="font-headline-sm text-on-surface leading-tight">{issue.title}</h3>
      <div className="flex items-start gap-space-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">location_on</span>
        <span className="font-body-sm">{issue.address || `${issue.latitude}, ${issue.longitude}`}</span>
      </div>
      <div className="rounded-xl bg-error-container/40 border border-error-container p-space-md flex justify-between gap-space-md">
        <div>
          <div className="font-label-sm font-semibold uppercase text-on-error-container tracking-wider">SLA Window</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-headline-lg text-headline-lg font-bold text-error tracking-tight">{issue.sla_hours}h</span>
            <span className="font-label-sm text-on-error-container">deadline</span>
          </div>
          <div className="font-body-sm text-on-error-container mt-1">{issue.department} • {issue.is_overdue ? "Expired" : "Active"}</div>
        </div>
        <div className="relative h-14 w-14 flex items-center justify-center">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <path className="text-error-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <path className="text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="65, 100" strokeLinecap="round" strokeWidth="3.5" />
          </svg>
          <span className="absolute text-[10px] font-bold text-on-error-container">
            {Math.min(99, issue.severity * 18)}%
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-surface-container p-space-md">
        <div className="font-label-sm uppercase font-semibold text-on-surface-variant mb-1">AI triage audit</div>
        <p className="font-body-sm text-on-surface-variant">{issue.ai_reason || "Awaiting triage explanation."}</p>
        <div className="mt-space-sm grid grid-cols-2 gap-space-sm">
          <Fact label="Category" value={issue.category || "Unknown"} />
          <Fact label="Severity" value={`${issue.severity}/5`} />
          <Fact label="Urgency" value={issue.urgency || "Routine"} />
          <Fact label="Confidence" value={`${Math.round((issue.ai_confidence || 0.8) * 100)}%`} />
        </div>
      </div>
      <div className="rounded-lg bg-surface-container-low p-space-md">
        <div className="font-label-sm uppercase font-semibold text-on-surface-variant mb-1">Evidence and details</div>
        <p className="font-body-sm text-on-surface-variant mb-2">{issue.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-on-surface-variant">{issue.reported_count || 1} reports linked • {issue.support_count || 0} resident validations</span>
          <span className="font-tabular-sm text-secondary font-semibold">{issue.sla_deadline?.slice(0, 19).replace("T", " ")}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-space-sm">
        <SmallButton tone="ghost" onClick={() => onSupport(issue)} busy={supportBusy}>
          <span className="material-symbols-outlined text-[18px]">thumb_up</span>
          {supportBusy ? "Working..." : `Support ${issue.support_count || 0}`}
        </SmallButton>
        {role === "admin" && (
          <>
            <SmallButton tone="ghost" busy={running} onClick={() => onStatus(issue, "verified")}>Verify</SmallButton>
            <SmallButton tone="ghost" busy={running} onClick={() => onStatus(issue, "assigned")}>Assign</SmallButton>
            <SmallButton tone="ghost" busy={running} onClick={() => onStatus(issue, "in_progress")}>Start</SmallButton>
            <SmallButton tone="urgent" busy={running} onClick={() => onStatus(issue, "resolved")}>Resolve</SmallButton>
          </>
        )}
      </div>
      <div className="flex flex-col gap-space-sm">
        <h3 className="font-headline-sm text-on-surface">Community discussion</h3>
        <textarea className={inputClass() + " min-h-[100px] py-space-sm"} placeholder="Add context, safety concern, or confirmation" value={commentDraft} onChange={(e) => onCommentChange(e.target.value)} />
        <SmallButton tone="ghost" busy={commentBusy} onClick={() => onComment(commentDraft)}>
          <span className="material-symbols-outlined text-[18px]">send</span>
          Post comment
        </SmallButton>
        <div className="flex max-h-52 flex-col gap-space-sm overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-surface-container-low p-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-title-md text-on-surface">{comment.author}</span>
                <span className="font-tabular-sm text-on-surface-variant">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <p className="font-body-md text-on-surface mt-1">{comment.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="font-body-sm text-on-surface-variant">No comments yet.</p>}
        </div>
      </div>
    </Card>
  );
}
