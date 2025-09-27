// ---------------- Onboarding ----------------
const onboarding = document.getElementById("onboarding");
const app = document.getElementById("app");
const startBtn = document.getElementById("startApp");
const nextBtns = document.querySelectorAll(".nextBtn");
const dots = document.querySelectorAll(".dot");

let currentSlide = 0;

function showSlide(index) {
  document.querySelectorAll(".slide").forEach((slide, i) => {
    slide.style.display = (i === index) ? "block" : "none";
    dots[i].classList.toggle("active", i === index);
  });
  currentSlide = index;
}

// Check if first time
if (!localStorage.getItem("hasOnboarded")) {
  onboarding.style.display = "block";
  showSlide(0);
} else {
  app.style.display = "block";
}

// Slide navigation
nextBtns.forEach((btn, i) => {
  btn.onclick = () => {
    showSlide(i + 1);
  };
});

// Final button
if (startBtn) {
  startBtn.onclick = () => {
    localStorage.setItem("hasOnboarded", "true");
    onboarding.style.display = "none";
    app.style.display = "block";
  };
}

// ---------------- Core App ----------------
let habits = JSON.parse(localStorage.getItem("habits")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;
let lastDate = localStorage.getItem("lastDate") || "";
let history = JSON.parse(localStorage.getItem("history")) || {};

const today = new Date().toLocaleDateString();
const habitList = document.getElementById("habitList");
const habitInput = document.getElementById("habitInput");
const addHabitBtn = document.getElementById("addHabit");
const streakDisplay = document.getElementById("streak");
const tipDisplay = document.getElementById("tip");

const tips = [
  "Small wins > big goals.",
  "Don’t aim for perfect, aim for done.",
  "5 minutes is better than 0.",
  "One step at a time, keep moving."
];

// Reset habits if new day
if (lastDate !== today) {
  habits.forEach(h => h.done = false);
  save();
}

// Daily tip refresh
if (localStorage.getItem("tipDate") !== today) {
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  localStorage.setItem("tip", randomTip);
  localStorage.setItem("tipDate", today);
}
tipDisplay.textContent = "💡 " + localStorage.getItem("tip");

// Render habits
function render() {
  habitList.innerHTML = "";
  habits.forEach((habit, i) => {
    const li = document.createElement("li");
    li.textContent = habit.name;
    if (habit.done) li.classList.add("done");
    li.onclick = () => toggleHabit(i);
    habitList.appendChild(li);
  });
  streakDisplay.textContent = "🔥 Streak: " + streak + " days";
  drawChart();
}

// Toggle habit done
function toggleHabit(index) {
  habits[index].done = !habits[index].done;
  checkStreak();
  save();
  render();
}

// Add new habit
addHabitBtn.onclick = () => {
  const name = habitInput.value.trim();
  if (name) {
    habits.push({ name, done: false });
    habitInput.value = "";
    save();
    render();
  }
};

// Add habit with Enter key
habitInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addHabitBtn.click();
});

// Check streak progress
function checkStreak() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toLocaleDateString();
  
  if (lastDate && lastDate !== today && lastDate !== yDate) {
    streak = 0;
  }
  
  if (habits.length > 0 && habits.every(h => h.done)) {
    if (lastDate !== today) {
      streak++;
      lastDate = today;
      
      // 🎉 Confetti when all habits are done
      if (typeof confetti === "function") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }
  
  // Log percentage of habits done today
  if (habits.length > 0) {
    const completed = habits.filter(h => h.done).length;
    history[today] = Math.round((completed / habits.length) * 100);
  } else {
    history[today] = 0;
  }
}

// Save data
function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
  localStorage.setItem("streak", streak);
  localStorage.setItem("lastDate", lastDate);
  localStorage.setItem("history", JSON.stringify(history));
}

// ---------------- Chart ----------------
let chart; // global chart instance

function drawChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");
  if (chart) chart.destroy(); // clear old chart
  
  let days = [];
  let values = [];
  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let key = d.toLocaleDateString();
    days.push(d.toLocaleDateString("en-US", { weekday: 'short' }));
    values.push(history[key] || 0);
  }
  
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{
        label: "Habit Completion (%)",
        data: values,
        backgroundColor: values.map(v =>
          v >= 70 ? "limegreen" : v > 0 ? "orange" : "lightgray"
        )
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + "%" }
        }
      }
    }
  });
}

// ---------------- Init ----------------
render();

// ---------------- PWA ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(reg => {
    console.log("Service Worker Registered");
    
    // Listen for new SW updates
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("New version found, reloading...");
          window.location.reload();
        }
      });
    });
  }).catch(err => console.error("SW registration failed:", err));
}