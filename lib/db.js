import Database from 'better-sqlite3'

const db = new Database(process.env.DB + '.db')

db.exec(`CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY,
          card INTEGER,
          date TEXT, 
          endpoint TEXT NOT NULL,
          response TEXT NOT NULL
)`)

export default db
