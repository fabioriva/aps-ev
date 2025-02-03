import sqlite3 from 'sqlite3'
import util from 'util'

class SQLite {
  constructor (db) {
    this.db = new sqlite3.Database(db)
    this.createTable()
  }

  createTable () {
    this.db.exec(`CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY,
          card INTEGER,
          d1 text, 
          d2 text,
          endpoint TEXT NOT NULL,
          response TEXT NOT NULL)`)
  }

  find = util.promisify((sql, cb) => {
    this.db.all(sql, (err, rows) => {
      if (err) return cb(err)
      cb(err, rows)
    })
  })

  findAll = util.promisify((cb) => {
    this.db.all('SELECT * FROM logs ORDER BY d1 DESC', (err, rows) => {
      if (err) return cb(err)
      cb(err, rows)
    })
  })

  get = util.promisify((sql, cb) => {
    this.db.get(sql, (err, row) => {
      if (err) return cb(err)
      cb(err, row)
    })
  })

  insert = util.promisify((params, cb) => {
    const stmt = this.db.prepare('INSERT INTO logs(card, d1, d2, endpoint, response) VALUES(?, ?, ?, ?, ?)')
    stmt.run(params, [], (err) => {
      if (err) return cb(err)
      cb(err, null)
    })
  })

  saveLog = util.promisify(async ({ card, endpoint, response }, cb) => {
    const { d1 } = await this.get('SELECT datetime("now", "subsec") AS d1')
    const { d2 } = await this.get('SELECT datetime("now", "localtime", "subsec") AS d2')
    const params = Object.values({ card, d1, d2, endpoint, response })
    const stmt = this.db.prepare('INSERT INTO logs(card, d1, d2, endpoint, response) VALUES(?, ?, ?, ?, ?)')
    stmt.run(params, [], (err) => {
      if (err) return cb(err)
      cb(err, null)
    })
  })

  // async run () {
  //   const { d1 } = await this.get('SELECT datetime("now", "subsec") AS d1')
  //   const { d2 } = await this.get('SELECT datetime("now", "localtime", "subsec") AS d2')
  //   const params = Object.values({ card: 456, d1, d2, endpoint: '/queue/exit/out/:card', response: 'success' })
  //   await this.insert(params)
  //   const rows = await this.find('SELECT * FROM logs ORDER BY d1 DESC')
  //   console.log(rows)
  // }
}

export default SQLite

// const start = async () => {
//   const db = new SQLite('database.db')
//   await db.run()
// }

// start()
