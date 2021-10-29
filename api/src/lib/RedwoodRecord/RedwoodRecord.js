import { db } from '../../lib/db'
import camelCase from 'camelcase'
import * as Errors from './errors'

export default class RedwoodRecord {
  // Set in child class to override DB accessor name. Leaving `undefined` will
  // use the camelCase version of the class name itself as the accessor.
  static accessor

  // Set primary key field name
  static primaryKey = 'id'

  // Returns the DB accessor name
  static get dbAccessor() {
    return this.accessor || camelCase(this.name)
  }

  // Find a single record by ID
  static async find(id) {
    const attributes = await db[this.dbAccessor].findUnique({
      where: {
        [this.primaryKey]: id,
      },
    })
    if (attributes === null) {
      throw new Errors.RedwoodRecordNotFoundError(this.name)
    }
    return new this(attributes)
  }

  // Public instance methods

  constructor(attributes) {
    this.attributes = attributes
    this._errors = {
      base: [],
    }
    this._createPropertiesForAttributes()
  }

  get errors() {
    return this._errors
  }

  // Saves the attributes to the database
  async save(options = {}) {
    const { id, ...saveAttributes } = this.attributes
    try {
      await db[this.constructor.dbAccessor].update({
        where: { [this.constructor.primaryKey]: id },
        data: saveAttributes,
      })
    } catch (e) {
      this._updateErrorHandler(e, options.throw)
      return false
    }
    return true
  }

  // Private instance methods

  // Turns a plain object's properties into getters/setters on the instance:
  //
  // const user = new User({ name: 'Rob' })
  // user.name  // => 'Rob'
  _createPropertiesForAttributes() {
    for (const [name, _value] of Object.entries(this.attributes)) {
      Object.defineProperty(this, name, {
        get() {
          return this.attributes[name]
        },
        set(value) {
          this.attributes[name] = value
        },
        enumerable: true,
      })
      this._errors[name] = []
    }
  }

  // Handles errors from Prisma's update(), converting to this._errors messages,
  // or throwing RedwoodRecord errors
  _updateErrorHandler(error, shouldThrow) {
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
    }
  }
}
