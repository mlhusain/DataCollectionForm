const demoUsername = "admin";
const demoPassword = "12345";
demoUsername = "admin2";
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("loginError");

  if (username === demoUsername && password === demoPassword) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("formBox").classList.remove("hidden");
    error.textContent = "";
  } else {
    error.textContent = "Invalid username or password!";
  }
}

function logout() {
  document.getElementById("formBox").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
}

document.getElementById("entryForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const data = {
    shopName: document.getElementById("shopName").value,
    purchase: document.getElementById("purchase").value,
    timestamp: document.getElementById("timestamp").value,
    weather: document.getElementById("weather").value,
    customerLog: document.getElementById("customerLog").value,
    customerCount: document.getElementById("customerCount").value
  };

  document.getElementById("successMsg").classList.remove("hidden");

  document.getElementById("output").innerHTML = `
    <h3>Submitted Data</h3>
    <p><strong>Shop Name:</strong> ${data.shopName}</p>
    <p><strong>Purchase:</strong> ${data.purchase}</p>
    <p><strong>Timestamp:</strong> ${data.timestamp}</p>
    <p><strong>Weather:</strong> ${data.weather}</p>
    <p><strong>Customer Log:</strong> ${data.customerLog}</p>
    <p><strong>Customer Count:</strong> ${data.customerCount}</p>
  `;

  document.getElementById("entryForm").reset();
});