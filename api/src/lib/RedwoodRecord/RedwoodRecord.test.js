import { RedwoodRecord, Reflection } from './internal'
import * as Errors from './errors'
import { db } from '../db'

global.modelDeleteOrder = ['Post', 'User']

// General top level behavior of RedwoodRecord

class Post extends RedwoodRecord {
  static requiredModels = []
}
class User extends RedwoodRecord {
  static requiredModels = []
}
Post.requiredModels = [User]
User.requiredModels = [Post]

describe('static methods', () => {
  scenario('returns the name of itself', () => {
    expect(RedwoodRecord.name).toEqual('RedwoodRecord')
  })

  scenario('returns the db object', () => {
    expect(RedwoodRecord.db).toEqual(db)
  })

  scenario('defaults `accessor` property to undefined', () => {
    expect(RedwoodRecord.accessorName).toEqual(undefined)
  })

  scenario('can override the accessor name if needed', () => {
    class TestClass extends RedwoodRecord {
      static accessorName = 'TesterTable'
    }

    expect(TestClass.accessorName).toEqual('TesterTable')
  })

  scenario('defaults `primaryKey`', () => {
    expect(RedwoodRecord.primaryKey).toEqual('id')
  })

  scenario('reflect returns instance of Reflection', () => {
    expect(RedwoodRecord.reflect instanceof Reflection).toEqual(true)
  })

  scenario('schema returns the parsed schema.prisma', () => {
    expect(RedwoodRecord.schema).toHaveProperty('models')
  })

  scenario('defaults validates', () => {
    expect(RedwoodRecord.validates).toEqual([])
  })

  scenario('adds validate directives', () => {
    class TestClass extends RedwoodRecord {
      static validates = [{ email: { email: true } }]
    }

    expect(TestClass.validates).toEqual([{ email: { email: true } }])
  })
})

describe('instance methods', () => {
  scenario('instantiates with a list of attributes', async () => {
    const attrs = { foo: 'bar' }
    const record = await User.build(attrs)

    expect(record.attributes).toEqual(attrs)
  })

  scenario('creates getters for each attribute', async () => {
    const record = await RedwoodRecord.build({ foo: 'bar' })

    expect(record.foo).toEqual('bar')
  })

  scenario('creates setters for each attribute', async () => {
    const record = await RedwoodRecord.build({ foo: 'bar' })
    record.foo = 'baz'

    expect(record.foo).toEqual('baz')
  })

  scenario('instantiates with an error object', async () => {
    const attrs = { foo: 'bar' }
    const record = await RedwoodRecord.build(attrs)

    expect(record.errors.base).toEqual([])
    expect(record.errors.foo).toEqual([])
  })
})

// Subclass behavior, needs to be backed by an actual model to work

