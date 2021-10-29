import { db } from '../../lib/db'
import camelCase from 'camelcase'

class RedwoodRecord {
  constructor() {
    console.info('RedwoodRecord initialized')
  }

  static get class() {
    return constructor.name
  }

  static get modelName() {
    return camelCase(this.class)
  }

  static find(id) {
    console.info(this.modelName)
    db[this.modelName].findUnique({ id: id })
  }
}

class User extends RedwoodRecord {}

export const handler = async (event, context) => {
  console.info(User.find(1))

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      data: 'redwoodRecord function',
    }),
  }
}
