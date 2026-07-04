import { useEffect, useMemo, useState } from "react";

const branches = [
  "Dhaka",
  "Sylhet",
  "Rajshahi",
  "Chattogram",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Gazipur",
];

const users = [
  { username: "ceo", password: "ceo123", role: "ceo", name: "Chief Executive", branch: "All Branches" },
  { username: "dhaka.manager", password: "12345", role: "manager", name: "Dhaka Manager", branch: "Dhaka" },
  { username: "sylhet.manager", password: "12345", role: "manager", name: "Sylhet Manager", branch: "Sylhet" },
  { username: "rajshahi.manager", password: "12345", role: "manager", name: "Rajshahi Manager", branch: "Rajshahi" },
  {
    username: "chattogram.manager",
    password: "12345",
    role: "manager",
    name: "Chattogram Manager",
    branch: "Chattogram",
  },
  { username: "khulna.manager", password: "12345", role: "manager", name: "Khulna Manager", branch: "Khulna" },
  { username: "barishal.manager", password: "12345", role: "manager", name: "Barishal Manager", branch: "Barishal" },
  { username: "rangpur.manager", password: "12345", role: "manager", name: "Rangpur Manager", branch: "Rangpur" },
  {
    username: "mymensingh.manager",
    password: "12345",
    role: "manager",
    name: "Mymensingh Manager",
    branch: "Mymensingh",
  },
  { username: "cumilla.manager", password: "12345", role: "manager", name: "Cumilla Manager", branch: "Cumilla" },
  { username: "gazipur.manager", password: "12345", role: "manager", name: "Gazipur Manager", branch: "Gazipur" },
];

const initialWeather = ["Hot", "Rainy", "Cloudy", "Cold", "Normal"];
const customerLogs = [
  "Size Not Available",
  "Price Too High",
  "Product Not Preferred",
  "Just Visiting",
];

const emptyForm = {
  timestamp: "",
  weather: "",
  customerLog: "",
  totalFootfall: "",
  customerCount: "",
};

const reminderConfig = {
  intervalMs: 2 * 60 * 1000,
  warningMs: 90 * 1000,
};

function getSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentDatetimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function calculateStats(items) {
  const footfall = items.reduce((sum, item) => sum + Number(item.totalFootfall), 0);
  const served = items.reduce((sum, item) => sum + Number(item.customerCount), 0);
  const serviceRate = footfall ? Math.round((served / footfall) * 100) : 0;

  return { footfall, served, serviceRate, records: items.length };
}

function getRecordServiceRate(record) {
  const footfall = Number(record.totalFootfall) || 0;
  const served = Number(record.customerCount) || 0;
  return footfall ? Math.round((served / footfall) * 100) : 0;
}

function normalizeRecord(record) {
  return {
    ...record,
    branch: record.branch || record.shopName || "Dhaka",
    createdBy: record.createdBy || "legacy",
  };
}

