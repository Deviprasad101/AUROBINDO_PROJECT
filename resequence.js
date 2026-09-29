const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    db.all('SELECT * FROM users ORDER BY id ASC', [], (err, rows) => {
        if (err) throw err;
        let currentId = 1;
        let updates = 0;
        
        db.run('BEGIN TRANSACTION');
        
        rows.forEach(row => {
            if (row.id !== currentId) {
                const targetId = currentId;
                db.run('UPDATE users SET id = ? WHERE id = ?', [targetId, row.id], (err) => {
                    if (err) console.error(err);
                    else console.log(`Updated ${row.username} from ${row.id} to ${targetId}`);
                });
                updates++;
            }
            currentId++;
        });
        
        db.run('COMMIT', () => {
            console.log(`Finished updating ${updates} records.`);
            
            // Also reset sqlite_sequence so AUTOINCREMENT starts from the right place,
            // though our getNextSequentialId makes it irrelevant, it's good practice.
            db.run('UPDATE sqlite_sequence SET seq = ? WHERE name = "users"', [currentId - 1], (err) => {
                if (!err) console.log('Reset sqlite_sequence');
            });
        });
    });
});
