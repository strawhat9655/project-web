let selectedMood = "";
let currentUserEmail = localStorage.getItem("userEmail") || "";

let sleepChart;
let stressChart;

function predictMood(sleep, stress) {

    sleep = Number(sleep);
    stress = Number(stress);

    if (sleep >= 7 && stress <= 4) {
        return "😊 Happy";
    }

    if (sleep < 5 && stress >= 7) {
        return "😔 Very Stressed";
    }

    if (stress >= 8) {
        return "😡 Angry / Frustrated";
    }

    if (sleep < 6) {
        return "😴 Tired";
    }

    return "🙂 Neutral";
}

/* ========================= */
/* AUTH FUNCTIONS */
/* ========================= */

async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    message.innerText = data.success ? "Registered! Login now." : "User exists!";
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
        localStorage.setItem("userEmail", email);
        window.location.href = "dashboard.html";
    } else {
        message.innerText = "Invalid credentials";
    }
}

/* ========================= */
/* MOOD + MUSIC */
/* ========================= */

function setMood(button, mood) {
    selectedMood = mood;

    document.querySelectorAll(".mood-btn")
        .forEach(btn => btn.classList.remove("active-mood"));

    button.classList.add("active-mood");

    showMusicRecommendation(mood);
}

function showMusicRecommendation(mood) {

    const musicContainer = document.getElementById("musicContainer");
    const recommendationBox = document.getElementById("recommendationBox");

    if (!musicContainer || !recommendationBox) return;

    const playlists = {
        Happy: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdPec7aLTmlC",
        Sad: "https://open.spotify.com/embed/playlist/37i9dQZF1DWVrtsSlLKzro",
        Angry: "https://open.spotify.com/embed/playlist/37i9dQZF1DWX83CujKHHOn",
        Tired: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO"
    };

    let moodKey = Object.keys(playlists).find(key => mood.includes(key));
    if (!moodKey) return;

    /* 🎵 MUSIC */
    musicContainer.innerHTML = `
        <h3>🎧 Recommended Music</h3>
        <iframe 
            src="${playlists[moodKey]}" 
            width="100%" 
            height="350" 
            frameborder="0" 
            allow="encrypted-media">
        </iframe>
    `;

    /* 🧠 AI SUGGESTIONS */
    let recommendationHTML = "";

    if (moodKey === "Happy") {
        recommendationHTML = `
            <ul>
                <li>🎵 Listen to energetic pop music</li>
                <li>🧘 Try gratitude meditation (5 minutes)</li>
                <li>📺 Watch light anime like Naruto or Haikyuu</li>
            </ul>
        `;
    }

    if (moodKey === "Sad") {
        recommendationHTML = `
            <ul>
                <li>🎵 Calm instrumental or lo-fi music</li>
                <li>🧘 Deep breathing meditation (10 minutes)</li>
                <li>📺 Watch emotional anime like Your Name</li>
            </ul>
        `;
    }

    if (moodKey === "Angry") {
        recommendationHTML = `
            <ul>
                <li>🎵 Relaxing piano or nature sounds</li>
                <li>🧘 Guided anger-release meditation</li>
                <li>📺 Watch action anime like Attack on Titan</li>
            </ul>
        `;
    }

    if (moodKey === "Tired") {
        recommendationHTML = `
            <ul>
                <li>🎵 Soft ambient background music</li>
                <li>🧘 Short body relaxation meditation</li>
                <li>📺 Watch chill anime like Spy x Family</li>
            </ul>
        `;
    }

    recommendationBox.innerHTML = recommendationHTML;
}
/* ========================= */
/* SAVE ENTRY */
/* ========================= */

async function saveEntry() {

    const sleep = document.getElementById("sleep").value;
    const stress = document.getElementById("stress").value;
    const prediction = predictMood(sleep, stress);


    if (!selectedMood || !sleep || !stress) {
        alert("Fill all fields");
        return;
    }

    const resultBox = document.getElementById("aiPredictionResult");
    if (resultBox) {
     resultBox.innerText = prediction;
    }

    await fetch("/saveEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: currentUserEmail,
            mood: selectedMood,
            sleep,
            stress
        })
    });

    alert("Saved!");
    loadGraphs();
}

/* ========================= */
/* LOAD GRAPHS */
/* ========================= */

