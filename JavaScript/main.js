/**
 * College Event Registration System - JavaScript
 * Authors: Ross Miguel Luna, Arash Nail
 * Description: Provides interactivity, form validation, DOM manipulation,
 *              and dynamic content for the registration system.
 *
 * VARIABLE ANNOTATION:
 *   - const SECRET_PASSWORD = "CampusAdmin2026"
 *     Type: String (primitive). Constants declared with 'const' CANNOT be reassigned after declaration.
 *     This is a string literal holding the admin password.
 *
 *   - let registrationCount = 0
 *     Type: Number (primitive). Variables declared with 'let' CAN be changed (reassigned).
 *     Tracks how many times the live character counter has been triggered.
 *
 *   - var darkModeActive = false
 *     Type: Boolean (primitive). Variables declared with 'var' CAN be changed and are function-scoped.
 *     Tracks whether dark mode is currently enabled.
 */

// ============================================================
// CONSTANTS & MODULE-LEVEL VARIABLES
// ============================================================

/* VARIABLE: const (cannot be changed) — stores the admin secret password as a string */
const SECRET_PASSWORD = "CampusAdmin2026";

/* VARIABLE: let (can be changed) — counts comment characters typed; number type */
let charCount = 0;

/* VARIABLE: var (can be changed, function-scoped) — boolean tracking dark mode state */
var darkModeActive = false;

// ============================================================
// COMPONENT 1 — FORM VALIDATION
// ANNOTATION: This function is triggered when the registration form is submitted.
// It validates: (1) email must end in .edu, (2) phone must be exactly 10 digits,
// (3) Student ID must be numeric only, (4) required fields are non-empty.
// Uses if/else control flow (see CONTROL FLOW annotation below).
// Prevents form submission via event.preventDefault() if any check fails.
// The results are displayed in the DOM using getElementById and innerHTML.
// ============================================================

/**
 * FUNCTION ANNOTATION — validateForm(event):
 * This function accepts a DOM Event object as its parameter.
 * It reads values from multiple form input fields using document.getElementById(),
 * runs a series of regex and length checks, and either shows errors in the
 * #validation-messages div or allows the form to proceed.
 * Returns nothing (void); side effects are DOM updates and event cancellation.
 */
function validateForm(event) {
    // Prevent the default browser form submission so we can validate first
    event.preventDefault();

    // Grab the output container in the DOM (a <div> with id="validation-messages")
    // DOM ANNOTATION: We are selecting a <div> element by its ID.
    // It links to the HTML via the matching id="validation-messages" attribute on the div.
    const msgBox = document.getElementById("validation-messages");

    // Read field values
    const firstName  = document.getElementById("firstname").value.trim();
    const lastName   = document.getElementById("lastname").value.trim();
    const studentId  = document.getElementById("studentid").value.trim();
    const email      = document.getElementById("email").value.trim();
    const phone      = document.getElementById("phone").value.trim();
    const eventSel   = document.getElementById("event").value;
    const agreeBox   = document.getElementById("agree").checked;

    // Collect error messages
    let errors = [];

    // CONTROL FLOW ANNOTATION — if/else chain:
    // Used here because each field has a distinct validation rule that produces
    // a specific error message. if/else is the right tool when checking
    // multiple independent conditions that each require a unique response.

    // Check: first name not empty
    if (firstName === "") {
        errors.push("First Name is required.");
    }

    // Check: last name not empty
    if (lastName === "") {
        errors.push("Last Name is required.");
    }

    // Check: Student ID must be numeric only (using regex \d+ = one or more digits)
    if (!/^\d+$/.test(studentId)) {
        errors.push("Student ID must contain numbers only (e.g. 1234567).");
    }

    // Check: email must end in .edu (college email requirement)
    if (!email.toLowerCase().endsWith(".edu")) {
        errors.push("Please enter a valid college email address ending in .edu.");
    }

    // Check: phone number — if provided, must be exactly 10 digits
    if (phone !== "" && !/^\d{10}$/.test(phone)) {
        errors.push("Phone number must be exactly 10 digits (numbers only, no dashes).");
    }

    // Check: an event must be selected
    if (eventSel === "") {
        errors.push("Please select an event.");
    }

    // Check: agreement checkbox must be ticked
    if (!agreeBox) {
        errors.push("You must agree to the attendance policy before submitting.");
    }

    // Display errors or success using innerHTML (HTML content change in the DOM)
    if (errors.length > 0) {
        // Build an HTML unordered list of errors and inject it into the div
        msgBox.innerHTML = "<strong style='color:red;'>Please fix the following errors:</strong><ul>"
            + errors.map(e => `<li style="color:red;">${e}</li>`).join("")
            + "</ul>";
        msgBox.style.display = "block";
    } else {
        // All checks passed — show success and submit the form
        msgBox.innerHTML = "<p style='color:green;font-weight:bold;'>✔ All fields validated! Submitting registration…</p>";
        msgBox.style.display = "block";
        // Allow submission after a short delay so the user sees the message
        setTimeout(() => event.target.submit(), 1500);
    }
}

