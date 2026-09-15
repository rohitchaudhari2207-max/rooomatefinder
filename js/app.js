/**
 * Roommate Finder System - Main Application Logic
 * Pure Vanilla JavaScript, fully client-side & compatible with GitHub Pages
 */

// Application State
const state = {
  profiles: [],
  filteredProfiles: [],
  bookmarkedIds: new Set(),
  selectedAvatar: "👨‍🎓",
  selectedInboxProfileId: null,
  inboxMessages: [],
  filters: {
    location: "all",
    gender: "all",
    budgetRange: "all",
    maxBudget: 15000,
    food: "all",
    sleep: "all",
    study: "all",
    lifestyle: "all",
    search: "",
    sortBy: "default",
    onlySaved: false
  }
};

// Storage Keys
const STORAGE_PROFILES_KEY = "roommate_finder_profiles_rcpit_v5";
const STORAGE_BOOKMARKS_KEY = "roommate_finder_bookmarks_v1";
const STORAGE_MESSAGES_KEY = "roommate_finder_messages_v1";

let isBackendActive = false;
let currentContactProfileId = null;

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initAvatarSelector();
  initEventListeners();
  initRentCalculator();
  await checkBackendAndInit();
});

async function checkBackendAndInit() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        isBackendActive = true;
        console.log("Connected to live Roommate Finder SQLite Backend API.");
        await loadFromBackend();
        return;
      }
    }
  } catch (e) {
    console.log("Running in offline / static mode.");
  }
  initStorage();
  applyFilters();
  updateBookmarkBadge();
  updateInboxBadge();
}

async function loadFromBackend() {
  try {
    const [profilesRes, bookmarksRes, statsRes] = await Promise.all([
      fetch('/api/profiles'),
      fetch('/api/bookmarks'),
      fetch('/api/stats')
    ]);

    if (profilesRes.ok) {
      state.profiles = await profilesRes.json();
    } else {
      initStorage();
    }

    if (bookmarksRes.ok) {
      const bks = await bookmarksRes.json();
      state.bookmarkedIds = new Set(bks);
    }

    if (statsRes.ok) {
      const stats = await statsRes.json();
      updateCampusStats(stats);
    }
  } catch (err) {
    console.error("Backend fetch error, reverting to local data:", err);
    initStorage();
  }
  applyFilters();
  updateBookmarkBadge();
  updateInboxBadge();
}

function updateCampusStats(stats) {
  if (!stats) return;
  const statCards = document.querySelectorAll('.hero-stats .stat-card');
  if (statCards && statCards.length >= 3) {
    const totalEl = statCards[0].querySelector('.stat-number');
    if (totalEl) totalEl.innerHTML = `${stats.totalProfiles || 12}<span>+</span>`;
  }
}

function initStorage() {
  // Load profiles from LocalStorage or seed default data
  const storedProfiles = localStorage.getItem(STORAGE_PROFILES_KEY);
  if (storedProfiles) {
    try {
      state.profiles = JSON.parse(storedProfiles);
    } catch (e) {
      console.error("Failed to parse stored profiles, resetting to default.", e);
      state.profiles = [...DEFAULT_PROFILES];
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(state.profiles));
    }
  } else {
    state.profiles = [...DEFAULT_PROFILES];
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(state.profiles));
  }

  // Load bookmarks
  const storedBookmarks = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
  if (storedBookmarks) {
    try {
      const ids = JSON.parse(storedBookmarks);
      state.bookmarkedIds = new Set(ids);
    } catch (e) {
      state.bookmarkedIds = new Set();
    }
  }
}

function saveProfiles() {
  localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(state.profiles));
}

function saveBookmarks() {
  localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(Array.from(state.bookmarkedIds)));
}

// ==========================================================================
// Avatar Selector inside Create Profile
// ==========================================================================
function initAvatarSelector() {
  const container = document.getElementById("avatarSelector");
  if (!container) return;

  container.innerHTML = "";
  AVATAR_OPTIONS.forEach((emoji, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `avatar-choice ${index === 0 ? "selected" : ""}`;
    btn.textContent = emoji;
    btn.setAttribute("aria-label", `Select avatar ${emoji}`);
    btn.addEventListener("click", () => {
      document.querySelectorAll(".avatar-choice").forEach(el => el.classList.remove("selected"));
      btn.classList.add("selected");
      state.selectedAvatar = emoji;
    });
    container.appendChild(btn);
  });
}

