import { db } from '../../lib/db'
import camelCase from 'camelcase'
import pluralize from 'pluralize'
import * as Errors from './errors'
import { validate as validateField } from '@redwoodjs/api'

export default class RedwoodRecord {
  // Set in child class to override DB accessor name. Leaving `undefined` will
  // use the camelCase version of the class name itself as the accessor.
  //
  //   static accessor = 'userPreference'
  static accessor

  // Set in child class to override primary key field name.
  //
  //   static primaryKey = 'userId'
  static primaryKey = 'id'

  // Stores hasMany relatinoships to other models. Can be in the form of a
  // a class, which is the other model, or an object that has keys containing
  // several options:
  //
  // * model: the class for the other model
  // * name:  the name of the accessor on the PrismaClient, ie. 'blogPost'
  //          for db.blogPost, (defaults to singular camelCase of the model name)
  // * foreignKey: the name of the DB field that referneces back to this model,
  //               ie. authorId in the Post table references the User table
  //               (defaults to the camelCase name of this model with "Id" appended
  //
  //   static hasMany = [Post]
  //   static hasMany = [{ model: 'Post', name: 'blogPost', foreignKey: 'authorId' }]
  static hasMany = []

  // Denotes validations that need to run for the given fields. Must be in the
  // form of { field: options } where `field` is the name of the field and
  // `options` are the validation options:
  //
  //   static validates = [{
  //     emailAddress: { email: true },
  //     name: { presence: true, length: { min: 2, max: 255 } }
  //   }]
  static validates = []

  // Returns the Prisma DB accessor instance (ex. db.user)
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

  // Create a new record. Instantiates a new instance and then calls .save() on it
  static async create(attributes, options = {}) {
    const record = new this(attributes)
    return await record.save(options)
  }

  // Returns the first record matching the given where, otherwise first in the
  // whole table (whatever the DB determines is the first record)
  static async first(where, options = {}) {
    const attributes = await this.dbAccessor.findFirst({
      where,
      ...options,
    })

    return attributes ? new this(attributes) : null
  }

  // Find a single record by ID.
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
    this.#createPropertiesForRelationships()
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

  // Whether or not this instance contains an errors according to validation
  // rules (opposite of `isValid`)
  get hasError() {
    let hasError = false

    for (const [_name, errors] of Object.entries(this.#errors)) {
      if (errors.length) {
        hasError = true
      }
    }

    return hasError
  }

  // Whether or not this instance is valid and has no errors (opposite of
  // `hasError`)
  get isValid() {
    this.validate()
    return !this.hasError
  }

  // Adds an error to the #errors object. Can be called manually via instance,
  // however any errors added this way will be wiped out if calling `validate()`
  addError(attribute, message) {
    this.#errors[attribute].push(message)
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
    if (this.validate({ throw: options.throw })) {
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

      return this
    } else {
      return false
    }
  }

  async update(attributes = {}, options = {}) {
    this.#attributes = Object.assign(this.#attributes, attributes)
    return await this.save(options)
  }

  // Checks each field against validate directives. Creates errors if so and
  // returns `false`, otherwise returns `true`.
  validate(options = {}) {
    this.#clearErrors()

    // if there are no validations, then we're valid!
    if (this.constructor.validates.length === 0) {
      return true
    }

    const results = this.constructor.validates.map((validation) => {
      const name = Object.keys(validation)[0]
      const recipe = Object.values(validation)[0]

      try {
        validateField(this[name], name, recipe)
        return true
      } catch (e) {
        this.addError(name, e.message)
        if (options.throw) {
          throw e
        } else {
          return false
        }
      }
    })

    return results.every((result) => result)
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
            return this.#attributeGetter(name)
          },
          set(value) {
            this.#attributeSetter(name, value)
          },
          enumerable: true,
        })
        this.#errors[name] = []
      }
    }
  }

  // Turns relationships into getters/setters on the instance for returning
  // related data. Can be passed the name of the model that's related, or an
  // object containing options
  //
  // static hasMany = [Post]
  // static hasMany = [{ model: Post, name: 'posts', foreignKey: 'userId' }]
  // user.posts() // => [Post, Post, Post]
  #createPropertiesForRelationships() {
    this.constructor.hasMany.forEach((relationship) => {
      let model, name, foreignKey, defaults

      if (typeof relationship === 'object') {
        model = relationship.model
        defaults = this.#defaultHasManyOptions(model)
        name = relationship.name || defaults.name
        foreignKey = relationship.foreignKey || defaults.foreignKey
      } else {
        model = relationship
        defaults = this.#defaultHasManyOptions(model)
        name = defaults.name
        foreignKey = defaults.foreignKey
      }

      Object.defineProperty(this, name, {
        get() {
          return () => model.all({ where: { [foreignKey]: this.id } })
        },
        enumerable: true,
      })
    })
  }

  // Handles errors from saving a record (either update or create), converting
  // to this.#errors messages, or throwing RedwoodRecord errors
  #saveErrorHandler(error, shouldThrow) {
    if (error.message.match(/Record to update not found/)) {
      this.addError(
        'base',
        `${this.constructor.name} record to update not found`
      )
      if (shouldThrow) {
        throw new Errors.RedwoodRecordNotFoundError(this.constructor.name)
      }
    } else if (error.message.match(/must not be null/)) {
      const [_all, name] = error.message.match(/Argument (\w+)/)
      this.addError(name, 'must not be null')
      if (shouldThrow) {
        throw new Errors.RedwoodRecordNullAttributeError(name)
      }
    } else if (error.message.match(/is missing/)) {
      const [_all, name] = error.message.match(/Argument (\w+)/)
      this.addError('base', `${name} is missing`)
      if (shouldThrow) {
        throw new Errors.RedwoodRecordMissingAttributeError(name)
      }
    }
  }

  // Removes all error messages.
  #clearErrors() {
    for (const [attribute, _array] of Object.entries(this.#errors)) {
      this.#errors[attribute] = []
    }
  }

  #attributeGetter(name) {
    return this.#attributes[name]
  }

  #attributeSetter(name, value) {
    return (this.#attributes[name] = value)
  }

  #defaultHasManyOptions(model) {
    return {
      name: camelCase(pluralize(model.name)),
      foreignKey: `${camelCase(this.constructor.name)}Id`,
    }
  }
}