// ============================================================
// COMPONENT 2 — CHANGE FORMATTING (Toggle / Appear / Disappear)
// ANNOTATION: darkModeToggle() switches the entire page between light and dark
// colour schemes. It checks the boolean darkModeActive: if false it adds the
// CSS class "dark-mode" to document.body, turning backgrounds dark and text
// light; if true it removes the class, restoring the original look.
// The button label text is also updated to reflect the current state.
// This demonstrates toggling visual appearance on/off using classList.
// ============================================================

function darkModeToggle() {
    // CONTROL FLOW ANNOTATION — if/else:
    // Two mutually exclusive states (dark ON / dark OFF) make if/else ideal here.
    if (!darkModeActive) {
        document.body.classList.add("dark-mode");
        darkModeActive = true;
        document.getElementById("dark-mode-btn").textContent = "☀ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        darkModeActive = false;
        document.getElementById("dark-mode-btn").textContent = "🌙 Dark Mode";
    }
}

// ============================================================
// COMPONENT 3 — CHANGE HTML CONTENT
// ANNOTATION: updateEventDetails() reads the currently selected event from the
// dropdown and uses innerHTML to write a descriptive paragraph into the
// #event-details div. This is a direct HTML content change via DOM manipulation.
// Type of change: innerHTML assignment — replaces the inner HTML of a selected element.
// It links to the HTML via id="event-details" on a <div> beneath the dropdown.
// ============================================================

function updateEventDetails() {
    // DOM ANNOTATION: Selecting a <div> element by ID to change its inner HTML.
    const detailBox = document.getElementById("event-details");
    const selected  = document.getElementById("event").value;

    // Lookup table (object literal) mapping event values to detail strings
    const details = {
        "tech-career-fair": "<strong>Tech Career Fair 2026</strong> — March 15, 2026 | 10:00 AM – 4:00 PM | Student Union Hall<br>Meet with leading tech companies, bring your résumé, and dress professionally. Capacity: 500 students.",
        "research-symposium": "<strong>Research Symposium 2026</strong> — March 28, 2026 | 9:00 AM – 5:00 PM | Science Building, Rooms 101–110<br>Present your research or learn from fellow students. Poster presentations, oral sessions & keynote speakers. Capacity: 300 students.",
        "spring-music": "<strong>Spring Music Festival</strong> — April 2, 2026 | 6:00 PM – 10:00 PM | Campus Green<br>Live performances from student bands and local artists. Food trucks and refreshments available. Capacity: 1 000 students."
    };

    // CONTROL FLOW ANNOTATION — if/else:
    // Check whether the selected value exists in the details object before displaying.
    if (selected && details[selected]) {
        detailBox.innerHTML = details[selected];
        detailBox.style.display = "block";
    } else {
        detailBox.innerHTML = "";
        detailBox.style.display = "none";
    }
}

// ============================================================
// COMPONENT 4 — ADD / REMOVE AN ELEMENT
// ANNOTATION: addGuestField() dynamically creates a new <input> text field
// and appends it to the #guest-names-container div. Each call adds one field
// for a guest name, up to a maximum of 3 (matching the "guests" number input).
// removeLastGuest() removes the most recently added guest field.
// This demonstrates adding and removing DOM elements at runtime.
// ============================================================

