import { RedwoodRecord } from './internal'

global.modelDeleteOrder = ['Post', 'User']

class Post extends RedwoodRecord {
  static requiredModels = []
}
class User extends RedwoodRecord {
  static requiredModels = []
}
Post.requiredModels = [User]
User.requiredModels = [Post]

beforeEach(() => {
  User.validates = []
  Post.validates = []
})

describe('hasError', () => {
  scenario('defaults to false', async () => {
    const record = await RedwoodRecord.build()

    expect(record.hasError).toEqual(false)
  })

  scenario('returns true if there are base errors', async () => {
    const record = await RedwoodRecord.build()
    record.addError('base', 'base is invalid')

    expect(record.hasError).toEqual(true)
  })

  scenario('returns true if there are field errors', async () => {
    const record = await RedwoodRecord.build({ foo: 'bar' })
    record.addError('foo', 'foo is invalid')

    expect(record.hasError).toEqual(true)
  })

  scenario('resets once validations are run', async () => {
    const record = await RedwoodRecord.build({ foo: 'bar' })
    record.addError('foo', 'foo is invalid')
    record.validate()

    expect(record.hasError).toEqual(false)
  })
})

describe('isValid', () => {
  scenario('returns true if record has no validations', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)

    expect(user.isValid).toEqual(true)
  })

  scenario('returns true if record is valid', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]

    const user = await User.find(scenario.user.rob.id)

    expect(user.isValid).toEqual(true)
  })

  scenario('returns false if record is invalid', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]

    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(user.isValid).toEqual(false)
    expect(user.errors.email).toEqual(['email must be present'])
  })
})

describe('validate', () => {
  scenario('returns true if record has no validations', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)

    expect(user.validate()).toEqual(true)
  })

  scenario('returns true if record is valid', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]
    const user = await User.find(scenario.user.rob.id)

    expect(user.validate()).toEqual(true)
  })

  scenario('returns false if record is invalid', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(user.validate()).toEqual(false)
    expect(user.errors.email).toEqual(['email must be present'])
  })

  scenario('throws if option provided', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    try {
      user.validate({ throw: true })
    } catch (e) {
      expect(e.message).toEqual('email must be present')
    }
  })
})

describe('save', () => {
  scenario('returns false if record is invalid', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(await user.save()).toEqual(false)
    expect(user.errors.email).toEqual(['email must be present'])
  })

  scenario('throws if option provided', async (scenario) => {
    User.validates = [
      {
        email: { presence: true },
      },
    ]
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    try {
      await user.save({ throw: true })
    } catch (e) {
      expect(e.message).toEqual('email must be present')
    }
  })
})
