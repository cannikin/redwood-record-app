import RedwoodRecord from './RedwoodRecord'

global.modelDeleteOrder = ['Post', 'User']

describe('hasError', () => {
  scenario('defaults to false', () => {
    const record = new RedwoodRecord()

    expect(record.hasError).toEqual(false)
  })

  scenario('returns true if there are base errors', () => {
    const record = new RedwoodRecord()
    record.addError('base', 'base is invalid')

    expect(record.hasError).toEqual(true)
  })

  scenario('returns true if there are field errors', () => {
    const record = new RedwoodRecord({ foo: 'bar' })
    record.addError('foo', 'foo is invalid')

    expect(record.hasError).toEqual(true)
  })

  scenario('resets once validations are run', () => {
    const record = new RedwoodRecord({ foo: 'bar' })
    record.addError('foo', 'foo is invalid')
    record.validate()

    expect(record.hasError).toEqual(false)
  })
})

describe('isValid', () => {
  scenario('returns true if record has no validations', async (scenario) => {
    class User extends RedwoodRecord {}

    const user = await User.find(scenario.user.rob.id)

    expect(user.isValid).toEqual(true)
  })

  scenario('returns true if record is valid', async (scenario) => {
    class User extends RedwoodRecord {
      static validates = [
        {
          email: { presence: true },
        },
      ]
    }
    const user = await User.find(scenario.user.rob.id)

    expect(user.isValid).toEqual(true)
  })

  scenario('returns false if record is invalid', async (scenario) => {
    class User extends RedwoodRecord {
      static validates = [
        {
          email: { presence: true },
        },
      ]
    }
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(user.isValid).toEqual(false)
    expect(user.errors.email).toEqual(['email must be present'])
  })
})

describe('validate', () => {
  scenario('returns true if record has no validations', async (scenario) => {
    class User extends RedwoodRecord {}

    const user = await User.find(scenario.user.rob.id)

    expect(user.validate()).toEqual(true)
  })

  scenario('returns true if record is valid', async (scenario) => {
    class User extends RedwoodRecord {
      static validates = [
        {
          email: { presence: true },
        },
      ]
    }
    const user = await User.find(scenario.user.rob.id)

    expect(user.validate()).toEqual(true)
  })

  scenario('returns false if record is invalid', async (scenario) => {
    class User extends RedwoodRecord {
      static validates = [
        {
          email: { presence: true },
        },
      ]
    }
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    expect(user.validate()).toEqual(false)
    expect(user.errors.email).toEqual(['email must be present'])
  })

  scenario('throws if option provided', async (scenario) => {
    class User extends RedwoodRecord {
      static validates = [
        {
          email: { presence: true },
        },
      ]
    }
    const user = await User.find(scenario.user.rob.id)
    user.email = null

    try {
      user.validate({ throw: true })
    } catch (e) {
      expect(e.message).toEqual('email must be present')
    }
  })
})
