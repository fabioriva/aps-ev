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
          date text, 
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
    // this.db.all('SELECT * FROM logs ORDER BY date DESC LIMIT 5', (err, rows) => {
    this.db.all('SELECT card, date, endpoint, response FROM logs ORDER BY date DESC LIMIT 10', (err, rows) => {
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

  // insert = util.promisify((params, cb) => {
  //   const stmt = this.db.prepare('INSERT INTO logs(card, date, endpoint, response) VALUES(?, ?, ?, ?)')
  //   stmt.run(params, [], (err) => {
  //     if (err) return cb(err)
  //     cb(err, null)
  //   })
  // })

  // saveLog = util.promisify(async ({ card, date, dutc, endpoint, response }, cb) => {
  //   console.log(date, dutc)
  //   // const d3 = await this.get(`SELECT datetime(${dutc}, 'unixepoch')`)
  //   // const d4 = await this.get(`SELECT datetime(${dutc}, 'unixepoch', 'localtime')`)
  //   // console.log(d3, d4)

  //   // const { d1 } = await this.get('SELECT datetime("now", "subsec") AS d1')
  //   // const { d2 } = await this.get('SELECT datetime("localtime", "subsec") AS d2')
  //   // console.log(d1, d2)
  //   const params = Object.values({ card, date, endpoint, response })
  //   const stmt = this.db.prepare('INSERT INTO logs(card, date, endpoint, response) VALUES(?, ?, ?, ?)')
  //   stmt.run(params, [], (err) => {
  //     if (err) return cb(err)
  //     cb(err, null)
  //   })
  // })

  saveLog = async ({ card, date, endpoint, response }) => {
    const params = Object.values({ card, date, endpoint, response })
    const stmt = this.db.prepare('INSERT INTO logs(card, date, endpoint, response) VALUES(?, ?, ?, ?)')
    stmt.run(params, [], (err) => {
      if (err) return err
      return null
    })
  }
}

export default SQLite