async function loadGraphs() {

    if (!currentUserEmail) return;

    const res = await fetch(`/getEntries/${currentUserEmail}`);
    const entries = await res.json();

    const labels = entries.map((e, i) => `Day ${i+1}`);
    const sleepData = entries.map(e => e.sleep);
    const stressData = entries.map(e => e.stress);

    if (sleepChart) sleepChart.destroy();
    if (stressChart) stressChart.destroy();

    const sleepCtx = document.getElementById("sleepChart");
    const stressCtx = document.getElementById("stressChart");

    if (!sleepCtx || !stressCtx) return;

    sleepChart = new Chart(sleepCtx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Sleep Hours",
                data: sleepData,
                borderWidth: 3
            }]
        }
    });

    stressChart = new Chart(stressCtx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Stress Level",
                data: stressData,
                borderWidth: 3
            }]
        }
    });
}

window.onload = loadGraphs;
let journalEmotionChart;

async function saveJournal() {

    const text = document.getElementById("journalText").value;
    const status = document.getElementById("journalStatus");
    const email = localStorage.getItem("userEmail");

    if (!email) {
        status.innerText = "⚠ Please login first!";
        return;
    }

    if (!text.trim()) {
        status.innerText = "⚠ Write something first!";
        return;
    }

    // 🧠 AI Mood Detection from Text
    const detectedMood = analyzeJournalMood(text);

    // Update prediction UI
    const predictionBox = document.getElementById("aiPredictionResult");
    predictionBox.innerText = detectedMood;

    try {
        const res = await fetch("/saveJournal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                text: text,
                mood: detectedMood
            })
        });

        const data = await res.json();

        if (data.success) {
            status.innerText = "✅ Journal saved successfully!";
            document.getElementById("journalText").value = "";
            loadJournals();
            updateEmotionChart();
        } else {
            status.innerText = "❌ Failed to save journal.";
        }

    } catch (err) {
        console.error(err);
        status.innerText = "❌ Server error.";
    }
}
async function loadJournals() {

    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const res = await fetch(`/getJournals/${email}`);
    const journals = await res.json();

    const container = document.getElementById("journalList");
    if (!container) return;

    container.innerHTML = journals.map(j =>
        `<p>
            <strong>${new Date(j.date).toLocaleString()}</strong><br>
            ${j.text}
        </p><hr>`
    ).join("");
}

window.onload = loadJournals;
function analyzeJournalMood(text) {

    text = text.toLowerCase();

    const happyWords = ["happy", "good", "great", "excited", "awesome", "love"];
    const sadWords = ["sad", "lonely", "depressed", "cry", "hurt", "bad"];
    const angryWords = ["angry", "mad", "hate", "frustrated", "annoyed"];
    const calmWords = ["calm", "peaceful", "relaxed", "okay", "fine"];
    const tiredWords = ["tired", "exhausted", "sleepy", "drained"];

    let scores = {
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Calm: 0,
        Tired: 0
    };

    happyWords.forEach(word => { if (text.includes(word)) scores.Happy++; });
    sadWords.forEach(word => { if (text.includes(word)) scores.Sad++; });
    angryWords.forEach(word => { if (text.includes(word)) scores.Angry++; });
    calmWords.forEach(word => { if (text.includes(word)) scores.Calm++; });
    tiredWords.forEach(word => { if (text.includes(word)) scores.Tired++; });

    let detected = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
    );

    if (scores[detected] === 0) return "🙂 Neutral";

    return `Detected Mood: ${detected}`;
}
async function updateEmotionChart() {

    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const res = await fetch(`/getJournals/${email}`);
    const journals = await res.json();

    let counts = {
        Happy: 0,
        Sad: 0,
        Angry: 0,
        Calm: 0,
        Tired: 0,
        Neutral: 0
    };

    journals.forEach(j => {
        const mood = analyzeJournalMood(j.text);
        if (mood.includes("Happy")) counts.Happy++;
        else if (mood.includes("Sad")) counts.Sad++;
        else if (mood.includes("Angry")) counts.Angry++;
        else if (mood.includes("Calm")) counts.Calm++;
        else if (mood.includes("Tired")) counts.Tired++;
        else counts.Neutral++;
    });

    const ctx = document.getElementById("journalEmotionChart");

    if (journalEmotionChart) journalEmotionChart.destroy();

    journalEmotionChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                borderWidth: 2
            }]
        }
    });
}
window.onload = function () {
    loadJournals();
    updateEmotionChart();
};
