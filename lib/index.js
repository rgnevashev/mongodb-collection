/** @format */

const MongoCollection = require('./MongoCollection')
const Random = require('./Random')
const connecToDatabase = require('./connect')

module.exports = {
  MongoCollection,
  connecToDatabase,
  Random
}