function addGuestField() {
    const container = document.getElementById("guest-names-container");
    // Count existing guest inputs to enforce the maximum
    const currentCount = container.querySelectorAll(".guest-input").length;

    if (currentCount >= 3) {
        alert("Maximum of 3 guest names allowed.");
        return;
    }

    // Create a new <p> wrapper, a <label>, and an <input> element
    const wrapper = document.createElement("p");         // creates <p>
    wrapper.classList.add("guest-input");                 // marks it for selection

    const label = document.createElement("label");
    label.textContent = `Guest ${currentCount + 1} Name: `;

    const input = document.createElement("input");       // creates <input>
    input.type = "text";
    input.name = `guest${currentCount + 1}`;
    input.placeholder = "Enter guest's full name";
    input.size = 30;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);                      // ADDS element to DOM
}

function removeLastGuest() {
    const container = document.getElementById("guest-names-container");
    const guests    = container.querySelectorAll(".guest-input");
    if (guests.length > 0) {
        container.removeChild(guests[guests.length - 1]); // REMOVES element from DOM
    } else {
        alert("No guest fields to remove.");
    }
}

// ============================================================
// COMPONENT 5 — ACTION WHEN TYPING OR SUBMIT IS HIT
// ANNOTATION: Two event-driven actions:
//   (a) liveCharCount() fires on every keystroke in the comments textarea.
//       It reads the current value length and updates the #char-count span in real-time,
//       warning the user when approaching a 250-character limit.
//   (b) The form submit event is handled by validateForm() (see Component 1).
//       Both use addEventListener to attach handlers to DOM elements.
// ============================================================

function liveCharCount() {
    const textarea = document.getElementById("comments");
    const counter  = document.getElementById("char-count");
    charCount      = textarea.value.length;   // update the module-level variable
    const limit    = 250;

    // Change colour based on how close the user is to the limit
    if (charCount > limit) {
        counter.style.color = "red";
        counter.textContent = `${charCount}/${limit} characters — limit exceeded!`;
    } else if (charCount > limit * 0.8) {
        counter.style.color = "orange";
        counter.textContent = `${charCount}/${limit} characters`;
    } else {
        counter.style.color = "#333";
        counter.textContent = `${charCount}/${limit} characters`;
    }
}

// ============================================================
// COMPONENT 6 — SECRET SECTION ACCESSIBLE BY PASSWORD
// ANNOTATION: checkAdminPassword() reads a password input field value and
// compares it to the SECRET_PASSWORD constant using strict equality (===).
// If they match, the hidden #admin-panel div (display:none by default) is
// made visible by setting its style.display to "block".
// If wrong, an error message is shown and the input is cleared.
// PASSWORD FOR SUBMISSION: CampusAdmin2026
// ============================================================

function checkAdminPassword() {
    const entered = document.getElementById("admin-password-input").value;
    const panel   = document.getElementById("admin-panel");
    const errMsg  = document.getElementById("password-error");

    // CONTROL FLOW ANNOTATION — if/else:
    // Two exclusive outcomes (correct / wrong) — if/else is the appropriate structure.
    if (entered === SECRET_PASSWORD) {
        panel.style.display   = "block";     // reveal the hidden section
        errMsg.textContent    = "";
        document.getElementById("admin-password-input").value = "";
    } else {
        errMsg.textContent    = "Incorrect password. Please try again.";
        errMsg.style.color    = "red";
        document.getElementById("admin-password-input").value = "";
    }
}

// ============================================================
// COMPONENT 7a — LIVE EVENT SEARCH / FILTER (Extra Component #1)
// ANNOTATION: filterEvents() reads text typed into the #search-box input on
// index.html and hides any table row in #events-table whose text does NOT
// include the search term (case-insensitive). This demonstrates real-time
// DOM manipulation triggered by the 'input' event on a text box.
// ============================================================

function filterEvents() {
    // DOM ANNOTATION: querySelectorAll returns a NodeList of <tr> elements.
    // It links to the HTML via the id="events-table" on the <tbody> element.
    const query = document.getElementById("search-box").value.toLowerCase();
    const rows  = document.querySelectorAll("#events-table tbody tr");

    // CONTROL FLOW ANNOTATION — for...of loop:
    // Iterates over every table row to decide whether to show or hide it.
    // A for loop (rather than if/else) is used because we need to act on
    // a collection of unknown size — one iteration per row.
    for (const row of rows) {
        const text = row.textContent.toLowerCase();
        // Show the row if it contains the search query; hide it otherwise
        row.style.display = text.includes(query) ? "" : "none";
    }
}

