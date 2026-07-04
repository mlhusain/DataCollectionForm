const demoUsername = "admin";
const demoPassword = "12345";

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("loginError");

  if (username === demoUsername && password === demoPassword) {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.remove("hidden");
    error.textContent = "";
  } else {
    error.textContent = "Invalid username or password!";
  }
}

function logout() {
  document.getElementById("dashboardPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

function updateClock() {
  const now = new Date();
  document.getElementById("liveClock").textContent = now.toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();

function openModal() {
  document.getElementById("weatherModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("weatherModal").classList.add("hidden");
  document.getElementById("newWeather").value = "";
}

function addWeather() {
  const newWeather = document.getElementById("newWeather").value.trim();
  const weatherSelect = document.getElementById("weather");

  if (newWeather === "") {
    alert("Please enter a weather condition.");
    return;
  }

  const option = document.createElement("option");
  option.textContent = newWeather;
  option.value = newWeather;

  weatherSelect.appendChild(option);
  weatherSelect.value = newWeather;

  closeModal();
}

document.getElementById("entryForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const data = {
    shopName: document.getElementById("shopName").value,
    purchase: document.getElementById("purchase").value,
    timestamp: document.getElementById("timestamp").value,
    weather: document.getElementById("weather").value,
    customerLog: document.getElementById("customerLog").value,
    totalFootfall: document.getElementById("totalFootfall").value,
    customerCount: document.getElementById("customerCount").value
  };

  document.getElementById("successMsg").classList.remove("hidden");

  document.getElementById("output").classList.remove("hidden");
  document.getElementById("output").innerHTML = `
    <h3>Submitted Retail Data</h3>
    <p><strong>Branch / Outlet Name:</strong> ${data.shopName}</p>
    <p><strong>Purchase Status:</strong> ${data.purchase}</p>
    <p><strong>Data Entry Date & Time:</strong> ${data.timestamp}</p>
    <p><strong>Current Weather Condition:</strong> ${data.weather}</p>
    <p><strong>Customer Feedback / Visit Reason:</strong> ${data.customerLog}</p>
    <p><strong>Total Footfall:</strong> ${data.totalFootfall}</p>
    <p><strong>Total Customers Served:</strong> ${data.customerCount}</p>
  `;

  document.getElementById("entryForm").reset();

  setTimeout(() => {
    document.getElementById("successMsg").classList.add("hidden");
  }, 3000);
});