describe('User subclass', () => {
  describe('static methods', () => {
    describe('accessor', () => {
      scenario('returns table representation on prisma client', () => {
        expect(User.accessor).toEqual(db.user)
      })
    })

    describe('where', () => {
      scenario('returns an array of User records', async (scenario) => {
        const users = await User.where({ email: scenario.user.rob.email })

        expect(users.length).toEqual(1)
        expect(users[0].id).toEqual(scenario.user.rob.id)
      })
    })

    describe('all', () => {
      scenario('is an alias for where', async (scenario) => {
        expect(await User.all()).toEqual(await User.where())
      })
    })

    describe('create', () => {
      scenario(
        'initializes and saves a new record from a list of attributes',
        async () => {
          const user = await User.create({
            email: 'peter@redwoodjs.com',
            name: 'Peter Pistorius',
            hashedPassword: 'abc',
            salt: 'abc',
          })

          expect(user instanceof User).toEqual(true)
          expect(user.id).not.toEqual(undefined)
          expect(user.email).toEqual('peter@redwoodjs.com')
          expect(user.name).toEqual('Peter Pistorius')
        }
      )
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

    describe('findBy', () => {
      scenario('returns the first record if no where', async (scenario) => {
        const user = await User.findBy()

        expect(user.id).toEqual(scenario.user.rob.id)
      })

      scenario(
        'returns the first record that matches the given attributes',
        async (scenario) => {
          const user = await User.findBy({ email: 'tom@redwoodjs.com' })

          expect(user.id).toEqual(scenario.user.tom.id)
        }
      )

      scenario('returns null if no records', async () => {
        global.modelDeleteOrder.forEach(async (model) => {
          await db.$executeRawUnsafe(`DELETE from "${model}"`)
        })

        expect(await User.findBy()).toEqual(null)
      })
    })

    describe('first', () => {
      scenario('is an alias for findBy', async (scenario) => {
        expect(await User.first({ email: scenario.user.rob.email })).toEqual(
          await User.findBy({ email: scenario.user.rob.email })
        )
      })
    })
  })

  describe('instance methods', () => {
    describe('addError', () => {
      scenario('can add an error on base', async () => {
        const record = await RedwoodRecord.build()
        record.addError('base', 'base is not valid')

        expect(record.errors.base).toEqual(['base is not valid'])
      })

      scenario('can add an error on a field', async () => {
        const record = await RedwoodRecord.build({ foo: 'bar' })
        record.addError('foo', 'foo is not valid')

        expect(record.errors.foo).toEqual(['foo is not valid'])
      })
    })

    describe('create', () => {
      scenario('can create a record', async () => {
        const user = await User.create({
          email: `${Math.random()}@redwoodjs.com`,
          hashedPassword: 'abc',
          salt: 'abc',
        })

        expect(user.id).not.toEqual(undefined)
      })
    })

    describe('destroy', () => {
      scenario('deletes a record', async (scenario) => {
        // delete posts ahead of time to avoid foreign key error
        await db.$executeRawUnsafe(`DELETE from "Post"`)

        const user = await User.build(scenario.user.tom)
        await user.destroy()

        await expect(User.find(user.id)).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })
    })

    describe('save', () => {
      describe('create', () => {
        scenario('returns true if create is successful', async () => {
          const email = `${Math.random()}@email.com`
          const user = await User.build({
            email,
            hashedPassword: 'abc',
            salt: 'abc',
          })
          const result = await user.save()

          expect(result.id).not.toEqual(undefined)
          expect(result.email).toEqual(email)
        })

        scenario('returns false if create fails', async () => {
          const user = await User.build()
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario('adds error if required field is missing', async () => {
          const user = await User.build()
          await user.save()

          expect(user.errors.base).toEqual(['email is missing'])
        })

        scenario('throws error if given the option', async () => {
          const user = await User.build()
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
          const user = await User.build(scenario.user.rob)
          const oldEmail = user.email
          user.email = 'updated@redwoodjs.com'
          const result = await user.save()

          expect(result.email).toEqual('updated@redwoodjs.com')
        })

        scenario('returns false if update fails', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.id = 999999999
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario(
          'throws on failed save if given the option',
          async (scenario) => {
            const user = await User.build(scenario.user.rob)
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
          const user = await User.build(scenario.user.rob)
          user.id = 999999999
          await user.save()

          expect(user.errors.base).toEqual(['User record to update not found'])
        })

        scenario('catches null required field errors', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.email = null // email is required in schema
          await user.save()

          expect(user.errors.email).toEqual(['must not be null'])
        })

        scenario(
          'throws on null required field if given the option',
          async (scenario) => {
            const user = await User.build(scenario.user.rob)
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

        scenario('clears any errors after save', async (scenario) => {
          const user = await User.build(scenario.user.rob)
          user.email = null // email is required in schema
          await user.save()
          expect(user.errors.email).toEqual(['must not be null'])

          user.email = `${Math.random()}@redwoodjs.com`
          await user.save()
          expect(user.errors.email).toEqual([])
        })
      })
    })

    describe('update', () => {
      scenario('updates an existing record with new data', async (scenario) => {
        const user = await User.build(scenario.user.rob)
        const result = await user.update({ name: 'Robert Cameron' })

        expect(result instanceof User).toEqual(true)
        expect(user.name).toEqual('Robert Cameron')
      })
    })
  })
})
