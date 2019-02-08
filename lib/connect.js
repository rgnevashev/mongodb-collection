/** @format */

const { MongoClient, Logger } = require('mongodb')
const Random = require('./Random')

const PKFactory = {
  createPk() {
    return Random.id()
  }
}

module.exports = async (url, dbName) => {
  let db = null

  try {
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      pkFactory: PKFactory
    })
    if (process.env.MONGO_DEBUG) {
      // Set debug level
      Logger.setLevel('debug')
      // Only log statements on 'Db' class
      Logger.filter('class', ['Db', 'Cursor'])
      // Set our own logger
      Logger.setCurrentLogger(function(msg, context) {
        console.log('%s', context.message.replace('issue initial query ', '')) // eslint-disable-line
      })
    }
    db = client.db(dbName)
  } catch (err) {
    console.error(err) // eslint-disable-line
  }

  return db
}
