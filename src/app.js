const STORAGE_KEY = "cycle-tracker-data";

const form = document.getElementById("cycle-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const periodLengthInput = document.getElementById("period-length");
const cycleLengthInput = document.getElementById("cycle-length");
const estimatedOvulationInput = document.getElementById("estimated-ovulation");
const historyTable = document.getElementById("history-table");
const avgCycle = document.getElementById("avg-cycle");
const variability = document.getElementById("variability");
const irregular = document.getElementById("irregular");
const nextPeriod = document.getElementById("next-period");
const nextOvulation = document.getElementById("next-ovulation");
const exportButton = document.getElementById("export-data");
const deleteButton = document.getElementById("delete-data");
const exportOutput = document.getElementById("export-output");
const resetButton = document.getElementById("reset-form");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

const loadData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveData = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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

  const cycleLengths = entries
    .map((entry) => entry.cycleLength)
    .filter((value) => typeof value === "number");

  const averageCycle = calculateAverage(cycleLengths);
  const stdDev = calculateStdDev(cycleLengths);

  avgCycle.textContent = averageCycle
    ? `${averageCycle.toFixed(1)} days`
    : "—";
  variability.textContent = stdDev ? `${stdDev.toFixed(1)} days` : "—";
  irregular.textContent = stdDev && stdDev > 4 ? "Likely irregular" : "Stable";

  const latest = entries[entries.length - 1];
  if (averageCycle && latest?.startDate) {
    const nextPeriodDate = addDays(new Date(latest.startDate), Math.round(averageCycle));
    const nextOvulationDate = addDays(nextPeriodDate, -14);
    nextPeriod.textContent = formatDate(nextPeriodDate);
    nextOvulation.textContent = formatDate(nextOvulationDate);
  }
};

const renderHistory = (entries) => {
  historyTable.innerHTML = "";
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    const symptomText = entry.symptoms.length ? entry.symptoms.join(", ") : "—";
    row.innerHTML = `
      <td>${formatDate(entry.startDate)}</td>
      <td>${formatDate(entry.endDate)}</td>
      <td>${entry.periodLength ?? "—"}</td>
      <td>${entry.cycleLength ?? "—"}</td>
      <td>${entry.flow || "—"}</td>
      <td>${symptomText}</td>
    `;
    historyTable.appendChild(row);
  });
};

const refreshUI = () => {
  const entries = loadData();
  renderHistory(entries);
  buildSummary(entries);
};

const updateDerivedFields = () => {
  if (startDateInput.value && endDateInput.value) {
    const periodLength = diffInDays(startDateInput.value, endDateInput.value) + 1;
    periodLengthInput.value = periodLength > 0 ? `${periodLength} days` : "";
  } else {
    periodLengthInput.value = "";
  }

  const entries = loadData();
  const lastEntry = entries[entries.length - 1];
  if (lastEntry && startDateInput.value) {
    const length = diffInDays(lastEntry.startDate, startDateInput.value);
    cycleLengthInput.value = length > 0 ? `${length} days` : "";
  } else {
    cycleLengthInput.value = "";
  }

  const cycleLengths = entries
    .map((entry) => entry.cycleLength)
    .filter((value) => typeof value === "number");
  const averageCycle = calculateAverage(cycleLengths);
  if (averageCycle && startDateInput.value) {
    const estimated = addDays(new Date(startDateInput.value), Math.round(averageCycle) - 14);
    estimatedOvulationInput.value = formatDate(estimated);
  } else {
    estimatedOvulationInput.value = "";
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const symptoms = Array.from(
    form.querySelectorAll("fieldset:nth-of-type(1) input[type='checkbox']:checked")
  ).map((input) => input.value);

  const flow = form.querySelector("input[name='flow']:checked")?.value || "";

  const entries = loadData();
  const cycleLengthValue = cycleLengthInput.value
    ? Number.parseInt(cycleLengthInput.value, 10)
    : null;
  const periodLengthValue = periodLengthInput.value
    ? Number.parseInt(periodLengthInput.value, 10)
    : null;

  const entry = {
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    periodLength: periodLengthValue,
    cycleLength: cycleLengthValue,
    symptoms,
    flow,
    clots: document.getElementById("clots").value,
    ovulation: {
      estimated: estimatedOvulationInput.value,
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

  entries.push(entry);
  saveData(entries);
  form.reset();
  periodLengthInput.value = "";
  cycleLengthInput.value = "";
  estimatedOvulationInput.value = "";
  exportOutput.textContent = "";
  refreshUI();
});

[startDateInput, endDateInput].forEach((input) => {
  input.addEventListener("change", updateDerivedFields);
});

resetButton.addEventListener("click", () => {
  form.reset();
  periodLengthInput.value = "";
  cycleLengthInput.value = "";
  estimatedOvulationInput.value = "";
});

exportButton.addEventListener("click", () => {
  const entries = loadData();
  exportOutput.textContent = JSON.stringify(entries, null, 2);
});

deleteButton.addEventListener("click", () => {
  if (window.confirm("Delete all stored cycle data?")) {
    localStorage.removeItem(STORAGE_KEY);
    exportOutput.textContent = "Data deleted.";
    refreshUI();
  }
});

refreshUI();