// ==========================================================================
// Gender Filter Controller
// ==========================================================================
function setGenderFilter(val) {
  state.filters.gender = val;
  document.querySelectorAll(".gender-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-gender") === val);
  });
  const filterGender = document.getElementById("filterGender");
  if (filterGender) filterGender.value = val;
  applyFilters();
}
window.setGenderFilter = setGenderFilter;

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function initEventListeners() {
  // Mobile navigation toggle
  const mobileToggle = document.getElementById("mobileToggle");
  const navLinks = document.getElementById("navLinks");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
    // Close mobile nav when clicking a link
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("show");
      });
    });
  }

  // Quick Search in Hero section
  const heroLocation = document.getElementById("heroQuickLocation");
  const heroGender = document.getElementById("heroQuickGender");
  const heroBudget = document.getElementById("heroQuickBudget");
  const heroBtn = document.getElementById("heroQuickSearchBtn");

  if (heroBtn) {
    heroBtn.addEventListener("click", () => {
      if (heroLocation) {
        state.filters.location = heroLocation.value;
        const filterLocSelect = document.getElementById("filterLocation");
        if (filterLocSelect) filterLocSelect.value = heroLocation.value;
      }
      if (heroGender) {
        setGenderFilter(heroGender.value);
      }
      if (heroBudget) {
        state.filters.budgetRange = heroBudget.value;
        const radio = document.querySelector(`input[name="budgetRange"][value="${heroBudget.value}"]`);
        if (radio) radio.checked = true;
      }
      applyFilters();
      scrollToSection("find-roommates");
    });
  }

  // Filter: Gender dropdown
  const filterGender = document.getElementById("filterGender");
  if (filterGender) {
    filterGender.addEventListener("change", (e) => {
      setGenderFilter(e.target.value);
    });
  }

  // Filter: Location dropdown
  const filterLocation = document.getElementById("filterLocation");
  if (filterLocation) {
    filterLocation.addEventListener("change", (e) => {
      state.filters.location = e.target.value;
      applyFilters();
    });
  }

  // Filter: Budget Radios
  const budgetRadios = document.querySelectorAll('input[name="budgetRange"]');
  budgetRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.filters.budgetRange = e.target.value;
      applyFilters();
    });
  });

  // Filter: Budget Slider
  const budgetSlider = document.getElementById("budgetSlider");
  const budgetSliderVal = document.getElementById("budgetSliderVal");
  if (budgetSlider && budgetSliderVal) {
    budgetSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      state.filters.maxBudget = val;
      budgetSliderVal.textContent = `₹${val.toLocaleString("en-IN")}`;
      applyFilters();
    });
  }

  // Filter: Food Preference
  const filterFood = document.getElementById("filterFood");
  if (filterFood) {
    filterFood.addEventListener("change", (e) => {
      state.filters.food = e.target.value;
      applyFilters();
    });
  }

  // Filter: Sleep Schedule
  const filterSleep = document.getElementById("filterSleep");
  if (filterSleep) {
    filterSleep.addEventListener("change", (e) => {
      state.filters.sleep = e.target.value;
      applyFilters();
    });
  }

  // Filter: Study Preference
  const filterStudy = document.getElementById("filterStudy");
  if (filterStudy) {
    filterStudy.addEventListener("change", (e) => {
      state.filters.study = e.target.value;
      applyFilters();
    });
  }

  // Filter: Lifestyle
  const filterLifestyle = document.getElementById("filterLifestyle");
  if (filterLifestyle) {
    filterLifestyle.addEventListener("change", (e) => {
      state.filters.lifestyle = e.target.value;
      applyFilters();
    });
  }

  // Search keyword input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.filters.sortBy = e.target.value;
      applyFilters();
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", resetFilters);
  }

  // Saved / Bookmarks Tab Button in Header
  const savedNavBtn = document.getElementById("savedNavBtn");
  if (savedNavBtn) {
    savedNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      state.filters.onlySaved = !state.filters.onlySaved;
      savedNavBtn.classList.toggle("active", state.filters.onlySaved);
      applyFilters();
      scrollToSection("find-roommates");
      if (state.filters.onlySaved) {
        showToast("Showing your bookmarked roommates", "info");
      }
    });
  }

  // Inbox Nav Button
  const inboxNavBtn = document.getElementById("inboxNavBtn");
  if (inboxNavBtn) {
    inboxNavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openInboxModal();
    });
  }

  // Inbox Profile Switcher
  const inboxProfileSelect = document.getElementById("inboxProfileSelect");
  if (inboxProfileSelect) {
    inboxProfileSelect.addEventListener("change", (e) => {
      state.selectedInboxProfileId = e.target.value;
      loadInboxMessages(e.target.value);
    });
  }

  // Inbox Refresh Button
  const refreshInboxBtn = document.getElementById("refreshInboxBtn");
  if (refreshInboxBtn) {
    refreshInboxBtn.addEventListener("click", () => {
      if (state.selectedInboxProfileId) {
        loadInboxMessages(state.selectedInboxProfileId);
        showToast("Inbox refreshed 🔄", "info");
      }
    });
  }

  // Profile Creation Form Submit
  const createForm = document.getElementById("createProfileForm");
  if (createForm) {
    createForm.addEventListener("submit", handleCreateProfile);
  }

  // Modals close button & backdrop click
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });

  // Contact modal simulated submit form
  const contactForm = document.getElementById("directMessageForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleSendMessage);
  }
}

