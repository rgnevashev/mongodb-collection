/** @format */

const { default: MongoObject } = require('mongo-object')
const _ = require('lodash')

class MongoCollection {
  constructor(name, database = null) {
    // Set DB
    this.db = global.db || database
    if (!this.db) {
      throw new Error('mongo instance db not found, you should declare db globally or pass to constructor')
    }

    // Set name collection
    this._name = name

    // Set collection
    this.collection = this.db.collection(name)

    // Set logger
    const debug = global.debug || require('debug')
    if (debug) {
      this.logger = debug(`app.${name}`)
      this.enableLog()
    } else {
      this.disableLog()
    }

    // Use collections
    this.collections = {}
  }

  useCollections(instances = {}) {
    this.collections = {
      ...this.collections,
      ...instances
    }
  }

  async create(input = {}, context = {}) {
    const { user = {} } = context
    let data = {
      ...input,
      createdAt: new Date()
    }
    if (user && user._id) {
      data.owner = user._id
    }

    data = await this.before(data, context)
    data = await this.beforeCreate(data, context)

    this.log('create %j', data)

    const { insertedId: id } = await this.insertOne(data)
    const doc = await this.get(id, context)

    await this.after(doc, { ...context, data })
    await this.afterCreate(doc, { ...context, data })

    return this.get(id, context)
  }

  async get(query = {}, context = {}) {
    const { resolveData } = context
    const selector = typeof query === 'string' ? { _id: query } : { ...query }

    this.log('get %j', selector)

    if (_.isEmpty(selector)) {
      return null
    }

    const doc = await this.findOne(selector)

    if (doc) {
      return resolveData ? resolveData(doc, context) : this.doc(doc, context)
    }
  }

  async search(query = {}, parentSelector = {}, context = {}) {
    const { resolveData } = context
    let { limit = 0, skip = 0, sort = [], ...rest } = query
    let selector = {}

    // selector
    Object.entries(rest || {}).forEach(([key, value]) => (selector[key] = value))
    selector = {
      ...selector,
      ...parentSelector
    }

    // sort
    if (sort && sort.length) {
      const [by, dir] = sort
      sort = { [by]: +dir || -1 }
    }

    const options = { sort, skip: +skip, limit: +limit }

    this.log('find %j %j', selector, options)

    const count = await this.countDocuments(selector)
    let data = await this.find(selector, options).toArray()
    data = data.map(doc => (resolveData ? resolveData(doc, context) : this.doc(doc, context)))
    const pages = limit > 0 ? Math.ceil(count / limit) : 0

    return { data, skip: +skip, limit: +limit, sort, count, pages }
  }

  async save(query = {}, data = {}, context = {}) {
    const { options = {} } = context
    const selector = typeof query === 'string' ? { _id: query } : { ...query }

    data = await this.before(data, context)
    data = await this.beforeSave(data, context)

    const modifier = MongoObject.docToModifier(
      { ...data, updatedAt: new Date() },
      {
        keepArrays: true,
        keepEmptyStrings: false,
        ..._.pick(options, 'keepArrays', 'keepEmptyStrings')
      }
    )

    this.log('save %j %j %j', selector, modifier, options)

    if (_.isEmpty(selector) || _.isEmpty(modifier)) {
      return null
    }

    await this.updateOne(selector, modifier, options)
    const doc = await this.get(selector, context)

    await this.after(doc, { ...context, data })
    await this.afterSave(doc, { ...context, data })

    return this.get(selector, context)
  }

  async copy(id) {
    const doc = await this.findOne({ _id: id })
    if (!doc) {
      throw new Error('Copy object not found')
    }
    if (doc) {
      return _.omit(doc, '_id', 'id', 'createdAt', 'updatedAt', 'owner')
    }
  }

  async remove(query = {}, context = {}) {
    let selector = typeof query === 'string' ? { _id: query } : query

    this.log('remove %j', selector)

    if (_.isEmpty(selector)) {
      return null
    }

    const doc = await this.get(selector, context)
    if (_.isEmpty(doc)) {
      return null
    }
    await this.beforeRemove(doc, context)
    await this.deleteOne({ _id: doc._id })
    await this.afterRemove(doc, context)

    return { id: selector._id }
  }

  aggregate(...args) {
    return this.collection.aggregate(...args)
  }
  async bulkWrite(...args) {
    return this.collection.bulkWrite(...args)
  }

  async createIndex(...args) {
    return this.collection.createIndex(...args)
  }
  async createIndexes(...args) {
    return this.collection.createIndexes(...args)
  }
  async indexes(...args) {
    return this.collection.indexes(...args)
  }
  async indexExists(...args) {
    return this.collection.indexExists(...args)
  }
  async indexInformation(...args) {
    return this.collection.indexInformation(...args)
  }
  listIndexes(...args) {
    return this.collection.listIndexes(...args)
  }
  async reIndex(...args) {
    return this.collection.reIndex(...args)
  }
  async dropIndex(...args) {
    return this.collection.dropIndex(...args)
  }
  async dropIndexes(...args) {
    return this.collection.dropIndexes(...args)
  }

  async countDocuments(...args) {
    return this.collection.countDocuments(...args)
  }
  async estimatedDocumentCount(...args) {
    return this.collection.estimatedDocumentCount(...args)
  }
  async distinct(...args) {
    return this.collection.distinct(...args)
  }

  find(...args) {
    return this.collection.find(...args)
  }
  async findOne(...args) {
    return this.collection.findOne(...args)
  }
  async findOneAndDelete(...args) {
    return this.collection.findOneAndDelete(...args)
  }
  async findOneAndReplace(...args) {
    return this.collection.findOneAndReplace(...args)
  }
  async findOneAndUpdate(...args) {
    return this.collection.findOneAndUpdate(...args)
  }
  async insertOne(...args) {
    return this.collection.insertOne(...args)
  }
  async insertMany(...args) {
    return this.collection.insertMany(...args)
  }
  async rename(...args) {
    return this.collection.rename(...args)
  }
  async replaceOne(...args) {
    return this.collection.replaceOne(...args)
  }
  async updateOne(...args) {
    return this.collection.updateOne(...args)
  }
  async updateMany(...args) {
    return this.collection.updateMany(...args)
  }
  async deleteOne(...args) {
    return this.collection.deleteOne(...args)
  }
  async deleteMany(...args) {
    return this.collection.deleteMany(...args)
  }

  async stats(...args) {
    return this.collection.stats(...args)
  }
  async options(...args) {
    return this.collection.options(...args)
  }
  async isCapped(...args) {
    return this.collection.isCapped(...args)
  }
  async drop(...args) {
    return this.collection.drop(...args)
  }

  async before(data, context) {
    return data
  }
  async beforeCreate(data, context) {
    return data
  }
  async beforeSave(doc, context) {
    return doc
  }
  async beforeRemove(doc, context) {
    return doc
  }

  async after(doc, context) {
    return true
  }
  async afterCreate(doc, context) {
    return true
  }
  async afterSave(doc, context) {
    return true
  }
  async afterRemove(doc, context) {
    return true
  }

  log(...args) {
    if (this.logging && this.logger) {
      this.logger(...args)
    }
  }

  enableLog() {
    this.logging = true
  }

  disableLog() {
    this.logging = false
  }

  doc(doc, context) {
    return {
      ...doc,
      id: doc._id
    }
  }

  formatFields(fields = '') {
    return String(fields)
      .split(/[\s,]/)
      .map(v => v.trim())
      .filter(v => !!v)
      .reduce((o, a) => ({ ...o, [a]: 1 }), {})
  }
}

module.exports = MongoCollection