// ============================================================
// COMPONENT 7b — LIVE COUNTDOWN TIMER (Extra Component #2)
// ANNOTATION: startCountdown() calculates the time remaining until the
// next upcoming event (Tech Career Fair, March 15 2026) and displays a
// live countdown in the #countdown-display span on index.html.
// setInterval fires the inner function every 1000 ms (1 second),
// updating the DOM each tick. This demonstrates interval-based DOM updates.
// ============================================================

function startCountdown() {
    const targetDate = new Date("2026-03-15T10:00:00");
    const display    = document.getElementById("countdown-display");

    // Return early if the element doesn't exist on this page
    if (!display) { return; }

    // CONTROL FLOW ANNOTATION — setInterval with if/else inside:
    // setInterval repeatedly executes a callback until clearInterval is called.
    // The if/else inside checks whether the event has already passed.
    const intervalId = setInterval(() => {
        const now  = new Date();
        const diff = targetDate - now;   // milliseconds remaining

        if (diff <= 0) {
            // Event has started or passed
            display.textContent = "🎉 The Tech Career Fair is happening NOW!";
            clearInterval(intervalId);
        } else {
            // Calculate days, hours, minutes, seconds
            const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            display.textContent =
                `⏳ Tech Career Fair starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// ============================================================
// EVENT LISTENERS
// ANNOTATION: addEventListener attaches callback functions to DOM elements
// so they fire when a specified event occurs (e.g. 'click', 'input', 'submit').
// DOMContentLoaded ensures the HTML is fully parsed before our code runs,
// preventing "element not found" errors.
//
// DOM SELECTION TYPES USED:
//   - getElementById()     → selects ONE element by its unique id attribute
//   - querySelector()      → selects the FIRST element matching a CSS selector
//   - querySelectorAll()   → selects ALL elements matching a CSS selector (NodeList)
//
// Each getElementById / querySelector call links JS to HTML via the matching
// id="..." or class="..." attribute on the target HTML element.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ----- form.html listeners -----
    const registrationForm = document.getElementById("registration-form");
    if (registrationForm) {
        // COMPONENT 1 & 5: Submit event → run validation
        registrationForm.addEventListener("submit", validateForm);
    }

    const commentsBox = document.getElementById("comments");
    if (commentsBox) {
        // COMPONENT 5: keyup fires after each keystroke in the textarea
        commentsBox.addEventListener("keyup", liveCharCount);
    }

    const eventDropdown = document.getElementById("event");
    if (eventDropdown) {
        // COMPONENT 3: change event on the <select> fires when the user picks an option
        eventDropdown.addEventListener("change", updateEventDetails);
    }

    // ----- index.html listeners -----
    const searchBox = document.getElementById("search-box");
    if (searchBox) {
        // COMPONENT 7a: input event fires on every keystroke in the search field
        searchBox.addEventListener("input", filterEvents);
    }

    const darkBtn = document.getElementById("dark-mode-btn");
    if (darkBtn) {
        // COMPONENT 2: click event on the dark-mode toggle button
        darkBtn.addEventListener("click", darkModeToggle);
    }

    const addGuestBtn = document.getElementById("add-guest-btn");
    if (addGuestBtn) {
        // COMPONENT 4: click to add a guest input field
        addGuestBtn.addEventListener("click", addGuestField);
    }

    const removeGuestBtn = document.getElementById("remove-guest-btn");
    if (removeGuestBtn) {
        // COMPONENT 4: click to remove the last guest input field
        removeGuestBtn.addEventListener("click", removeLastGuest);
    }

    const adminBtn = document.getElementById("admin-login-btn");
    if (adminBtn) {
        // COMPONENT 6: click to check the admin password
        adminBtn.addEventListener("click", checkAdminPassword);
    }

    // Allow Enter key in password field to trigger login
    const adminInput = document.getElementById("admin-password-input");
    if (adminInput) {
        adminInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") { checkAdminPassword(); }
        });
    }

    // COMPONENT 7b: start the countdown timer on page load
    startCountdown();
});
