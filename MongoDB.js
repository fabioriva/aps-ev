import { MongoClient } from 'mongodb'

class MongoDb {
  constructor (db) {
    this.db = db
  }

  async findAll () {
    const query = {}
    const options = { projection: { _id: 0 } }
    const docs = await this.collection.find(query, options).sort({ date: -1 }).toArray()
    return docs
  }

  async saveLog (doc) {
    // console.log(doc)
    const res = await this.collection.insertOne(doc)
    console.log(`A document was inserted with the _id: ${res.insertedId}`)
    // logger.debug('document was inserted with the _id: %s', res.insertedId)
  }

  async run () {
    const client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    const db = client.db(this.db)
    this.collection = db.collection('ev')
  }
}

export default MongoDb
