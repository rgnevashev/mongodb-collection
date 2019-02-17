/** @format */

const MongoCollection = require('./MongoCollection')
const Random = require('./Random')
const connecToDatabase = require('./connect')
const loadCollections = require('./loadCollections')

module.exports = {
  MongoCollection,
  connecToDatabase,
  loadCollections,
  Random
}