// ==========================================================================
// Filtering & Sorting Core Engine
// ==========================================================================
function applyFilters() {
  const { location, gender, budgetRange, maxBudget, food, sleep, study, lifestyle, search, sortBy, onlySaved } = state.filters;

  state.filteredProfiles = state.profiles.filter(p => {
    // Bookmark filter
    if (onlySaved && !state.bookmarkedIds.has(p.id)) {
      return false;
    }

    // Gender Separation (Strictly separate Boys vs Girls accommodations)
    if (gender && gender !== "all") {
      if (p.gender && p.gender.toLowerCase() !== gender.toLowerCase()) {
        return false;
      }
    }

    // Location (supports Near College, Kazi Nagar, Sandipani Colony, Sandipani Colony 2, Nimzari Naka)
    if (location !== "all") {
      const locFilter = location.toLowerCase().replace(/[\s,_-]+/g, "").replace("shirpur", "");
      const profLoc = p.location.toLowerCase().replace(/[\s,_-]+/g, "");

      if (!profLoc.includes(locFilter)) {
        return false;
      }
    }

    // Budget slider max cap
    if (p.monthlyBudget > maxBudget) {
      return false;
    }

    // Budget Preset Brackets
    if (budgetRange !== "all") {
      if (budgetRange === "below3k" && p.monthlyBudget >= 3000) return false;
      if (budgetRange === "3kto5k" && (p.monthlyBudget < 3000 || p.monthlyBudget > 5000)) return false;
      if (budgetRange === "5kto8k" && (p.monthlyBudget < 5000 || p.monthlyBudget > 8000)) return false;
      if (budgetRange === "above8k" && p.monthlyBudget <= 8000) return false;
    }

    // Food Preference
    if (food !== "all" && p.foodPreference.toLowerCase() !== food.toLowerCase()) {
      return false;
    }

    // Sleep Schedule
    if (sleep !== "all" && p.sleepSchedule.toLowerCase() !== sleep.toLowerCase()) {
      return false;
    }

    // Study Preference
    if (study !== "all" && p.studyPreference.toLowerCase() !== study.toLowerCase()) {
      return false;
    }

    // Lifestyle
    if (lifestyle !== "all" && p.lifestyle.toLowerCase() !== lifestyle.toLowerCase()) {
      return false;
    }

    // Keyword search (matches name, college, location, about)
    if (search) {
      const targetStr = `${p.name} ${p.college} ${p.location} ${p.about} ${(p.habits || []).join(" ")}`.toLowerCase();
      if (!targetStr.includes(search)) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  if (sortBy === "budget-low") {
    state.filteredProfiles.sort((a, b) => a.monthlyBudget - b.monthlyBudget);
  } else if (sortBy === "budget-high") {
    state.filteredProfiles.sort((a, b) => b.monthlyBudget - a.monthlyBudget);
  } else if (sortBy === "age-young") {
    state.filteredProfiles.sort((a, b) => a.age - b.age);
  } else if (sortBy === "age-old") {
    state.filteredProfiles.sort((a, b) => b.age - a.age);
  }

  renderProfilesGrid();
  renderActiveFilterPills();
  updateResultCount();
}

function resetFilters() {
  state.filters = {
    location: "all",
    gender: "all",
    budgetRange: "all",
    maxBudget: 15000,
    food: "all",
    sleep: "all",
    study: "all",
    lifestyle: "all",
    search: "",
    sortBy: "default",
    onlySaved: false
  };

  // Reset gender tab buttons
  document.querySelectorAll(".gender-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-gender") === "all");
  });
  const filterGender = document.getElementById("filterGender");
  if (filterGender) filterGender.value = "all";

  // Reset form inputs
  const filterLoc = document.getElementById("filterLocation");
  if (filterLoc) filterLoc.value = "all";

  const allBudgetRadio = document.querySelector('input[name="budgetRange"][value="all"]');
  if (allBudgetRadio) allBudgetRadio.checked = true;

  const budgetSlider = document.getElementById("budgetSlider");
  const budgetSliderVal = document.getElementById("budgetSliderVal");
  if (budgetSlider && budgetSliderVal) {
    budgetSlider.value = 15000;
    budgetSliderVal.textContent = "₹15,000";
  }

  const filterFood = document.getElementById("filterFood");
  if (filterFood) filterFood.value = "all";

  const filterSleep = document.getElementById("filterSleep");
  if (filterSleep) filterSleep.value = "all";

  const filterStudy = document.getElementById("filterStudy");
  if (filterStudy) filterStudy.value = "all";

  const filterLifestyle = document.getElementById("filterLifestyle");
  if (filterLifestyle) filterLifestyle.value = "all";

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = "default";

  const savedNavBtn = document.getElementById("savedNavBtn");
  if (savedNavBtn) savedNavBtn.classList.remove("active");

  applyFilters();
  showToast("All filters have been reset", "info");
}

