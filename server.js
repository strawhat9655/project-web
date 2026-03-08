const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2));
}

function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* REGISTER */
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const data = readData();

    if (data.users.find(u => u.email === email)) {
        return res.json({ success: false, message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    data.users.push({
        email,
        password: hashedPassword,
        entries: [],
        journals: []
    });

    writeData(data);
    res.json({ success: true });
});

/* LOGIN */
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const data = readData();

    const user = data.users.find(u => u.email === email);
    if (!user) return res.json({ success: false });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false });

    res.json({ success: true });
});

/* SAVE ENTRY */
app.post("/saveEntry", (req, res) => {
    const { email, mood, sleep, stress } = req.body;
    const data = readData();

    const user = data.users.find(u => u.email === email);
    if (!user) return res.json({ success: false });

    user.entries.push({
        mood,
        sleep,
        stress,
        date: new Date().toISOString()
    });

    writeData(data);
    res.json({ success: true });
});

/* GET ENTRIES */
app.get("/getEntries/:email", (req, res) => {
    const data = readData();
    const user = data.users.find(u => u.email === req.params.email);
    res.json(user ? user.entries : []);
});

/* SAVE JOURNAL */
app.post("/saveJournal", (req, res) => {
    const { email, text } = req.body;
    const data = readData();

    const user = data.users.find(u => u.email === email);
    if (!user) return res.json({ success: false });

    user.journals.push({
        text,
        date: new Date().toISOString()
    });

    writeData(data);
    res.json({ success: true });
});

/* GET JOURNALS */
app.get("/getJournals/:email", (req, res) => {
    const data = readData();
    const user = data.users.find(u => u.email === req.params.email);
    res.json(user ? user.journals : []);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});