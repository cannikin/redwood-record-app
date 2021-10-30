import RedwoodRecord from './RedwoodRecord'
import * as Errors from './errors'

// General top level behavior of RedwoodRecord

describe('static methods', () => {
  test('returns the name of itself', () => {
    expect(RedwoodRecord.name).toEqual('RedwoodRecord')
  })

  test('defaults `accessor` property to undefined', () => {
    expect(RedwoodRecord.accessor).toEqual(undefined)
  })

  test('can override the accessor name if needed', () => {
    class TestClass extends RedwoodRecord {
      static accessor = 'TesterTable'
    }

    expect(TestClass.accessor).toEqual('TesterTable')
  })
})

describe('instance methods', () => {
  it('instantiates with a list of attributes', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.attributes).toEqual(attrs)
  })

  it('creates getters for each attribute', () => {
    const record = new RedwoodRecord({ foo: 'bar' })

    expect(record.foo).toEqual('bar')
  })

  it('creates setters for each attribute', () => {
    const record = new RedwoodRecord({ foo: 'bar' })
    record.foo = 'baz'

    expect(record.foo).toEqual('baz')
  })

  it('instantiates with an error object', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.errors.base).toEqual([])
    expect(record.errors.foo).toEqual([])
  })
})

// Subclass behavior, needs to be backed by an actual model to work

class User extends RedwoodRecord {}

describe('User subclass', () => {
  describe('static methods', () => {
    describe('all', () => {
      scenario('returns an array of User records', async (scenario) => {
        const users = await User.all()
        const ids = users.map((u) => u.id)

        // tests that every user is an instance of User and its ID is in the list
        // of all IDs in the database
        expect(
          users.every((user) => {
            return user instanceof User && ids.includes(user.id)
          })
        ).toEqual(true)
      })
    })

    describe('create', () => {
      it('initializes and saves a new record from a list of attributes', async () => {
        const user = await User.create({
          email: 'peter@redwoodjs.com',
          name: 'Peter Pistorius',
        })

        expect(user instanceof User).toEqual(true)
        expect(user.id).not.toEqual(undefined)
        expect(user.email).toEqual('peter@redwoodjs.com')
        expect(user.name).toEqual('Peter Pistorius')
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

    describe('first', () => {
      scenario('returns the first record if no where', async (scenario) => {
        const user = await User.first()

        expect(user.id).toEqual(scenario.user.rob.id)
      })

      scenario(
        'returns the first record that matches the given attributes',
        async (scenario) => {
          const user = await User.first({ email: 'tom@redwoodjs.com' })

          expect(user.id).toEqual(scenario.user.tom.id)
        }
      )

      it('returns null if no records', async () => {
        expect(await User.first()).toEqual(null)
      })
    })
  })

  describe('instance methods', () => {
    describe('destroy', () => {
      scenario('deletes a record', async (scenario) => {
        const user = new User(scenario.user.rob)
        await user.destroy()

        await expect(User.find(user.id)).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })
    })

    describe('save', () => {
      describe('create', () => {
        it('returns true if create is successful', async () => {
          const user = new User({ email: `${Math.random()}@email.com` })
          const result = await user.save()

          expect(result).toEqual(true)
        })

        it('returns false if create fails', async () => {
          const user = new User()
          const result = await user.save()

          expect(result).toEqual(false)
        })

        it('adds error if required field is missing', async () => {
          const user = new User()
          await user.save()

          expect(user.errors.base).toEqual(['email is missing'])
        })

        it('throws error if given the option', async () => {
          const user = new User()
          try {
            await user.save({ throw: true })
          } catch (e) {
            expect(
              e instanceof Errors.RedwoodRecordMissingAttributeError
            ).toEqual(true)
            expect(e.message).toEqual('email is missing')
          }
          expect.assertions(2)
        })
      })

      describe('update', () => {
        scenario('returns true if update is successful', async (scenario) => {
          const user = new User(scenario.user.rob)
          user.email = 'updated@redwoodjs.com'
          const result = await user.save()

          expect(result).toEqual(true)
        })

        scenario('returns false if update fails', async (scenario) => {
          const user = new User(scenario.user.rob)
          user.id = 999999999
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario(
          'throws on failed save if given the option',
          async (scenario) => {
            const user = new User(scenario.user.rob)
            user.id = 999999999

            try {
              await user.save({ throw: true })
            } catch (e) {
              expect(e instanceof Errors.RedwoodRecordNotFoundError).toEqual(
                true
              )
            }

            expect.assertions(1)
          }
        )

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
              expect(
                e instanceof Errors.RedwoodRecordNullAttributeError
              ).toEqual(true)
            }

            expect.assertions(1)
          }
        )
      })
    })

    describe('update', () => {
      scenario('updates an existing record with new data', async (scenario) => {
        const user = new User(scenario.user.rob)
        const result = await user.update({ name: 'Robert Cameron' })

        expect(result).toEqual(true)
        expect(user.name).toEqual('Robert Cameron')
      })
    })
  })
})
