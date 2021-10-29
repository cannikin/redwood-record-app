import User from './User'
import * as Errors from './errors'

describe('the class', () => {
  it('returns the name of itself', () => {
    expect(User.name).toEqual('User')
  })
})

describe('.dbAccessor', () => {
  it('dbAccessor is `user`', () => {
    expect(User.dbAccessor).toEqual('user')
  })
})

describe('find', () => {
  scenario('finds a user by ID', async (scenario) => {
    const id = scenario.user.rob.id
    const user = await User.find(id)

    expect(user.id).toEqual(id)
  })

  scenario('throws RedwoodRecordNotFound if ID is not found', async () => {
    try {
      await User.find(999999999)
    } catch (e) {
      expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(true)
      expect(e.message).toEqual('User record not found')
    }
    expect.assertions(2)
  })
})

describe('save', () => {
  scenario('returns true if save is successful', async (scenario) => {
    const user = new User(scenario.user.rob)
    user.email = 'updated@redwoodjs.com'
    const result = await user.save()

    expect(result).toEqual(true)
  })

  scenario('returns false if saving fails', async (scenario) => {
    const user = new User(scenario.user.rob)
    user.id = 999999999
    const result = await user.save()

    expect(result).toEqual(false)
  })

  scenario('throws on failed save if given the option', async (scenario) => {
    const user = new User(scenario.user.rob)
    user.id = 999999999

    try {
      await user.save({ throw: true })
    } catch (e) {
      expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(true)
    }

    expect.assertions(1)
  })

  scenario('adds error to `base` if id not found', async (scenario) => {
    const user = new User(scenario.user.rob)
    user.id = 999999999
    await user.save()

    expect(user.errors.base).toEqual(['User record to update not found'])
  })

  scenario('catches null required field errors', async (scenario) => {
    const user = new User(scenario.user.rob)
    user.email = null // email is required in schema
    await user.save()

    expect(user.errors.email).toEqual(['must not be null'])
  })

  scenario(
    'throws on null required field if given the option',
    async (scenario) => {
      const user = new User(scenario.user.rob)
      user.email = null // email is required in schema

      try {
        await user.save({ throw: true })
      } catch (e) {
        expect(e instanceof Errors.RedwoodRecordNullAttributeError).toEqual(
          true
        )
      }

      expect.assertions(1)
    }
  )
})