// ==========================================================================
// Rendering Profiles Grid
// ==========================================================================
function renderProfilesGrid() {
  const container = document.getElementById("roommatesGrid");
  if (!container) return;

  if (state.filteredProfiles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No matching roommates found</h3>
        <p>Try widening your search filters, adjusting budget limits, or clearing selected lifestyle options.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.filteredProfiles.map(p => {
    const isBookmarked = state.bookmarkedIds.has(p.id);
    const foodClass = p.foodPreference.toLowerCase() === "vegetarian" ? "tag-veg" 
                    : p.foodPreference.toLowerCase() === "non-vegetarian" ? "tag-nonveg" : "tag-both";
    const isMale = p.gender && p.gender.toLowerCase() === "male";
    const genderBadge = isMale
      ? `<span class="tag-badge tag-gender-boy">👦 Boys Room (Male)</span>`
      : `<span class="tag-badge tag-gender-girl">👧 Girls Room (Female)</span>`;

    return `
      <article class="profile-card" data-id="${p.id}">
        <div class="profile-card-header">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar">${p.avatar || "👨‍🎓"}</div>
            <span class="profile-status-dot" title="Active Student"></span>
          </div>
          <div class="profile-header-actions">
            <button class="btn-bookmark ${isBookmarked ? "active" : ""}" 
                    onclick="toggleBookmark('${p.id}')" 
                    title="${isBookmarked ? "Remove from bookmarks" : "Save roommate"}"
                    aria-label="Bookmark profile">
              <svg width="18" height="18" fill="${isBookmarked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="profile-card-body">
          <div class="profile-name-row">
            <h3 class="profile-name">${escapeHtml(p.name)}</h3>
            <span class="profile-age">${p.age} yrs</span>
          </div>

          <div class="profile-college" title="${escapeHtml(p.college)}">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
            </svg>
            <span>${escapeHtml(p.college)}</span>
          </div>

          <div class="profile-location">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(p.location)}</span>
          </div>

          <div class="profile-budget-tag">
            <span>Budget:</span>
            <span class="rupee-amount">₹${p.monthlyBudget.toLocaleString("en-IN")}</span>
            <span style="font-size:0.75rem; color:var(--text-muted)">/ month</span>
          </div>

          <div class="profile-tags">
            ${genderBadge}
            <span class="tag-badge ${foodClass}">🍽️ ${p.foodPreference}</span>
            <span class="tag-badge tag-sleep">🌙 ${p.sleepSchedule}</span>
            <span class="tag-badge tag-study">📚 ${p.studyPreference}</span>
            <span class="tag-badge tag-lifestyle">🤝 ${p.lifestyle}</span>
          </div>

          <p class="profile-bio-snippet">${escapeHtml(p.about)}</p>
        </div>

        <div class="profile-card-footer">
          <button class="btn btn-secondary btn-sm" onclick="openProfileModal('${p.id}')">
            View Profile
          </button>
          <button class="btn btn-primary btn-sm" onclick="openContactModal('${p.id}')">
            Contact
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function updateResultCount() {
  const el = document.getElementById("resultsCount");
  if (!el) return;
  const total = state.filteredProfiles.length;
  el.innerHTML = `Showing <span>${total}</span> ${total === 1 ? "roommate" : "roommates"}`;
}

function renderActiveFilterPills() {
  const container = document.getElementById("activeFiltersBar");
  if (!container) return;

  const pills = [];
  const { location, gender, budgetRange, maxBudget, food, sleep, study, lifestyle, search, onlySaved } = state.filters;

  if (onlySaved) {
    pills.push({ label: "Bookmarked Only", remove: () => { state.filters.onlySaved = false; } });
  }

  if (gender && gender !== "all") {
    pills.push({
      label: `Room: ${gender === 'Male' ? '👦 Boys Only' : '👧 Girls Only'}`,
      remove: () => { setGenderFilter("all"); }
    });
  }

  if (location !== "all") {
    pills.push({ label: `Location: ${location}`, remove: () => { state.filters.location = "all"; document.getElementById("filterLocation").value = "all"; } });
  }

  if (budgetRange !== "all") {
    const map = {
      below3k: "Below ₹3,000",
      "3kto5k": "₹3,000–₹5,000",
      "5kto8k": "₹5,000–₹8,000",
      above8k: "Above ₹8,000"
    };
    pills.push({ label: `Budget: ${map[budgetRange] || budgetRange}`, remove: () => { 
      state.filters.budgetRange = "all"; 
      document.querySelector('input[name="budgetRange"][value="all"]').checked = true;
    } });
  }

  if (maxBudget < 15000) {
    pills.push({ label: `Max: ₹${maxBudget.toLocaleString("en-IN")}`, remove: () => { 
      state.filters.maxBudget = 15000; 
      document.getElementById("budgetSlider").value = 15000;
      document.getElementById("budgetSliderVal").textContent = "₹15,000";
    } });
  }

  if (food !== "all") {
    pills.push({ label: `Food: ${food}`, remove: () => { state.filters.food = "all"; document.getElementById("filterFood").value = "all"; } });
  }

  if (sleep !== "all") {
    pills.push({ label: `Sleep: ${sleep}`, remove: () => { state.filters.sleep = "all"; document.getElementById("filterSleep").value = "all"; } });
  }

  if (study !== "all") {
    pills.push({ label: `Study: ${study}`, remove: () => { state.filters.study = "all"; document.getElementById("filterStudy").value = "all"; } });
  }

  if (lifestyle !== "all") {
    pills.push({ label: `Lifestyle: ${lifestyle}`, remove: () => { state.filters.lifestyle = "all"; document.getElementById("filterLifestyle").value = "all"; } });
  }

  if (search) {
    pills.push({ label: `"${search}"`, remove: () => { state.filters.search = ""; document.getElementById("searchInput").value = ""; } });
  }

  if (pills.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = pills.map((p, idx) => `
    <div class="filter-pill">
      <span>${escapeHtml(p.label)}</span>
      <span class="filter-pill-remove" onclick="removePill(${idx})" title="Remove filter">&times;</span>
    </div>
  `).join("");

  window._activePills = pills;
}

window.removePill = function(index) {
  if (window._activePills && window._activePills[index]) {
    window._activePills[index].remove();
    applyFilters();
  }
};

// ==========================================================================
// Bookmarks / Saved System
// ==========================================================================
window.toggleBookmark = async function(id) {
  if (state.bookmarkedIds.has(id)) {
    state.bookmarkedIds.delete(id);
    showToast("Removed from saved roommates", "info");
  } else {
    state.bookmarkedIds.add(id);
    showToast("Added to saved roommates!", "success");
  }
  saveBookmarks();
  updateBookmarkBadge();
  applyFilters();

  if (isBackendActive) {
    try {
      await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: id })
      });
    } catch (e) {
      console.error("Backend bookmark toggle error:", e);
    }
  }
};

function updateBookmarkBadge() {
  const badge = document.getElementById("savedBadgeCount");
  if (badge) {
    badge.textContent = state.bookmarkedIds.size;
    badge.style.display = state.bookmarkedIds.size > 0 ? "inline-block" : "none";
  }
}

// ==========================================================================
// Create Profile Logic & Real-time Validation
// ==========================================================================
async function handleCreateProfile(e) {
  e.preventDefault();

  // Clear existing errors
  document.querySelectorAll(".form-error-msg").forEach(el => el.textContent = "");
  document.querySelectorAll(".form-control").forEach(el => el.classList.remove("error"));

  const form = e.target;
  const name = form.fullName.value.trim();
  const age = parseInt(form.age.value, 10);
  const gender = form.gender.value;
  const college = form.college.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const location = form.location.value;
  const monthlyBudget = parseInt(form.monthlyBudget.value, 10);
  const foodPreference = form.foodPreference.value;
  const sleepSchedule = form.sleepSchedule.value;
  const studyPreference = form.studyPreference.value;
  const lifestyle = form.lifestyle.value;
  const habitsInput = form.habits.value.trim();
  const about = form.about.value.trim();

  let hasError = false;

  // Validate Name
  if (!name || name.length < 2) {
    showFieldError("nameError", "fullName", "Please enter your full name (at least 2 characters).");
    hasError = true;
  }

  // Validate Age
  if (isNaN(age) || age < 16 || age > 40) {
    showFieldError("ageError", "age", "Please enter a valid age between 16 and 40.");
    hasError = true;
  }

  // Validate College
  if (!college || college.length < 3) {
    showFieldError("collegeError", "college", "Please enter your college or institute name.");
    hasError = true;
  }

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showFieldError("emailError", "email", "Please provide a valid college or personal email address.");
    hasError = true;
  }

  // Validate Phone (10 digits Indian format)
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.length < 10) {
    showFieldError("phoneError", "phone", "Please enter a valid 10-digit mobile number.");
    hasError = true;
  }

  // Validate Location
  if (!location) {
    showFieldError("locationError", "location", "Please select your city/location.");
    hasError = true;
  }

  // Validate Budget
  if (isNaN(monthlyBudget) || monthlyBudget < 1000 || monthlyBudget > 50000) {
    showFieldError("budgetError", "monthlyBudget", "Please enter a realistic monthly budget between ₹1,000 and ₹50,000.");
    hasError = true;
  }

  // Validate About Me
  if (!about || about.length < 20) {
    showFieldError("aboutError", "about", "Please write a short bio (at least 20 characters) so roommates get to know you.");
    hasError = true;
  }

  if (hasError) {
    showToast("Please fill in all required fields accurately.", "error");
    return;
  }

  // Process habits
  const habits = habitsInput ? habitsInput.split(",").map(h => h.trim()).filter(h => h.length > 0) : ["Non-Smoker", "Friendly"];

  // Construct new Profile Object
  const newProfile = {
    id: `rcp-custom-${Date.now()}`,
    name,
    age,
    gender,
    avatar: state.selectedAvatar || "👨‍🎓",
    college,
    location,
    monthlyBudget,
    foodPreference,
    sleepSchedule,
    studyPreference,
    lifestyle,
    habits,
    phone: `+91 ${cleanPhone.slice(-10)}`,
    email,
    about,
    moveInDate: "Immediate",
    roomType: gender === "Female" ? "Girls Shared Room (Female Only)" : "Boys Shared Room (Male Only)"
  };

  // Persist to Backend API if active, with fallback to local state
  if (isBackendActive) {
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        const json = await res.json();
        state.profiles.unshift(json.profile || newProfile);
      } else {
        state.profiles.unshift(newProfile);
      }
    } catch (err) {
      console.error("Backend error creating profile:", err);
      state.profiles.unshift(newProfile);
    }
  } else {
    state.profiles.unshift(newProfile);
  }
  saveProfiles();

  // Reset form
  form.reset();

  // Refresh filters and grid
  applyFilters();

  // Success alert
  showToast("Your roommate profile has been created successfully! 🎉", "success");

  // Scroll smoothly to the newly created profile
  setTimeout(() => {
    scrollToSection("find-roommates");
    const newCard = document.querySelector(`[data-id="${newProfile.id}"]`);
    if (newCard) {
      newCard.style.outline = "3px solid var(--primary)";
      newCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { newCard.style.outline = "none"; }, 3000);
    }
  }, 400);
}

function showFieldError(errorId, inputName, message) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.querySelector(`[name="${inputName}"]`);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add("error");
}

// ==========================================================================
// Modals Handling
// ==========================================================================
window.openProfileModal = function(id) {
  const profile = state.profiles.find(p => p.id === id);
  if (!profile) return;

  const modal = document.getElementById("profileModal");
  const modalBody = document.getElementById("profileModalBody");
  if (!modal || !modalBody) return;

  const foodClass = profile.foodPreference.toLowerCase() === "vegetarian" ? "tag-veg" 
                  : profile.foodPreference.toLowerCase() === "non-vegetarian" ? "tag-nonveg" : "tag-both";

  modalBody.innerHTML = `
    <div class="modal-detail-hero">
      <div class="modal-avatar-lg">${profile.avatar || "👨‍🎓"}</div>
      <div class="modal-detail-info">
        <h3>${escapeHtml(profile.name)}, ${profile.age}</h3>
        <div class="college">${escapeHtml(profile.college)}</div>
        <div class="location">📍 ${escapeHtml(profile.location)} &bull; ${escapeHtml(profile.gender || "Student")}</div>
      </div>
    </div>

    <div class="modal-details-grid">
      <div class="modal-detail-item">
        <span class="label">Room Accommodation</span>
        <span class="value" style="font-weight:700; color:${profile.gender === 'Female' ? '#be185d' : '#0369a1'}">
          ${profile.gender === "Female" ? "👧 Girls Room (Female Only)" : "👦 Boys Room (Male Only)"}
        </span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Monthly Budget</span>
        <span class="value" style="color:var(--primary); font-size:1.15rem;">₹${profile.monthlyBudget.toLocaleString("en-IN")}</span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Move-in Date</span>
        <span class="value">${escapeHtml(profile.moveInDate || "Immediate")}</span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Food Preference</span>
        <span class="value"><span class="tag-badge ${foodClass}">🍽️ ${profile.foodPreference}</span></span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Sleep Schedule</span>
        <span class="value">🌙 ${profile.sleepSchedule}</span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Study Style</span>
        <span class="value">📚 ${profile.studyPreference}</span>
      </div>
      <div class="modal-detail-item">
        <span class="label">Lifestyle</span>
        <span class="value">🤝 ${profile.lifestyle}</span>
      </div>
    </div>

    <div class="modal-about-section">
      <h4>About Me</h4>
      <p>${escapeHtml(profile.about)}</p>
    </div>

    <div class="modal-about-section">
      <h4>Lifestyle & Habits</h4>
      <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.35rem;">
        ${(profile.habits || ["Friendly", "Non-Smoker"]).map(h => `<span class="tag-badge tag-lifestyle">✨ ${escapeHtml(h)}</span>`).join("")}
      </div>
    </div>
  `;

  // Update contact button inside footer
  const contactBtn = document.getElementById("profileModalContactBtn");
  if (contactBtn) {
    contactBtn.onclick = () => {
      closeAllModals();
      openContactModal(profile.id);
    };
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
};

window.openContactModal = function(id) {
  const profile = state.profiles.find(p => p.id === id);
  if (!profile) return;

  currentContactProfileId = id;

  const modal = document.getElementById("contactModal");
  const modalTargetName = document.getElementById("contactModalTargetName");
  const modalPhoneDisplay = document.getElementById("contactPhoneDisplay");
  const modalEmailDisplay = document.getElementById("contactEmailDisplay");
  const waBtn = document.getElementById("contactWhatsAppBtn");

  if (modalTargetName) modalTargetName.textContent = profile.name;
  if (modalPhoneDisplay) modalPhoneDisplay.textContent = profile.phone;
  if (modalEmailDisplay) modalEmailDisplay.textContent = profile.email;

  // WhatsApp simulation URL
  if (waBtn) {
    const rawNumber = profile.phone.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(`Hi ${profile.name}, I saw your roommate profile on Roommate Finder and would like to connect!`);
    waBtn.href = `https://wa.me/${rawNumber}?text=${waText}`;
  }

  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

async function handleSendMessage(e) {
  e.preventDefault();
  const nameInput = document.getElementById("contactSenderName");
  const contactInput = document.getElementById("contactSenderContact");
  const messageInput = document.getElementById("contactMessageInput");

  if (!messageInput || !messageInput.value.trim()) {
    showToast("Please enter a short message first.", "error");
    return;
  }

  const senderName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Anonymous Student";
  const senderContact = contactInput && contactInput.value.trim() ? contactInput.value.trim() : "";
  const messageText = messageInput.value.trim();
  const targetId = currentContactProfileId;

  // If backend is active, persist message to SQLite
  if (isBackendActive && targetId) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: targetId,
          senderName: senderName,
          senderContact: senderContact,
          message: messageText
        })
      });
    } catch (err) {
      console.error("Backend error sending message:", err);
    }
  } else if (targetId) {
    // LocalStorage fallback for offline / GitHub Pages mode
    const stored = getLocalMessages();
    stored.unshift({
      id: Date.now(),
      profile_id: targetId,
      profileId: targetId,
      sender_name: senderName,
      senderName: senderName,
      sender_contact: senderContact,
      senderContact: senderContact,
      message: messageText,
      created_at: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(stored));
  }

  closeAllModals();
  showToast("Message sent to roommate! They will reply soon. 🚀", "success");
  if (nameInput) nameInput.value = "";
  if (contactInput) contactInput.value = "";
  messageInput.value = "";
  updateInboxBadge();
}

