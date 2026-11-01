import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Activity, CheckCircle2, Filter, Info, MapPin, Plus, RefreshCw, Shield, Star, Wrench } from "lucide-react";
import { api, getSavedRole, saveRole } from "./api";

const STATUS_LABELS = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const STATUS_ORDER = ["reported", "verified", "assigned", "in_progress", "resolved"];
const SEVERITY_LABELS = ["", "Very low", "Low", "Moderate", "High", "Critical"];

function statusBadge(status) {
  return `badge badge-${status}`;
}

function iconFor(severity, status) {
  const hot = status === "resolved" || status === "closed" ? "#22c55e" : severity >= 4 ? "#ef4444" : severity === 3 ? "#f59e0b" : "#38bdf8";
  const shape = `<span style="display:inline-flex;width:22px;height:22px;border-radius:999px;background:${hot};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#061018">${severity}</span>`;
  return L.divIcon({ className: "pulse-marker", html: shape, iconSize: [22, 22], iconAnchor: [11, 11] });
}

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

function severityColor(severity) {
  if (severity >= 5) return "#ef4444";
  if (severity === 4) return "#f97316";
  if (severity === 3) return "#f59e0b";
  if (severity === 2) return "#38bdf8";
  return "#22c55e";
}

export default function App() {
  const [role, setRole] = useState(getSavedRole());
  const [tab, setTab] = useState("report");
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status: "open", category: "", severity: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState("checking");

  const [formData, setFormData] = useState({
    description: "",
    reporter_name: "Demo resident",
    latitude: 28.6139,
    longitude: 77.209,
    address: "Central Market Ward"
  });

  useEffect(() => {
    saveRole(role);
  }, [role]);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status === "open") params.status = "reported,verified,assigned,in_progress,reopened";
      if (filters.status && filters.status !== "all" && filters.status !== "open") params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.minSeverity = filters.severity;
      const data = await api.listIssues(params);
      setIssues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.getStats());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await api.getCategories());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadIssues();
    loadStats();
    loadCategories();
    api.health().then(() => setHealth("online")).catch(() => setHealth("offline"));
  }, [loadIssues, loadStats, loadCategories]);

  const issueMapCenter = useMemo(() => {
    if (!issues.length) return [28.6139, 77.209];
    const lat = issues.reduce((sum, issue) => sum + issue.latitude, 0) / issues.length;
    const lon = issues.reduce((sum, issue) => sum + issue.longitude, 0) / issues.length;
    return [lat, lon];
  }, [issues]);

  async function submitIssue(event) {
    event.preventDefault();
    setError("");
    try {
      const created = await api.createIssue({
        description: formData.description,
        address: formData.address,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        reporter_name: formData.reporter_name
      });
      setFormData({ ...formData, description: "" });
      await loadIssues();
      await loadStats();
      setSelected(created);
      setTab("map");
    } catch (err) {
      setError(err.message);
    }
  }

  async function locateMe() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setFormData((prev) => ({
        ...prev,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      })),
      (err) => setError(err.message)
    );
  }

  async function changeStatus(issue, status, note, evidenceUrl) {
    try {
      await api.updateStatus(issue.id, { status, note, evidence_url: evidenceUrl, crew: "Field crew" });
      await loadIssues();
      await loadStats();
      if (selected?.id === issue.id) {
        setSelected(await api.getIssue(issue.id));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitRating(issue, score, comment) {
    try {
      await api.rateIssue(issue.id, { score, comment });
      await loadStats();
    } catch (err) {
      setError(err.message);
    }
  }

  const openIssues = issues.filter((issue) => !["resolved", "closed", "duplicate"].includes(issue.status));
  const metrics = stats || {};

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Activity size={20} /></div>
          <div>
            <h1>Civic Pulse AI</h1>
            <p>Report. Triage. Route. Resolve. Publicly.</p>
          </div>
        </div>

        <div className="top-actions">
          <span className={`health health-${health}`}>{health}</span>
          <div className="role-switch">
            <button className={role === "citizen" ? "active" : ""} onClick={() => setRole("citizen")}><Plus size={16} /> Citizen</button>
            <button className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><Shield size={16} /> Admin</button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "report" ? "active" : ""} onClick={() => setTab("report")}><Plus size={16} /> Report</button>
        <button className={tab === "map" ? "active" : ""} onClick={() => setTab("map")}><MapPin size={16} /> Live map</button>
        <button className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}><Wrench size={16} /> Department queue</button>
        <button className={tab === "impact" ? "active" : ""} onClick={() => setTab("impact")}><Activity size={16} /> Impact</button>
      </nav>

      {error ? <div className="error-banner">{error}</div> : null}

      {tab === "report" && (
        <section className="panel report-grid">
          <form className="card form-card" onSubmit={submitIssue}>
            <h2>Report a civic issue</h2>
            <p>Describe what you saw. AI triages, detects duplicates, and routes it to the responsible department.</p>

            <label>Description
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Example: Large pothole near school crossing. Two-wheelers are swerving around it. Very dangerous after rain."
                required
              />
            </label>

            <div className="two-up">
              <label>Your name
                <input value={formData.reporter_name} onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })} />
              </label>
              <label>Ward / address
                <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </label>
            </div>

            <div className="two-up">
              <label>Latitude
                <input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
              </label>
              <label>Longitude
                <input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
              </label>
            </div>

            <button type="button" className="ghost" onClick={locateMe}><MapPin size={16} /> Use my location</button>
            <button type="submit" className="primary"><Plus size={16} /> Create issue</button>
          </form>

          <div className="card info-card">
            <h3>How triage works</h3>
            <ul>
              <li>Keyword and risk rules classify the issue.</li>
              <li>Severity rises for safety terms like school, hospital, open manhole, or flood.</li>
              <li>Nearby same-type reports are collapsed as possible duplicates.</li>
              <li>Each issue gets an SLA deadline and department route.</li>
            </ul>

            <h3>Fast demo path</h3>
            <ol>
              <li>Report “pothole near school crossing... dangerous after rain”.</li>
              <li>Watch the AI assign Roads &amp; Public Works.</li>
              <li>Open Live map to show clustering.</li>
              <li>Switch to Admin to advance status.</li>
              <li>Resolve with evidence and public rating.</li>
            </ol>
          </div>
        </section>
      )}

      {tab === "map" && (
        <section className="panel">
          <div className="toolbar">
            <div className="toolbar-left">
              <Filter size={16} />
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="open">Open issues</option>
                <option value="all">All statuses</option>
                <option value="resolved">Resolved</option>
                <option value="assigned">Assigned</option>
              </select>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select>
              <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: Number(e.target.value) })}>
                <option value={0}>Any severity</option>
                <option value={3}>Moderate+</option>
                <option value={4}>High+</option>
                <option value={5}>Critical only</option>
              </select>
            </div>
            <button className="ghost" onClick={loadIssues}><RefreshCw size={16} /> Refresh</button>
          </div>

          <div className="map-wrap card">
            <MapContainer center={issueMapCenter} zoom={12} scrollWheelZoom style={{ height: "70vh", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {issues.map((issue) => (
                <Marker
                  key={issue.id}
                  position={[issue.latitude, issue.longitude]}
                  icon={iconFor(issue.severity, issue.status)}
                  eventHandlers={{ click: () => setSelected(issue) }}
                >
                  <Popup>
                    <div className="popup">
                      <strong>{issue.title}</strong>
                      <span className={statusBadge(issue.status)}>{STATUS_LABELS[issue.status] || issue.status}</span>
                      <p>{issue.description}</p>
                      <small>{issue.department} · severity {issue.severity}/5 · {issue.is_overdue ? "OVERDUE" : `SLA ${issue.sla_hours}h`}</small>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <aside className="issue-side card inset">
              {selected ? (
                <>
                  <h3>{selected.title}</h3>
                  <div className={statusBadge(selected.status)}>{STATUS_LABELS[selected.status]}</div>
                  <p>{selected.description}</p>
                  <dl className="meta">
                    <dt>Category</dt><dd>{categories.find((c) => c.slug === selected.category)?.name || selected.category}</dd>
                    <dt>Severity</dt><dd>{selected.severity}/5 · {SEVERITY_LABELS[selected.severity]}</dd>
                    <dt>Urgency</dt><dd>{selected.urgency}</dd>
                    <dt>Department</dt><dd>{selected.department}</dd>
                    <dt>Reported</dt><dd>{timeAgo(selected.created_at)} by {selected.reporter_name}</dd>
                    <dt>SLA</dt><dd>{selected.sla_hours} hours · {selected.is_overdue ? "overdue" : "on track"}</dd>
                    <dt>AI confidence</dt><dd>{Math.round(selected.ai_confidence * 100)}%</dd>
                  </dl>
                  <p className="ai-reason">{selected.ai_reason}</p>
                  {selected.duplicate_of ? <p className="duplicate">Possible duplicate of {selected.duplicate_of}</p> : null}
                  <div className="rating-row">
                    <button onClick={() => submitRating(selected, 5, "Resolved well")}><Star size={14} /> Rate 5</button>
                    <button onClick={() => submitRating(selected, 3, "Needs follow-up")}><Star size={14} /> Rate 3</button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <Info size={24} />
                  <p>Select a marker to inspect triage, routing, SLA, and resolution history.</p>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      {tab === "queue" && (
        <section className="panel">
          {!role.match(/admin/) ? (
            <div className="card">
              <h2>Department queue is available in Admin view</h2>
              <p>Switch to Admin in the top bar to route and resolve issues.</p>
            </div>
          ) : (
            <div className="queue">
              <div className="toolbar">
                <h2>Department queue</h2>
                <button className="danger ghost" onClick={() => api.resetSeed({ clear: true, count: 100 }).then(() => { loadIssues(); loadStats(); })}>Reset demo data</button>
              </div>

              <div className="card table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={issue.id}>
                        <td>
                          <strong>{issue.title}</strong>
                          <div className="muted">{issue.id} · {issue.reporter_name}</div>
                        </td>
                        <td>{categories.find((c) => c.slug === issue.category)?.name || issue.category}</td>
                        <td><span className="severity-dot" style={{ background: severityColor(issue.severity) }} /> {issue.severity}/5</td>
                        <td>{issue.department}</td>
                        <td><span className={statusBadge(issue.status)}>{STATUS_LABELS[issue.status]}</span></td>
                        <td className="actions">
                          {STATUS_ORDER.slice(1).map((status) => (
                            <button
                              key={status}
                              className="tiny"
                              onClick={() => changeStatus(issue, status, `Moved to ${STATUS_LABELS[status]}`)}
                              disabled={issue.status === status}
                            >{STATUS_LABELS[status]}</button>
                          ))}
                          {issue.status === "in_progress" ? (
                            <button
                              className="tiny primary-tiny"
                              onClick={() => changeStatus(issue, "resolved", "Crew completed repair", "https://example.com/evidence")}
                            >Resolve</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "impact" && (
        <section className="panel">
          <div className="stats-grid">
            <div className="stat card"><span>Total issues</span><strong>{metrics.total || 0}</strong></div>
            <div className="stat card"><span>Open</span><strong>{metrics.open || 0}</strong></div>
            <div className="stat card"><span>Resolved</span><strong>{metrics.resolved || 0}</strong></div>
            <div className="stat card"><span>Overdue</span><strong>{metrics.overdue || 0}</strong></div>
            <div className="stat card"><span>Avg. resolution</span><strong>{metrics.avg_resolution_hours || "—"} h</strong></div>
            <div className="stat card"><span>Citizen rating</span><strong>{metrics.avg_rating || "—"} / 5</strong></div>
          </div>

          <div className="charts">
            <div className="card chart">
              <h3>Issues by category</h3>
              <MiniBarChart data={Object.entries(metrics.by_category || {})} colorMap={categories.reduce((acc, c) => (acc[c.slug] = c.color || "#38bdf8", acc), {})} />
            </div>
            <div className="card chart">
              <h3>Severity mix</h3>
              <MiniBarChart data={Object.entries(metrics.by_severity || {})} colorMap={{ 5: "#ef4444", 4: "#f97316", 3: "#f59e0b", 2: "#38bdf8", 1: "#22c55e" }} />
            </div>
          </div>

          <div className="card footer-note">
            <CheckCircle2 size={20} /> Civic Pulse AI tracks the full public-service lifecycle: intake, AI triage, routing, SLA, resolution evidence, and citizen feedback.
          </div>
        </section>
      )}
    </div>
  );
}

function MiniBarChart({ data, colorMap }) {
  const max = Math.max(1, ...data.map(([, value]) => value));
  return (
    <div className="bars">
      {data.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span>{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(value / max) * 100}%`, background: colorMap[label] || "#38bdf8" }} />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
      {data.length === 0 ? <p className="muted">No data yet.</p> : null}
    </div>
  );
}
