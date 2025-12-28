const form = document.getElementById("cycle-form");
const lastPeriodInput = document.getElementById("last-period");
const cycleLengthInput = document.getElementById("cycle-length");
const periodLengthInput = document.getElementById("period-length");
const nextPeriodOutput = document.getElementById("next-period");
const fertileWindowOutput = document.getElementById("fertile-window");
const cycleDayOutput = document.getElementById("cycle-day");
const notesInput = document.getElementById("notes");
const saveNotesButton = document.getElementById("save-notes");
const clearNotesButton = document.getElementById("clear-notes");
const notesStatus = document.getElementById("notes-status");

const STORAGE_KEY = "cycleCompassData";

const formatDate = (date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const calculatePredictions = ({ lastPeriod, cycleLength, periodLength }) => {
  const nextPeriod = addDays(lastPeriod, cycleLength);
  const fertileStart = addDays(nextPeriod, -18);
  const fertileEnd = addDays(nextPeriod, -12);
  const today = new Date();
  const cycleDay = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24)) + 1;

  return {
    nextPeriod,
    fertileStart,
    fertileEnd,
    cycleDay: cycleDay > 0 ? cycleDay : 1,
    periodEnd: addDays(lastPeriod, periodLength - 1),
  };
};

const renderPredictions = (data) => {
  if (!data) {
    nextPeriodOutput.textContent = "—";
    fertileWindowOutput.textContent = "—";
    cycleDayOutput.textContent = "—";
    return;
  }

  nextPeriodOutput.textContent = formatDate(data.nextPeriod);
  fertileWindowOutput.textContent = `${formatDate(data.fertileStart)} – ${formatDate(data.fertileEnd)}`;
  cycleDayOutput.textContent = `Day ${data.cycleDay}`;
};

const loadStoredData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Unable to parse stored cycle data", error);
    return null;
  }
};

const storeData = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const refreshFromStorage = () => {
  const stored = loadStoredData();
  if (!stored) return;

  lastPeriodInput.value = stored.lastPeriod;
  cycleLengthInput.value = stored.cycleLength;
  periodLengthInput.value = stored.periodLength;
  notesInput.value = stored.notes || "";

  const predictions = calculatePredictions({
    lastPeriod: new Date(stored.lastPeriod),
    cycleLength: Number(stored.cycleLength),
    periodLength: Number(stored.periodLength),
  });

  renderPredictions(predictions);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const lastPeriodValue = lastPeriodInput.value;
  const cycleLengthValue = Number(cycleLengthInput.value);
  const periodLengthValue = Number(periodLengthInput.value);

  if (!lastPeriodValue || !cycleLengthValue || !periodLengthValue) return;

  const predictions = calculatePredictions({
    lastPeriod: new Date(lastPeriodValue),
    cycleLength: cycleLengthValue,
    periodLength: periodLengthValue,
  });

  renderPredictions(predictions);
  storeData({
    lastPeriod: lastPeriodValue,
    cycleLength: cycleLengthValue,
    periodLength: periodLengthValue,
    notes: notesInput.value,
  });

  notesStatus.textContent = "Cycle details updated.";
});

saveNotesButton.addEventListener("click", () => {
  const stored = loadStoredData() || {};
  storeData({
    ...stored,
    notes: notesInput.value,
  });
  notesStatus.textContent = "Notes saved locally.";
});

clearNotesButton.addEventListener("click", () => {
  notesInput.value = "";
  const stored = loadStoredData() || {};
  storeData({
    ...stored,
    notes: "",
  });
  notesStatus.textContent = "Notes cleared.";
});

refreshFromStorage();
