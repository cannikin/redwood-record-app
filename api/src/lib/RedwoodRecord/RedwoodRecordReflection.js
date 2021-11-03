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

  async #parse() {
    const dataSchema = await this.#getSchema()
    const modelSchema = dataSchema.datamodel.models.find(
      (model) => model.name === this.modelName
    )
    modelSchema.fields.forEach((field) => {
      if (field.isList) {
        this.#hasMany[field.name] = { modelName: field.type }
      }
    })
    modelSchema.fields.forEach((field) => {
      if (field.kind === 'object') {
        this.#belongsTo[field.name] = {
          modelName: field.type,
          foreignKey: field.relationFromFields[0],
        }
      }
    })
    modelSchema.fields.forEach((field) => {
      const { name, ...props } = field
      if (
        !Object.keys(this.#hasMany).includes(name) &&
        !Object.keys(this.#belongsTo).includes(name)
      ) {
        this.#attributes[name] = props
      }
    })

    this.#parsed = true
  }

  async #getSchema() {
    const datamodelPath = path.join(getPaths().api.db, 'schema.prisma')

    return await getDMMF({
      datamodelPath,
    })
  }
}
