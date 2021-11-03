import { validate as validateField } from '@redwoodjs/api'
import camelCase from 'camelcase'
import pluralize from 'pluralize'

import { db } from '../../lib/db'

import * as Errors from './errors'
import RedwoodRecordRelationProxy from './RedwoodRecordRelationProxy'

export default class RedwoodRecord {
  // Set in child class to override DB accessor name. This is the name of the
  // property you would call on an instance of Prisma Client in order the query
  // a model in your schema. ie. For the call `db.user` the accessorName is
  // "user". Not setting this property will use the default camelCase version of
  // the class name itself as the accessor.
  //
  //   static accessorName = 'users'
  static accessorName

  // Set in child class to override primary key field name for this model.
  //
  //   static primaryKey = 'userId'
  static primaryKey = 'id'

  // Stores hasMany relationships to other models. Can be in the form of a
  // a class, which is the other model, or an object that has keys containing
  // several options:
  //
  // * model: the class for the other model
  // * name:  the name of the function that's added to an instance of this model
  //          to access the related records: ie: the name "blogPosts" would add
  //          user.blogPosts() (defaults to singular camelCase of the model name)
  // * foreignKey: the name of the DB field that references back to this model,
  //               ie. "authorId" in the Post table references the User table
  //               (defaults to the camelCase name of this model with "Id" appended)
  //
  //   static hasMany = [Post]
  //   static hasMany = [{ model: 'Post', name: 'posts', foreignKey: 'userId' }]
  static hasMany = []

  // Denotes validations that need to run for the given fields. Must be in the
  // form of { field: options } where `field` is the name of the field and
  // `options` are the validation options. See Service Validations docs for
  // usage examples: https://redwoodjs.com/docs/services.html#service-validations
  //
  //   static validates = [{
  //     emailAddress: { email: true },
  //     name: { presence: true, length: { min: 2, max: 255 } }
  //   }]
  static validates = []

  // Access the raw Prisma Client for doing low level query manipulation
  static get db() {
    return db
  }

  // Returns the Prisma DB accessor instance (ex. db.user)
  static get accessor() {
    return this.db[this.accessorName || camelCase(this.name)]
  }

  // Alias for where()
  static all(...args) {
    return this.where(...args)
  }

  // Create a new record. Instantiates a new instance and then calls .save() on it
  static async create(attributes, options = {}) {
    const record = new this(attributes)

    return await record.save(options)
  }

  // Find a single record by ID.
  static async find(id, options = {}) {
    const record = await this.findBy(
      {
        [this.primaryKey]: id,
        ...(options.where || {}),
      },
      options
    )
    if (record === null) {
      throw new Errors.RedwoodRecordNotFoundError(this.name)
    } else {
      return record
    }
  }

  // Returns the first record matching the given `where`, otherwise first in the
  // whole table (whatever the DB determines is the first record)
  static async findBy(attributes, options = {}) {
    const record = await this.accessor.findFirst({
      where: attributes,
      ...options,
    })

    return record ? new this(record) : null
  }

  // Alias for findBy
  static async first(...args) {
    return this.findBy(...args)
  }

  // Find all records
  static async where(attributes, options = {}) {
    const records = await this.accessor.findMany({
      where: attributes,
      ...options,
    })

    return records.map((record) => {
      return new this(record)
    })
  }

  // Private instance properties

  // Stores error messages internally
  #errors = { base: [] }

  // Stores instance attributes object internall
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

  // Whether or not this instance contains any errors according to validation
  // rules. Does not run valiations, (and so preserves custom errors) returns
  // the state of error objects. Essentially the opposite of `isValid`.
  get hasError() {
    return !Object.entries(this.#errors).every(
      ([_name, errors]) => !errors.length
    )
  }

  // Whether or not this instance is valid and has no errors. Essentially the
  // opposite of `hasError`, but runs validations first. This means it will
  // reset any custom errors added with `addError()`
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
    delete options.throw

    // try {
    await this.constructor.accessor.delete({
      where: { [this.constructor.primaryKey]: this.attributes.id },
      ...options,
    })
    // } catch (e) {
    //   return false
    // }

    return this
  }

  // Saves the attributes to the database
  async save(options = {}) {
    if (this.validate({ throw: options.throw })) {
      const { id, ...saveAttributes } = this.attributes

      try {
        let newAttributes

        if (id) {
          // update existing record
          newAttributes = await this.constructor.accessor.update({
            where: { [this.constructor.primaryKey]: id },
            data: saveAttributes,
          })
        } else {
          // create new record
          newAttributes = await this.constructor.accessor.create({
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
          return new RedwoodRecordRelationProxy(model, {
            where: { [foreignKey]: this.id },
          })
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
