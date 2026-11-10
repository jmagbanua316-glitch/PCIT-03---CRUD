const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbFile = path.join(__dirname, 'dashboard.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                db.get(`SELECT COUNT(*) as count FROM items`, (err, row) => {
                    if (row.count === 0) {
                        const stmt = db.prepare(`INSERT INTO items (name, category, status, quantity) VALUES (?, ?, ?, ?)`);
                        stmt.run('Quantum Processor X1', 'Hardware', 'Active', 14);
                        stmt.run('Neural Net Gateway', 'Infrastructure', 'Pending', 8);
                        stmt.run('Cyberdeck Chassis V4', 'Hardware', 'Active', 25);
                        stmt.finalize();
                    }
                });
            }
        });
    }
});


app.api = app.get('/api/items', (req, res) => {
    const query = `SELECT * FROM items ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', data: rows });
    });
});


app.post('/api/items', (req, res) => {
    const { name, category, status } = req.body;
    const quantity = parseInt(req.body.quantity);

    if (!name || !category || !status || isNaN(quantity)) {
        return res.status(400).json({ error: 'Please provide all required fields with a valid quantity.' });
    }

    const query = `INSERT INTO items (name, category, status, quantity) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, category, status, quantity], function (err) {
        if (err) {
            console.error('Database insert error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'success',
            data: { id: this.lastID, name, category, status, quantity }
        });
    });
});


app.put('/api/items/:id', (req, res) => {
    const { name, category, status } = req.body;
    const quantity = parseInt(req.body.quantity);
    const { id } = req.params;

    if (!name || !category || !status || isNaN(quantity)) {
        return res.status(400).json({ error: 'Please provide all required fields with a valid quantity.' });
    }

    const query = `UPDATE items SET name = ?, category = ?, status = ?, quantity = ? WHERE id = ?`;
    db.run(query, [name, category, status, quantity, id], function (err) {
        if (err) {
            console.error('Database update error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'success',
            data: { id: Number(id), name, category, status, quantity },
            changes: this.changes
        });
    });
});


app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM items WHERE id = ?`;
    db.run(query, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});