const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Enable CORS for VS Code Live Server (Port 5500)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from current directory
app.use(express.static(path.join(__dirname, '')));

// Fallback for root to login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Database setup
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`, (err) => {
            if (!err) {
                // Create default admin user if not exists
                db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('password', 'password', 'admin')`);
                
                // Add assigned_units column if it doesn't exist (ignore error if it does)
                db.run(`ALTER TABLE users ADD COLUMN assigned_units TEXT`, (err) => {
                    // Ignore errors if column already exists
                });
            }
        });
    }
});

// Register Endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, password, 'user'], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Failed to register' });
        }
        res.json({ message: 'Registration successful', id: this.lastID });
    });
});

// Login Endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.json({ message: 'Login successful', role: row.role, username: row.username, assigned_units: row.assigned_units || '' });
    });
});

// Reset Password Endpoint
app.post('/api/reset-password', (req, res) => {
    const { username, newPassword } = req.body;
    db.run(`UPDATE users SET password = ? WHERE username = ?`, [newPassword, username], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Username not found' });
        }
        res.json({ message: 'Password reset successfully' });
    });
});

// Create Editor Endpoint (for Admin)
app.post('/api/create-editor', (req, res) => {
    const { username, password, assigned_units } = req.body;
    db.run(`INSERT INTO users (username, password, role, assigned_units) VALUES (?, ?, ?, ?)`, [username, password, 'editor', assigned_units], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Failed to create editor' });
        }
        res.json({ message: 'Editor created successfully', id: this.lastID });
    });
});

// Verify Editor Endpoint
app.post('/api/verify-editor', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ? AND role = 'editor'`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid editor credentials' });
        }
        res.json({ message: 'Editor verified successfully' });
    });
});

// Get Users (for Admin Dashboard)
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Delete User Endpoint
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    // Don't allow deleting the default admin account (ID 1 usually, or by username)
    db.run(`DELETE FROM users WHERE id = ? AND username != 'password'`, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found or cannot delete default admin' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