function buildBranchSummary(items) {
  return branches.map((branch) => {
    const branchRecords = items.filter((record) => record.branch === branch);
    return { branch, ...calculateStats(branchRecords) };
  });
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => getSavedData("retail-current-user", null));
  const [loginForm, setLoginForm] = useState({ username: "", password: "", branch: "" });
  const [loginMode, setLoginMode] = useState("manager");
  const [loginError, setLoginError] = useState("");
  const [clock, setClock] = useState(new Date());
  const [form, setForm] = useState({ ...emptyForm, timestamp: getCurrentDatetimeValue() });
  const [records, setRecords] = useState(() =>
    getSavedData("retail-records", []).map((record) => normalizeRecord(record))
  );
  const [weatherOptions, setWeatherOptions] = useState(() =>
    getSavedData("retail-weather-options", initialWeather)
  );
  const [newWeather, setNewWeather] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [reminderKey, setReminderKey] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("retail-current-user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("retail-records", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem("retail-weather-options", JSON.stringify(weatherOptions));
  }, [weatherOptions]);

  const visibleRecords = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.role === "ceo"
      ? records
      : records.filter((record) => record.branch === currentUser.branch);
  }, [currentUser, records]);

  const filteredRecords = useMemo(() => {
    return visibleRecords.filter((record) => {
      const query = search.trim().toLowerCase();
      const matchesBranch =
        !currentUser ||
        currentUser.role !== "ceo" ||
        branchFilter === "All" ||
        record.branch === branchFilter;
      const matchesSearch =
        !query ||
        record.branch.toLowerCase().includes(query) ||
        record.customerLog.toLowerCase().includes(query) ||
        record.weather.toLowerCase().includes(query);

      return matchesBranch && matchesSearch;
    });
  }, [visibleRecords, search, branchFilter, currentUser]);

  const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);
  const branchSummary = useMemo(() => buildBranchSummary(records), [records]);
  const topBranch = useMemo(() => {
    return [...branchSummary].sort((a, b) => b.footfall - a.footfall)[0];
  }, [branchSummary]);
  const managerTimer = useMemo(() => {
    if (!currentUser || currentUser.role !== "manager") {
      return { progress: 0, isWarning: false, isDue: false, latestRecord: null };
    }

    const latestRecord = records
      .filter((record) => record.branch === currentUser.branch)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!latestRecord?.createdAt) {
      return { progress: 0, isWarning: false, isDue: false, latestRecord: null };
    }

    const elapsed = Math.max(0, clock.getTime() - new Date(latestRecord.createdAt).getTime());
    const progress = Math.min(1, elapsed / reminderConfig.intervalMs);
    const isWarning = elapsed >= reminderConfig.warningMs && elapsed < reminderConfig.intervalMs;
    const isDue = elapsed >= reminderConfig.intervalMs;

    return { progress, isWarning, isDue, latestRecord };
  }, [clock, currentUser, records]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "manager" || !managerTimer.latestRecord) return;

    const nextReminderKey = `${managerTimer.latestRecord.id}-${managerTimer.isDue ? "due" : "warning"}`;

    if ((managerTimer.isWarning || managerTimer.isDue) && reminderKey !== nextReminderKey) {
      setNotice(
        managerTimer.isDue
          ? "Your 2 minute test input window is complete. Please submit the next branch update."
          : "Reminder: 30 seconds left to complete the next branch input."
      );
      setReminderKey(nextReminderKey);
    }
  }, [currentUser, managerTimer, reminderKey]);

  function handleLogin(event) {
    event.preventDefault();
    const username = loginForm.username.trim().toLowerCase();
    const password = loginForm.password.trim();
    const selectedBranch = loginForm.branch;
    const matchedUser = users.find(
      (user) => user.username === username && user.password === password && user.role === loginMode
    );

    if (!matchedUser) {
      setLoginError("Invalid username, password, or account type.");
      return;
    }

    if (matchedUser.role === "manager" && matchedUser.branch !== selectedBranch) {
      setLoginError(`This manager can access only ${matchedUser.branch} branch.`);
      return;
    }

    setCurrentUser(matchedUser);
    setBranchFilter("All");
    setLoginError("");
    setLoginForm({ username: "", password: "", branch: "" });
  }

  function handleLogout() {
    setCurrentUser(null);
    setNotice("");
    setReminderKey("");
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "manager") {
      setNotice("Only branch managers can submit branch data.");
      return;
    }

    const footfall = Number(form.totalFootfall);
    const served = Number(form.customerCount);

    if (served > footfall) {
      setNotice("Customers served cannot be greater than total footfall.");
      return;
    }

    const record = {
      ...form,
      branch: currentUser.branch,
      id: crypto.randomUUID(),
      totalFootfall: footfall,
      customerCount: served,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    setRecords((current) => [record, ...current]);
    setForm({ ...emptyForm, timestamp: getCurrentDatetimeValue() });
    setNotice(`${currentUser.branch} branch data submitted successfully.`);
  }

  function addWeather() {
    const value = newWeather.trim();

    if (!value) {
      setNotice("Please enter a weather condition.");
      return;
    }

    if (!weatherOptions.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setWeatherOptions((current) => [...current, value]);
    }

    setForm((current) => ({ ...current, weather: value }));
    setNewWeather("");
    setIsModalOpen(false);
    setNotice("New weather condition added.");
  }

  function deleteRecord(id) {
    const target = records.find((record) => record.id === id);

    if (currentUser?.role === "manager" && target?.branch !== currentUser.branch) {
      setNotice("You are not allowed to manage another branch record.");
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== id));
    setNotice("Record removed.");
  }

  function exportCsv() {
    if (!filteredRecords.length) {
      setNotice("No data available to export.");
      return;
    }

    const headers = [
      "Branch",
      "Date Time",
      "Weather",
      "Customer Feedback / Visit Reason",
      "Total Footfall",
      "Customers Served",
      "Service Rate",
      "Created By",
      "Created At",
    ];

    const rows = filteredRecords.map((record) => [
      record.branch,
      record.timestamp,
      record.weather,
      record.customerLog,
      record.totalFootfall,
      record.customerCount,
      `${getRecordServiceRate(record)}%`,
      record.createdBy,
      record.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      currentUser?.role === "ceo" ? "all-branch-retail-data.csv" : `${currentUser.branch}-retail-data.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!currentUser) {
    return (
      <main className="login-shell">
        <section className="login-panel" aria-label="Retail secure login">
          <div className="brand-row">
            <div className="brand-mark">RD</div>
            <div>
              <p className="eyebrow">Retail Command Center</p>
              <h1>Secure Login</h1>
            </div>
          </div>
          <p className="muted">
            Managers enter with their assigned branch only. CEO access opens the full company dashboard.
          </p>

          <div className="login-tabs" aria-label="Account type">
            <button
              className={loginMode === "manager" ? "active" : ""}
              type="button"
              onClick={() => setLoginMode("manager")}
            >
              Branch Manager
            </button>
            <button
              className={loginMode === "ceo" ? "active" : ""}
              type="button"
              onClick={() => setLoginMode("ceo")}
            >
              CEO Dashboard
            </button>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                type="text"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder={loginMode === "ceo" ? "ceo" : "dhaka.manager"}
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={loginMode === "ceo" ? "ceo123" : "12345"}
                autoComplete="current-password"
              />
            </label>

            {loginMode === "manager" && (
              <label>
                Divisional Branch
                <select
                  value={loginForm.branch}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, branch: event.target.value }))
                  }
                  required
                >
                  <option value="">Select assigned branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {loginError && <p className="error">{loginError}</p>}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>

          <div className="credential-box">
            <strong>Demo access</strong>
            <span>CEO: ceo / ceo123</span>
            <span>Manager: dhaka.manager / 12345 / Dhaka</span>
            <span>Other managers: sylhet.manager, rajshahi.manager, etc.</span>
          </div>
        </section>
      </main>
    );
  }

  const isCeo = currentUser.role === "ceo";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{isCeo ? "CEO Dashboard" : "Branch Manager Workspace"}</p>
          <h1>{isCeo ? "All Branch Performance" : `${currentUser.branch} Branch Operations`}</h1>
          <p className="muted">
            {isCeo
              ? "Monitor company-wide retail movement, compare branches, and export executive reports."
              : "Submit and manage data only for your assigned branch."}
          </p>
        </div>

        <div className="header-actions">
          <div className="user-chip">
            <strong>{currentUser.name}</strong>
            <span>{currentUser.branch}</span>
          </div>
          <div
            className={`clock-card ${managerTimer.isWarning || managerTimer.isDue ? "clock-alert" : ""}`}
            style={{ "--timer-progress": `${managerTimer.progress * 100}%` }}
          >
            <span>Live Time</span>
          <strong>
  {clock.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}
</strong>
          </div>
          <button className="ghost-button danger" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Retail summary">
        <article>
          <span>Total Footfall</span>
          <strong>{stats.footfall}</strong>
        </article>
        <article>
          <span>Customers Served</span>
          <strong>{stats.served}</strong>
        </article>
        <article>
          <span>Total Records</span>
          <strong>{stats.records}</strong>
        </article>
        <article>
          <span>Service Rate</span>
          <strong>{stats.serviceRate}%</strong>
        </article>
      </section>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
            x
          </button>
        </div>
      )}

      {isCeo ? (
        <CeoDashboard
          branchFilter={branchFilter}
          branchSummary={branchSummary}
          exportCsv={exportCsv}
          filteredRecords={filteredRecords}
          search={search}
          setBranchFilter={setBranchFilter}
          setSearch={setSearch}
          topBranch={topBranch}
          visibleRecordCount={filteredRecords.length}
        />
      ) : (
        <ManagerDashboard
          addWeather={() => setIsModalOpen(true)}
          currentUser={currentUser}
          deleteRecord={deleteRecord}
          exportCsv={exportCsv}
          filteredRecords={filteredRecords}
          form={form}
          handleFieldChange={handleFieldChange}
          handleSubmit={handleSubmit}
          search={search}
          setForm={setForm}
          setSearch={setSearch}
          weatherOptions={weatherOptions}
        />
      )}

      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add weather condition">
          <div className="modal">
            <h2>Add Weather Condition</h2>
            <p>Save a custom weather option for future entries.</p>
            <input
              type="text"
              value={newWeather}
              onChange={(event) => setNewWeather(event.target.value)}
              placeholder="Example: Humid"
              autoFocus
            />
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" type="button" onClick={addWeather}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ManagerDashboard({
  addWeather,
  currentUser,
  deleteRecord,
  exportCsv,
  filteredRecords,
  form,
  handleFieldChange,
  handleSubmit,
  search,
  setForm,
  setSearch,
  weatherOptions,
}) {
  const served = Number(form.customerCount) || 0;
  const footfall = Number(form.totalFootfall) || 0;
  const liveRate = footfall ? Math.round((served / footfall) * 100) : 0;

  return (
    <section className="manager-workspace">
      <form className="entry-form manager-entry" onSubmit={handleSubmit}>
        <div className="manager-form-hero">
          <div>
            <span>Assigned branch</span>
            <strong>{currentUser.branch}</strong>
            <p>Every submission from this workspace is securely attached to this branch.</p>
          </div>
          <div className="live-rate">
            <span>Live Service Rate</span>
            <strong>{liveRate}%</strong>
          </div>
        </div>

        <div className="manager-form-header">
          <h2>Daily Entry</h2>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setForm({ ...emptyForm, timestamp: getCurrentDatetimeValue() })}
          >
            Clear
          </button>
        </div>

        <fieldset className="form-section">
          <legend>Visit Info</legend>
          <div className="form-grid manager-field-grid">
            <label className="plain-field">
              <span>Data Entry Date & Time</span>
              <input
                name="timestamp"
                type="datetime-local"
                value={form.timestamp}
                onChange={handleFieldChange}
                required
              />
            </label>

            <label className="plain-field">
              <span>Current Weather Condition</span>
              <div className="inline-control">
                <select name="weather" value={form.weather} onChange={handleFieldChange} required>
                  <option value="">Select weather condition</option>
                  {weatherOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button className="mini-button" type="button" onClick={addWeather}>
                  Add
                </button>
              </div>
            </label>

            <label className="plain-field">
              <span>Customer Feedback / Visit Reason</span>
              <select name="customerLog" value={form.customerLog} onChange={handleFieldChange} required>
                <option value="">Select customer log</option>
                {customerLogs.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Traffic Info</legend>
          <div className="traffic-grid">
            <label className="plain-field metric-field">
              <span>Total Footfall</span>
              <input
                name="totalFootfall"
                type="number"
                min="0"
                value={form.totalFootfall}
                onChange={handleFieldChange}
                placeholder="0"
                required
              />
            </label>

            <label className="plain-field metric-field">
              <span>Total Customers Served</span>
              <input
                name="customerCount"
                type="number"
                min="0"
                value={form.customerCount}
                onChange={handleFieldChange}
                placeholder="0"
                required
              />
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <button className="primary-button" type="submit">
            Submit Branch Data
          </button>
        </div>
      </form>

      <RecordPanel
        canDelete
        exportCsv={exportCsv}
        filteredRecords={filteredRecords}
        search={search}
        setSearch={setSearch}
        onDelete={deleteRecord}
        title={`${currentUser.branch} Submitted Data`}
      />
    </section>
  );
}

function CeoDashboard({
  branchFilter,
  branchSummary,
  exportCsv,
  filteredRecords,
  search,
  setBranchFilter,
  setSearch,
  topBranch,
  visibleRecordCount,
}) {
  return (
    <section className="ceo-layout">
      <aside className="executive-panel">
        <div className="section-heading">
          <div>
            <h2>Branch Control</h2>
            <p>
              {branchFilter === "All"
                ? "Showing all branches together."
                : `Showing ${branchFilter} branch information only.`}
            </p>
          </div>
        </div>

        <div className="branch-filter-list">
          <button
            className={branchFilter === "All" ? "active" : ""}
            type="button"
            onClick={() => setBranchFilter("All")}
          >
            <span>All Branches</span>
            <strong>{branchSummary.reduce((sum, item) => sum + item.records, 0)}</strong>
          </button>
          {branchSummary.map((item) => (
            <button
              className={branchFilter === item.branch ? "active" : ""}
              key={item.branch}
              type="button"
              onClick={() => setBranchFilter(item.branch)}
            >
              <span>{item.branch}</span>
              <strong>{item.records}</strong>
            </button>
          ))}
        </div>
      </aside>

      <div className="ceo-main">
        <div className="insight-grid">
          <article className="insight-card">
            <span>Top Footfall Branch</span>
            <strong>{topBranch?.branch ?? "-"}</strong>
            <p>{topBranch?.footfall ?? 0} visitors tracked</p>
          </article>
          <article className="insight-card">
            <span>Active Branches</span>
            <strong>{branchSummary.filter((item) => item.records > 0).length}</strong>
            <p>Out of {branches.length} configured branches</p>
          </article>
        </div>

        <section className="branch-table-panel">
          <div className="section-heading">
            <div>
              <h2>Branch Comparison</h2>
              <p>Executive snapshot by divisional branch.</p>
            </div>
          </div>
          <div className="table-wrap compact">
            <table>
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Records</th>
                  <th>Footfall</th>
                  <th>Served</th>
                  <th>Service</th>
                </tr>
              </thead>
              <tbody>
                {branchSummary.map((item) => (
                  <tr key={item.branch}>
                    <td>
                      <strong>{item.branch}</strong>
                    </td>
                    <td>{item.records}</td>
                    <td>{item.footfall}</td>
                    <td>{item.served}</td>
                    <td>{item.serviceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RecordPanel
          canDelete={false}
          exportCsv={exportCsv}
          filteredRecords={filteredRecords}
          search={search}
          setSearch={setSearch}
          title={branchFilter === "All" ? "CEO Data View" : `CEO Data View - ${branchFilter}`}
          subtitle={`${visibleRecordCount} records in current view`}
        />
      </div>
    </section>
  );
}

function RecordPanel({
  canDelete,
  exportCsv,
  filteredRecords,
  onDelete,
  search,
  setSearch,
  subtitle,
  title,
}) {
  return (
    <aside className="record-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle || `${filteredRecords.length} records shown`}</p>
        </div>
        <button className="secondary-button" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search branch, weather, feedback"
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Date Time</th>
              <th>Weather</th>
              <th>Customer Feedback / Visit Reason</th>
              <th>Total Footfall</th>
              <th>Customers Served</th>
              <th>Service Rate</th>
              <th>Created By</th>
              <th>Created At</th>
              {canDelete && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.branch}</strong>
                  </td>
                  <td>{formatDateTime(record.timestamp)}</td>
                  <td>{record.weather}</td>
                  <td>{record.customerLog}</td>
                  <td>{record.totalFootfall}</td>
                  <td>{record.customerCount}</td>
                  <td>{getRecordServiceRate(record)}%</td>
                  <td>{record.createdBy}</td>
                  <td>{formatDateTime(record.createdAt)}</td>
                  {canDelete && (
                    <td>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => onDelete(record.id)}
                        aria-label={`Delete ${record.branch} record`}
                      >
                        x
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan={canDelete ? "10" : "9"}>
                  No retail data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

export default App;
