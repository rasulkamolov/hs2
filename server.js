const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let db = new sqlite3.Database(':memory:');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE books (
        id INTEGER PRIMARY KEY,
        title TEXT,
        price INTEGER,
        quantity INTEGER
    )`);
    
    db.run(`CREATE TABLE transactions (
        id INTEGER PRIMARY KEY,
        action TEXT,
        book TEXT,
        quantity INTEGER,
        total INTEGER,
        timestamp TEXT
    )`);

    // Pre-populate books table with predefined books
    const books = [
        ["Beginner", 85000, 0],
        ["Elementary", 85000, 0],
        ["Pre-Intermediate", 85000, 0],
        ["Intermediate", 85000, 0],
        ["Kids Level 1", 60000, 0],
        ["Kids Level 2", 60000, 0],
        ["Kids Level 3", 60000, 0],
        ["Kids Level 4", 60000, 0],
        ["Kids Level 5", 60000, 0],
        ["Kids Level 6", 60000, 0],
        ["Kids High Level 1", 60000, 0],
        ["Kids High Level 2", 60000, 0],
        ["Listening Beginner", 30000, 0],
        ["Listening Elementary", 30000, 0],
        ["Listening Pre-Intermediate", 30000, 0],
        ["Listening Intermediate", 35000, 0]
    ];

    let stmt = db.prepare("INSERT INTO books (title, price, quantity) VALUES (?, ?, ?)");
    for (let book of books) {
        stmt.run(book);
    }
    stmt.finalize();
});

// Routes
app.get('/api/data', (req, res) => {
    let response = { books: [], transactions: [] };
    
    db.serialize(() => {
        db.all("SELECT * FROM books", (err, rows) => {
            if (err) {
                return console.error(err.message);
            }
            response.books = rows;
            
            db.all("SELECT * FROM transactions", (err, rows) => {
                if (err) {
                    return console.error(err.message);
                }
                response.transactions = rows;
                res.json(response);
            });
        });
    });
});

app.post('/api/books', (req, res) => {
    const { title, price, quantity } = req.body;
    
    db.serialize(() => {
        db.get("SELECT * FROM books WHERE title = ?", [title], (err, row) => {
            if (err) {
                return console.error(err.message);
            }
            
            if (row) {
                db.run("UPDATE books SET quantity = quantity + ? WHERE title = ?", [quantity, title], (err) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    res.status(200).send('Book quantity updated');
                });
            } else {
                db.run("INSERT INTO books (title, price, quantity) VALUES (?, ?, ?)", [title, price, quantity], (err) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    res.status(200).send('Book added');
                });
            }
        });
    });
});

app.post('/api/transactions', (req, res) => {
    const { action, book, quantity, total, timestamp } = req.body;
    db.run("INSERT INTO transactions (action, book, quantity, total, timestamp) VALUES (?, ?, ?, ?, ?)", 
        [action, book, quantity, total, timestamp], 
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            res.status(200).send('Transaction recorded');
        }
    );
});

app.put('/api/books/:id', (req, res) => {
    const id = req.params.id;
    const { quantity } = req.body;
    db.run("UPDATE books SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.status(200).send('Book quantity updated');
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM transactions WHERE id = ?", [id], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.status(200).send('Transaction deleted');
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
