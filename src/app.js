const STORAGE_KEY = "cycle-tracker-data";

const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const appContainer = document.getElementById("app");
const logoutButton = document.getElementById("logout");

const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");

const dailyForm = document.getElementById("daily-form");
const selectedDateInput = document.getElementById("selected-date");
const periodStatusSelect = document.getElementById("period-status");
const flowSelect = document.getElementById("flow");
const clotsSelect = document.getElementById("clots");
const clearDayButton = document.getElementById("clear-day");

const avgCycle = document.getElementById("avg-cycle");
const variability = document.getElementById("variability");
const irregular = document.getElementById("irregular");
const nextPeriod = document.getElementById("next-period");
const nextOvulation = document.getElementById("next-ovulation");
const historyTable = document.getElementById("history-table");

const exportButton = document.getElementById("export-data");
const deleteButton = document.getElementById("delete-data");
const exportOutput = document.getElementById("export-output");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const state = {
  activeDate: null,
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

const diffInDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const getStoredData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : { users: {}, activeUser: null };
};

const saveStoredData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getActiveUserData = () => {
  const data = getStoredData();
  const activeUser = data.activeUser;
  if (!activeUser) return null;
  return data.users[activeUser] || null;
};

const setActiveUser = (name) => {
  const data = getStoredData();
  if (!data.users[name]) {
    data.users[name] = { entries: [] };
  }
  data.activeUser = name;
  saveStoredData(data);
};

const clearActiveUser = () => {
  const data = getStoredData();
  data.activeUser = null;
  saveStoredData(data);
};

const saveEntry = (entry) => {
  const data = getStoredData();
  const activeUser = data.activeUser;
  if (!activeUser) return;
  const userData = data.users[activeUser];
  const existingIndex = userData.entries.findIndex(
    (item) => item.date === entry.date
  );
  if (existingIndex >= 0) {
    userData.entries[existingIndex] = entry;
  } else {
    userData.entries.push(entry);
  }
  saveStoredData(data);
};

const deleteEntry = (date) => {
  const data = getStoredData();
  const activeUser = data.activeUser;
  if (!activeUser) return;
  const userData = data.users[activeUser];
  userData.entries = userData.entries.filter((entry) => entry.date !== date);
  saveStoredData(data);
};

const getEntries = () => {
  const userData = getActiveUserData();
  return userData ? userData.entries : [];
};

const setFormEnabled = (enabled) => {
  const controls = dailyForm.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    if (control.id === "selected-date") return;
    control.disabled = !enabled;
  });
};

const calculateAverage = (values) => {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const calculateStdDev = (values) => {
  if (values.length < 2) return null;
  const average = calculateAverage(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
};

const buildSummary = (entries) => {
  if (!entries.length) {
    avgCycle.textContent = "—";
    variability.textContent = "—";
    irregular.textContent = "—";
    nextPeriod.textContent = "—";
    nextOvulation.textContent = "—";
    return;
  }

  const starts = entries
    .filter((entry) => entry.periodStatus === "Start")
    .map((entry) => entry.date)
    .sort();

  const cycleLengths = starts.slice(1).map((date, index) => {
    const previous = starts[index];
    return diffInDays(previous, date);
  });

  const averageCycle = calculateAverage(cycleLengths);
  const stdDev = calculateStdDev(cycleLengths);

  avgCycle.textContent = averageCycle
    ? `${averageCycle.toFixed(1)} days`
    : "—";
  variability.textContent = stdDev ? `${stdDev.toFixed(1)} days` : "—";
  irregular.textContent = stdDev && stdDev > 4 ? "Likely irregular" : "Stable";

  if (averageCycle && starts.length) {
    const latestStart = new Date(starts[starts.length - 1]);
    const nextPeriodDate = addDays(latestStart, Math.round(averageCycle));
    const nextOvulationDate = addDays(nextPeriodDate, -14);
    nextPeriod.textContent = formatDate(nextPeriodDate);
    nextOvulation.textContent = formatDate(nextOvulationDate);
  } else {
    nextPeriod.textContent = "—";
    nextOvulation.textContent = "—";
  }
};

const renderHistory = (entries) => {
  historyTable.innerHTML = "";
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach((entry) => {
    const row = document.createElement("tr");
    const symptomText = entry.symptoms.length ? entry.symptoms.join(", ") : "—";
    row.innerHTML = `
      <td>${formatDate(entry.date)}</td>
      <td>${entry.periodStatus || "—"}</td>
      <td>${entry.flow || "—"}</td>
      <td>${symptomText}</td>
      <td>${entry.notes || "—"}</td>
    `;
    historyTable.appendChild(row);
  });
};

const refreshUI = () => {
  const entries = getEntries();
  renderCalendar(entries);
  renderHistory(entries);
  buildSummary(entries);
};

const renderCalendarHeaders = () => {
  const headers = [];
  const baseDate = new Date(2023, 0, 1);
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(baseDate, i);
    headers.push(
      `<div class="calendar-header">${weekdayFormatter.format(day)}</div>`
    );
  }
  return headers.join("");
};

const renderCalendar = (entries) => {
  calendarGrid.innerHTML = renderCalendarHeaders();
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  monthLabel.textContent = monthFormatter.format(state.currentMonth);

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i += 1) {
    calendarGrid.insertAdjacentHTML(
      "beforeend",
      `<div class="calendar-day"></div>`
    );
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const isoDate = toISODate(date);
    const entry = entries.find((item) => item.date === isoDate);
    const isSelected = state.activeDate === isoDate;
    let dotClass = "";
    if (entry?.periodStatus === "Start") {
      dotClass = "start";
    } else if (entry?.periodStatus === "End") {
      dotClass = "end";
    } else if (entry?.periodStatus === "Bleeding") {
      dotClass = "bleeding";
    }

    calendarGrid.insertAdjacentHTML(
      "beforeend",
      `
        <div class="calendar-day ${entry ? "has-entry" : ""} ${
          isSelected ? "is-selected" : ""
        }">
          <button type="button" data-date="${isoDate}">${day}</button>
          ${entry ? `<span class="dot ${dotClass}"></span>` : ""}
        </div>
      `
    );
  }
};

