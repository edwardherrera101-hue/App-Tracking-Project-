let data = JSON.parse(localStorage.getItem("periodApp")) || { users: {} };
let currentUser = null;

function login() {
  const user = username.value.trim();
  const pin = pin.value;

  if (!user || !pin) return alert("Enter username and PIN");

  if (!data.users[user]) {
    data.users[user] = { pin, entries: {} };
  } else if (data.users[user].pin !== pin) {
    return alert("Wrong PIN");
  }

  currentUser = user;
  localStorage.setItem("periodApp", JSON.stringify(data));

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";

  renderCalendar();
}