// ==========================================================================
// Roommate Inbox Controller
// ==========================================================================
function getLocalMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function updateInboxBadge() {
  const badge = document.getElementById("inboxBadgeCount");
  if (!badge) return;

  let totalCount = 0;
  if (isBackendActive) {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const msgs = await res.json();
        totalCount = Array.isArray(msgs) ? msgs.length : 0;
      }
    } catch (e) {
      totalCount = getLocalMessages().length;
    }
  } else {
    totalCount = getLocalMessages().length;
  }

  if (totalCount > 0) {
    badge.textContent = totalCount > 99 ? "99+" : totalCount;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

window.openInboxModal = async function(preferredProfileId = null) {
  const modal = document.getElementById("inboxModal");
  const select = document.getElementById("inboxProfileSelect");
  if (!modal || !select) return;

  // Populate profiles in dropdown
  select.innerHTML = "";
  if (!state.profiles || state.profiles.length === 0) {
    select.innerHTML = `<option value="">No profiles available</option>`;
    state.selectedInboxProfileId = null;
  } else {
    state.profiles.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.avatar || '👤'} ${p.name} (${p.gender === 'Female' ? 'Girls Room' : 'Boys Room'})`;
      select.appendChild(opt);
    });

    const targetId = preferredProfileId || state.selectedInboxProfileId || state.profiles[0].id;
    select.value = targetId;
    state.selectedInboxProfileId = targetId;
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  if (state.selectedInboxProfileId) {
    await loadInboxMessages(state.selectedInboxProfileId);
  } else {
    renderInboxMessages([]);
  }
};

async function loadInboxMessages(profileId) {
  if (!profileId) {
    renderInboxMessages([]);
    return;
  }

  let messages = [];
  if (isBackendActive) {
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(profileId)}`);
      if (res.ok) {
        messages = await res.json();
      }
    } catch (e) {
      console.error("Error loading messages from backend:", e);
      messages = getLocalMessages().filter(m => (m.profile_id || m.profileId) === profileId);
    }
  } else {
    messages = getLocalMessages().filter(m => (m.profile_id || m.profileId) === profileId);
  }

  state.inboxMessages = messages;
  renderInboxMessages(messages);
  updateInboxBadge();
}

