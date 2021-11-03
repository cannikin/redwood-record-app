import path from 'path'
import { getPaths } from '@redwoodjs/internal'
import { getDMMF } from '@prisma/sdk'

export default class RedwoodRecordReflection {
  #hasMany = {}
  #belongsTo = {}
  #attributes = {}

  #parsed = false

  constructor(name) {
    this.modelName = name
  }

  get attributes() {
    return (async () => {
      if (!this.#parsed) {
        await this.#parse()
      }
      return this.#attributes
    })()
  }

  get belongsTo() {
    return (async () => {
      if (!this.#parsed) {
        await this.#parse()
      }
      return this.#belongsTo
    })()
  }

  get hasMany() {
    return (async () => {
      if (!this.#parsed) {
        await this.#parse()
      }
      return this.#hasMany
    })()
  }

  // Finds the schema for a single model
  #schemaForModel(schema, name) {
    return schema.datamodel.models.find((model) => model.name === name)
  }

  async #parse() {
    const schema = await getDMMF({
      datamodelPath: path.join(getPaths().api.db, 'schema.prisma'),
    })

    this.#parseHasMany(schema)
    this.#parseBelongsTo(schema)
    // Must parse last so that we can exclude hasMany and belongsTo relations
    // from scalar attributes
    this.#parseAttributes(schema)

    this.#parsed = true
  }

  #parseHasMany(schema) {
    const selfSchema = this.#schemaForModel(schema, this.modelName)

    selfSchema?.fields?.forEach((field) => {
      if (field.isList) {
        // get other side of relationship to determine foreign key name
        const otherSchema = this.#schemaForModel(schema, field.type)
        const belongsTo = otherSchema.fields.find(
          (field) => field.type === this.modelName
        )

        this.#hasMany[field.name] = {
          modelName: field.type,
          foreignKey: belongsTo.relationFromFields[0],
          primaryKey: belongsTo.relationToFields[0],
        }
      }
    })
  }

  #parseBelongsTo(schema) {
    const selfSchema = this.#schemaForModel(schema, this.modelName)

    selfSchema?.fields?.forEach((field) => {
      if (field.kind === 'object') {
        this.#belongsTo[field.name] = {
          modelName: field.type,
          foreignKey: field.relationFromFields[0],
          primaryKey: field.relationToFields[0],
        }
      }
    })
  }

  #parseAttributes(schema) {
    const selfSchema = this.#schemaForModel(schema, this.modelName)

    selfSchema?.fields?.forEach((field) => {
      const { name, ...props } = field
      if (
        !Object.keys(this.#hasMany).includes(name) &&
        !Object.keys(this.#belongsTo).includes(name)
      ) {
        this.#attributes[name] = props
      }
    })
  }
}
