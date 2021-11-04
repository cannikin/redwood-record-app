// Proxies access to a related model. Stores the requirements for the relation,
// so that any function called on it is called on the original model, but with
// the relations attributes automatically merged in.

export default class RelationProxy {
  static async addRelations(record) {
    const hasMany = await record.constructor.reflect.hasMany

    for (const [name, options] of Object.entries(hasMany)) {
      Object.defineProperty(record, name, {
        async get() {
          return new RelationProxy(options.modelName, {
            where: { [options.foreignKey]: record[options.primaryKey] },
          })
        },
        enumerable: true,
      })
    }
  }

  constructor(modelName, relation) {
    // Stores the model this proxy is proxying
    this.model = modelName
    // Stores the relation attributes, like `{ userId: 123 }`
    this.relation = relation
  }

  all(...args) {
    return this.where(...args)
  }

  create(attributes, options = {}) {
    const relatedAttributes = { ...attributes, ...this.relation.where }

    return this.model.create(relatedAttributes, options)
  }

  find(id, options = {}) {
    return this.findBy({ [this.model.primaryKey]: id }, options)
  }

  findBy(attributes, options = {}) {
    const relatedAttributes = {
      ...attributes,
      ...this.relation.where,
    }

    return this.model.findBy(relatedAttributes, options)
  }

  first(...args) {
    return this.findBy(...args)
  }

  where(attributes, options = {}) {
    const relatedAttributes = { ...attributes, ...this.relation.where }

    return this.model.where(relatedAttributes, options)
  }
}