function renderInboxMessages(messages) {
  const listEl = document.getElementById("inboxMessageList");
  const emptyEl = document.getElementById("inboxEmptyState");
  const countEl = document.getElementById("inboxCountSummary");
  if (!listEl || !emptyEl) return;

  if (!messages || messages.length === 0) {
    listEl.innerHTML = "";
    listEl.style.display = "none";
    emptyEl.style.display = "block";
    if (countEl) countEl.textContent = "0 inquiries";
    return;
  }

  emptyEl.style.display = "none";
  listEl.style.display = "flex";
  if (countEl) countEl.textContent = `${messages.length} ${messages.length === 1 ? 'inquiry' : 'inquiries'}`;

  listEl.innerHTML = messages.map(msg => {
    const sender = escapeHtml(msg.sender_name || msg.senderName || "Anonymous Student");
    const contact = escapeHtml(msg.sender_contact || msg.senderContact || "");
    const dateStr = formatMessageDate(msg.created_at || msg.createdAt);
    const text = escapeHtml(msg.message || "");
    const id = msg.id;

    // Direct reply actions
    let contactBtnHtml = "";
    if (contact) {
      const cleanPhone = contact.replace(/[^0-9]/g, "");
      if (cleanPhone.length >= 10) {
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi! Thanks for reaching out about flat accommodation on Roommate Finder.")}`;
        contactBtnHtml += `
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="inbox-action-btn inbox-btn-whatsapp">
            💬 WhatsApp
          </a>
          <a href="tel:${cleanPhone}" class="inbox-action-btn inbox-btn-phone">
            📞 Call
          </a>
        `;
      } else if (contact.includes("@")) {
        contactBtnHtml += `
          <a href="mailto:${contact}?subject=Roommate%20Inquiry%20Response" class="inbox-action-btn inbox-btn-phone">
            ✉️ Email
          </a>
        `;
      }
    }

    return `
      <div class="inbox-msg-card is-new" id="inbox-msg-${id}">
        <div class="inbox-msg-top">
          <div class="inbox-msg-sender-info">
            <div class="inbox-msg-sender-name">
              <span>👤</span> ${sender}
            </div>
            ${contact 
              ? `<span class="inbox-msg-contact-badge">📞 ${contact}</span>` 
              : `<span class="inbox-msg-contact-badge" style="background:#f1f5f9; color:#64748b;">No contact provided</span>`}
          </div>
          <div class="inbox-msg-meta">
            <span>🕒 ${dateStr}</span>
          </div>
        </div>
        <div class="inbox-msg-content">
          ${text}
        </div>
        <div class="inbox-msg-actions">
          <div class="inbox-msg-actions-left">
            ${contactBtnHtml}
          </div>
          <button type="button" class="inbox-btn-delete" onclick="deleteInboxMessage(${id})" title="Delete this inquiry">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.deleteInboxMessage = async function(id) {
  if (!confirm("Are you sure you want to delete this inquiry?")) return;

  if (isBackendActive) {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast("Could not delete message on server", "error");
        return;
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  } else {
    const msgs = getLocalMessages().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(msgs));
  }

  showToast("Inquiry deleted successfully", "info");
  if (state.selectedInboxProfileId) {
    await loadInboxMessages(state.selectedInboxProfileId);
  }
  updateInboxBadge();
};

function formatMessageDate(dateInput) {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ==========================================================================
// Toast Notifications
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;
  
  const icon = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// Helper Utilities
// ==========================================================================
function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================================================
// Rent & Expense Split Calculator
// ==========================================================================
function initRentCalculator() {
  const rentInput = document.getElementById("calcFlatRent");
  const elecInput = document.getElementById("calcElectricity");
  const wifiInput = document.getElementById("calcWifi");
  const countInput = document.getElementById("calcRoommates");
  const display = document.getElementById("calcShareDisplay");
  const summary = document.getElementById("calcTotalSummary");
  const copyBtn = document.getElementById("calcCopyBtn");

  if (!rentInput || !display) return;

  function calculate() {
    const rent = parseFloat(rentInput.value) || 0;
    const elec = parseFloat(elecInput.value) || 0;
    const wifi = parseFloat(wifiInput.value) || 0;
    const count = parseInt(countInput.value, 10) || 2;

    const total = rent + elec + wifi;
    const perPerson = Math.round(total / count);

    display.textContent = `₹${perPerson.toLocaleString("en-IN")}`;
    summary.textContent = `Total Flat Cost: ₹${total.toLocaleString("en-IN")} ÷ ${count} students`;
  }

  [rentInput, elecInput, wifiInput, countInput].forEach(el => {
    if (el) el.addEventListener("input", calculate);
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const rent = parseFloat(rentInput.value) || 0;
      const elec = parseFloat(elecInput.value) || 0;
      const wifi = parseFloat(wifiInput.value) || 0;
      const count = parseInt(countInput.value, 10) || 2;
      const total = rent + elec + wifi;
      const perPerson = Math.round(total / count);

      const text = `🏠 *R. C. Patel Shirpur - Flat Rent Split*\n` +
                   `• Flat Rent: ₹${rent.toLocaleString("en-IN")}\n` +
                   `• Electricity/Water: ₹${elec.toLocaleString("en-IN")}\n` +
                   `• WiFi/Internet: ₹${wifi.toLocaleString("en-IN")}\n` +
                   `• Total Monthly Cost: ₹${total.toLocaleString("en-IN")}\n` +
                   `👉 *Share Per Roommate (${count} students): ₹${perPerson.toLocaleString("en-IN")} / month*`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Rent breakdown copied! Ready to paste into WhatsApp 📲", "success");
        }).catch(() => {
          showToast(`Per student: ₹${perPerson.toLocaleString("en-IN")}/month`, "info");
        });
      } else {
        showToast(`Per student: ₹${perPerson.toLocaleString("en-IN")}/month`, "info");
      }
    });
  }

  calculate();
}
