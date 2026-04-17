/**
 * College Event Registration System - JavaScript
 * Updated for Project Part 5 - Flask / Python Integration
 *
 * ANNOTATION (Rubric Item 4 — Changes to Existing Files):
 * The only change from Part 4 is updating the fetch() base URL from
 * http://localhost:3000 (Node.js/Express) to http://localhost:5000 (Flask).
 * All existing functionality (dark mode, guest fields, char counter, etc.)
 * is preserved unchanged so no other files need to be modified.
 */

// ============================================================
// 1. DATABASE & FORM FUNCTIONS
// ============================================================

// (10) Populate table using form input (CRUD: CREATE)
async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
        username:   document.getElementById("firstname").value,
        email:      document.getElementById("email").value,
        event_name: document.getElementById("event").value,
        notes:      document.getElementById("comments").value
    };

    try {
        // ANNOTATION (Port change): URL updated from :3000 → :5000 for Flask
        const response = await fetch('http://localhost:5000/api/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Registration saved to SQLite!");
            window.location.href = "dashboard.html";
        } else {
            alert("Error: Server failed to save registration.");
        }
    } catch (err) {
        console.error("Database connection failed:", err);
        alert("Error: Is your terminal running 'python app.py'?");
    }
}

// (10) Output data on your webpage using javascript (CRUD: READ)
async function loadDashboardData() {
    const tableBody = document.querySelector("#analytics-table tbody");
    if (!tableBody) return;

    try {
        // ANNOTATION (Port change): URL updated from :3000 → :5000 for Flask
        const response = await fetch('http://localhost:5000/api/dashboard');
        const data     = await response.json();

        tableBody.innerHTML = "";
        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.username}</td>
                <td>${row.event_name}</td>
                <td>${row.reg_date}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
    }
}

// ============================================================
// 2. EXISTING UI FEATURES (unchanged from Part 4)
// ============================================================

function darkModeToggle() {
    document.body.classList.toggle("dark-mode");
}

function addGuestField() {
    const container = document.getElementById("guest-names-container");
    const input     = document.createElement("input");
    input.type        = "text";
    input.placeholder = "Guest Name";
    input.style.display   = "block";
    input.style.marginTop = "5px";
    container.appendChild(input);
}

function removeLastGuest() {
    const container = document.getElementById("guest-names-container");
    if (container.lastChild) container.removeChild(container.lastChild);
}

function updateCharCount() {
    const comments = document.getElementById("comments");
    const display  = document.getElementById("char-count");
    if (comments && display) {
        display.textContent = `${comments.value.length}/250 characters`;
    }
}

// ============================================================
// 3. EVENT LISTENERS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Database listeners
    const form = document.getElementById("registration-form");
    if (form) form.addEventListener("submit", handleFormSubmit);

    if (window.location.pathname.includes("dashboard.html")) {
        loadDashboardData();
    }

    // UI listeners (unchanged)
    const darkBtn = document.getElementById("dark-mode-btn");
    if (darkBtn) darkBtn.addEventListener("click", darkModeToggle);

    const addGuestBtn = document.getElementById("add-guest-btn");
    if (addGuestBtn) addGuestBtn.addEventListener("click", addGuestField);

    const removeGuestBtn = document.getElementById("remove-guest-btn");
    if (removeGuestBtn) removeGuestBtn.addEventListener("click", removeLastGuest);

    const commentsArea = document.getElementById("comments");
    if (commentsArea) commentsArea.addEventListener("keyup", updateCharCount);
});

async function login() {
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });

        if (response.ok) {
            alert("Login successful!");
            window.location.href = "dashboard.html"; // or wherever admin goes
        } else {
            alert("Incorrect password!");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Server not running?");
    }
}