const populateForm = (entry) => {
  selectedDateInput.value = entry ? formatDate(entry.date) : "";
  periodStatusSelect.value = entry?.periodStatus || "";
  flowSelect.value = entry?.flow || "";
  clotsSelect.value = entry?.clots || "";
  document.getElementById("mucus").value = entry?.ovulation?.mucus || "Not noted";
  document.getElementById("libido").value = entry?.ovulation?.libido || "Not noted";
  document.getElementById("energy").value = entry?.ovulation?.energy || "Not noted";
  document.getElementById("stress").value = entry?.context?.stress || "Low";
  document.getElementById("sleep").value = entry?.context?.sleep || "";
  document.getElementById("exercise").value = entry?.context?.exercise || "None";
  document.getElementById("illness").value = entry?.context?.illness || "";
  document.getElementById("travel").value = entry?.context?.travel || "";
  document.getElementById("diet").value = entry?.context?.diet || "";
  document.getElementById("meds").value = entry?.context?.meds || "";
  document.getElementById("notes").value = entry?.notes || "";

  const symptomInputs = Array.from(
    document.querySelectorAll("details:nth-of-type(1) input[type='checkbox']")
  );
  symptomInputs.forEach((input) => {
    input.checked = entry?.symptoms?.includes(input.value) || false;
  });
};

const setActiveDate = (isoDate) => {
  state.activeDate = isoDate;
  const entries = getEntries();
  const entry = entries.find((item) => item.date === isoDate);
  populateForm(entry || { date: isoDate, symptoms: [] });
  setFormEnabled(true);
  document
    .querySelectorAll("#daily-log details")
    .forEach((detail) => (detail.open = true));
  exportOutput.textContent = "";
  refreshUI();
};

const handleLogin = (event) => {
  event.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  setActiveUser(name);
  usernameInput.value = "";
  loginScreen.hidden = true;
  appContainer.hidden = false;
  state.activeDate = null;
  populateForm(null);
  setFormEnabled(false);
  refreshUI();
};

const handleLogout = () => {
  clearActiveUser();
  appContainer.hidden = true;
  loginScreen.hidden = false;
  state.activeDate = null;
  populateForm(null);
  setFormEnabled(false);
};

loginForm.addEventListener("submit", handleLogin);
logoutButton.addEventListener("click", handleLogout);

calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-date]");
  if (!button) return;
  setActiveDate(button.dataset.date);
});

prevMonthButton.addEventListener("click", () => {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() - 1,
    1
  );
  refreshUI();
});

nextMonthButton.addEventListener("click", () => {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + 1,
    1
  );
  refreshUI();
});

dailyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.activeDate) return;

  const symptomInputs = Array.from(
    document.querySelectorAll("details:nth-of-type(1) input[type='checkbox']")
  );
  const symptoms = symptomInputs
    .filter((input) => input.checked)
    .map((input) => input.value);

  const entry = {
    date: state.activeDate,
    periodStatus: periodStatusSelect.value,
    flow: flowSelect.value,
    clots: clotsSelect.value,
    symptoms,
    ovulation: {
      mucus: document.getElementById("mucus").value,
      libido: document.getElementById("libido").value,
      energy: document.getElementById("energy").value,
    },
    context: {
      stress: document.getElementById("stress").value,
      sleep: document.getElementById("sleep").value,
      exercise: document.getElementById("exercise").value,
      illness: document.getElementById("illness").value,
      travel: document.getElementById("travel").value,
      diet: document.getElementById("diet").value,
      meds: document.getElementById("meds").value,
    },
    notes: document.getElementById("notes").value,
  };

  saveEntry(entry);
  refreshUI();
});

clearDayButton.addEventListener("click", () => {
  if (!state.activeDate) return;
  deleteEntry(state.activeDate);
  populateForm({ date: state.activeDate, symptoms: [] });
  refreshUI();
});

exportButton.addEventListener("click", () => {
  const entries = getEntries();
  exportOutput.textContent = JSON.stringify(entries, null, 2);
});

deleteButton.addEventListener("click", () => {
  const data = getStoredData();
  const activeUser = data.activeUser;
  if (!activeUser) return;
  if (window.confirm("Delete all stored cycle data for this user?")) {
    data.users[activeUser].entries = [];
    saveStoredData(data);
    exportOutput.textContent = "Data deleted.";
    refreshUI();
  }
});

(() => {
  const data = getStoredData();
  if (data.activeUser) {
    loginScreen.hidden = true;
    appContainer.hidden = false;
    refreshUI();
    setFormEnabled(Boolean(state.activeDate));
  } else {
    setFormEnabled(false);
  }
})();
