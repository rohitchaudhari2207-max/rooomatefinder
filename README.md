# 🏠 Roommate Finder System (R. C. Patel Shirpur Edition)

> A complete, modern, responsive web application exclusively for students of **R. C. Patel Institute of Technology (RCPIT)** and **R. C. Patel Group, Shirpur** to find compatible roommates based on lifestyle, budget, Shirpur locality (Nimzari Naka, Karvand Road, etc.), food habits, sleep schedule, and study preferences.

Built specifically with pure **HTML5, CSS3, and Vanilla JavaScript** for instant, zero-configuration deployment to **GitHub Pages**.

---

## 🚀 Live Demo & GitHub Pages Deployment

This project was intentionally engineered to work seamlessly on **GitHub Pages** without requiring Node.js, Python, PHP, or any external database backend.

### How to Deploy in 3 Simple Steps:
1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Roommate Finder System (RCPIT Shirpur)"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main` / `root`
   - Click **Save**.

Your website will be live in ~60 seconds at:
`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## ✨ Features

- **🏠 Hero & Showcase**:
  - Catchy tagline: *"Find an R. C. Patel roommate who matches your lifestyle."*
  - Quick Search Bar for Shirpur Localities (**Near College, Kazi Nagar, Sandipani Colony, Sandipani Colony 2, Nimzari Naka, Karvand Road**) + Monthly Budget in ₹.
  - Live campus metrics: 800+ R. C. Patel Students, 6+ Shirpur Localities, 98% Compatibility Rate.
- **🔍 Dynamic Roommate Search & Multi-Criterion Filters**:
  - **Gender-Separated Accommodations (Male Only / Female Only)**:
    - Quick tab switcher: **🏢 All Accommodations**, **👦 Boys Rooms (Male Only)**, and **👧 Girls Rooms (Female Only)**.
    - All profiles strictly labeled as Boys Room or Girls Room.
  - **College**: R. C. Patel Institute of Technology, Shirpur.
  - **Location Filter**: Shirpur student localities including **Near College, Kazi Nagar, Sandipani Colony, Sandipani Colony 2, Nimzari Naka, Karvand Road**.
  - **Budget Filters (₹)**:
    - Below ₹3,000
    - ₹3,000 – ₹5,000
    - ₹5,000 – ₹8,000
    - Above ₹8,000
    - Interactive maximum budget range slider up to ₹15,000.
  - **Food Preference**: Vegetarian, Non-Vegetarian, Both.
  - **Sleep Schedule**: Early Sleeper, Night Owl, Flexible.
  - **Study Preference**: Quiet, Group Study, Flexible.
  - **Lifestyle Harmony**: Quiet, Social, Moderate.
  - **Live Keyword Search**: Instant searching across names, colleges, and descriptions.
  - **Sort Options**: Low to High, High to Low, Youngest, Oldest.
  - **Active Filter Pills & Reset**: Easy removal of individual filter criteria.
- **✏️ Create Profile Form**:
  - Inputs for Full Name, Age, College, Email, 10-Digit Mobile, City, Budget, Food, Sleep, Study, Habits, Bio, and Avatar.
  - Client-side validation with real-time error messages.
  - **LocalStorage Persistence**: Newly added profiles are immediately appended and persist between browser reloads without a server.
- **🔖 Bookmarking / Favorites System**:
  - Students can save/bookmark prospective roommates and filter to view only saved roommates.
- **📱 Student Modals**:
  - **Full Profile Modal**: Displays comprehensive routines, habits, and preferences.
  - **Direct Contact Modal**: Direct phone/email connection, simulated quick messaging, and one-click WhatsApp chat link.
- **🎨 Modern Aesthetic**:
  - Plus Jakarta Sans typography, sleek card shadows, badge pills, responsive mobile drawer menu, and custom toast alerts.

---

## 📁 Project Structure

```
ROOMMATE FINDER/
├── index.html          # Root main entrypoint (Strictly required for GitHub Pages)
├── css/
│   └── style.css       # Responsive design system, CSS variables, cards & modals
├── js/
│   ├── data.js         # Initial student dataset covering Pune, Nashik, Mumbai, etc.
│   └── app.js          # Reactive filtering, form validation, localStorage, modals
└── README.md           # Project documentation & presentation guide
```

---

## 💻 Local Testing

Simply double-click `index.html` in your file explorer to open it in Google Chrome, Microsoft Edge, Firefox, or Safari. Alternatively, serve via any static file server:

```bash
# Optional Python static server:
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.
