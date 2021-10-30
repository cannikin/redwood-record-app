import { db } from '../../lib/db'
import camelCase from 'camelcase'
import * as Errors from './errors'

export default class RedwoodRecord {
  // Set in child class to override DB accessor name. Leaving `undefined` will
  // use the camelCase version of the class name itself as the accessor.
  static accessor

  // Set primary key field name
  static primaryKey = 'id'

  // Returns the DB accessor instance
  static get dbAccessor() {
    return db[this.accessor || camelCase(this.name)]
  }

  // Find all records
  static async all(options = {}) {
    const records = await this.dbAccessor.findMany(options)

    return records.map((record) => {
      return new this(record)
    })
  }

  static async create(attributes, options = {}) {
    const record = new this(attributes)
    await record.save({ throw: options.throw })

    return record
  }

  static async first(where, options = {}) {
    const attributes = await this.dbAccessor.findFirst({
      where,
      ...options,
    })

    return attributes ? new this(attributes) : null
  }

  // Find a single record by ID
  static async find(id, options = {}) {
    const attributes = await this.dbAccessor.findUnique({
      where: {
        [this.primaryKey]: id,
      },
      ...options,
    })
    if (attributes === null) {
      throw new Errors.RedwoodRecordNotFoundError(this.name)
    }
    return new this(attributes)
  }

  // Private instance properties

  #errors = { base: [] }
  #attributes = {}

  // Public instance methods

  constructor(attributes) {
    this.attributes = attributes
  }

  get attributes() {
    return this.#attributes
  }

  set attributes(attrs) {
    if (attrs) {
      this.#attributes = attrs
      this.#createPropertiesForAttributes()
    }
  }

  get errors() {
    return this.#errors
  }

  async destroy(options = {}) {
    // try {
    await this.constructor.dbAccessor.delete({
      where: { [this.constructor.primaryKey]: this.attributes.id },
      ...options,
    })
    // } catch (e) {
    //   return false
    // }

    return true
  }

  // Saves the attributes to the database
  async save(options = {}) {
    const { id, ...saveAttributes } = this.attributes
    try {
      let newAttributes

      if (id) {
        // update existing record
        newAttributes = await this.constructor.dbAccessor.update({
          where: { [this.constructor.primaryKey]: id },
          data: saveAttributes,
        })
      } else {
        // create new record
        newAttributes = await this.constructor.dbAccessor.create({
          data: saveAttributes,
        })
      }

      // update attributes in case someone else changed since we last read them
      this.attributes = newAttributes
    } catch (e) {
      this.#saveErrorHandler(e, options.throw)
      return false
    }
    return true
  }

  update(attributes = {}, options = {}) {
    this.#attributes = Object.assign(this.#attributes, attributes)
    return this.save(options)
  }

  // Private instance methods

  // Turns a plain object's properties into getters/setters on the instance:
  //
  // const user = new User({ name: 'Rob' })
  // user.name  // => 'Rob'
  #createPropertiesForAttributes() {
    for (const [name, _value] of Object.entries(this.attributes)) {
      // eslint-disable-next-line
      if (!this.hasOwnProperty(name)) {
        Object.defineProperty(this, name, {
          get() {
            return this.#attributes[name]
          },
          set(value) {
            this.#attributes[name] = value
          },
          enumerable: true,
        })
        this.#errors[name] = []
      }
    }
  }

  // Handles errors from saving a record (either update or create), converting
  // to this.#errors messages, or throwing RedwoodRecord errors
  #saveErrorHandler(error, shouldThrow) {
    if (error.message.match(/Record to update not found/)) {
      this.errors.base.push(
        `${this.constructor.name} record to update not found`
      )
      if (shouldThrow) {
        throw new Errors.RedwoodRecordNotFoundError(this.constructor.name)
      }
    } else if (error.message.match(/must not be null/)) {
      const [_all, name] = error.message.match(/Argument (\w+)/)
      this.errors[name].push('must not be null')
      if (shouldThrow) {
        throw new Errors.RedwoodRecordNullAttributeError(name)
      }
    } else if (error.message.match(/is missing/)) {
      const [_all, name] = error.message.match(/Argument (\w+)/)
      this.errors.base.push(`${name} is missing`)
      if (shouldThrow) {
        throw new Errors.RedwoodRecordMissingAttributeError(name)
      }
    }
  }
}
