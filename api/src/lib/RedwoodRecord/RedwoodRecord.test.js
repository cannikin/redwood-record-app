import RedwoodRecord from './RedwoodRecord'
import * as Errors from './errors'
import { db } from '../db'

global.modelDeleteOrder = ['Post', 'User']

// General top level behavior of RedwoodRecord

describe('static methods', () => {
  scenario('returns the name of itself', () => {
    expect(RedwoodRecord.name).toEqual('RedwoodRecord')
  })

  scenario('defaults `accessor` property to undefined', () => {
    expect(RedwoodRecord.accessor).toEqual(undefined)
  })

  scenario('can override the accessor name if needed', () => {
    class TestClass extends RedwoodRecord {
      static accessor = 'TesterTable'
    }

    expect(TestClass.accessor).toEqual('TesterTable')
  })

  scenario('defaults `primaryKey`', () => {
    expect(RedwoodRecord.primaryKey).toEqual('id')
  })

  scenario('defaults `hasMany`', () => {
    expect(RedwoodRecord.hasMany).toEqual([])
  })

  scenario('adds hasMany relationships', () => {
    class TestClass extends RedwoodRecord {
      static hasMany = ['posts']
    }

    expect(TestClass.hasMany).toEqual(['posts'])
  })
})

describe('instance methods', () => {
  scenario('instantiates with a list of attributes', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.attributes).toEqual(attrs)
  })

  scenario('creates getters for each attribute', () => {
    const record = new RedwoodRecord({ foo: 'bar' })

    expect(record.foo).toEqual('bar')
  })

  scenario('creates setters for each attribute', () => {
    const record = new RedwoodRecord({ foo: 'bar' })
    record.foo = 'baz'

    expect(record.foo).toEqual('baz')
  })

  scenario('instantiates with an error object', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.errors.base).toEqual([])
    expect(record.errors.foo).toEqual([])
  })

  scenario('instantiates hasMany relationships methods', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)

    expect(typeof record.posts).toEqual('function')
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

      scenario('returns null if no records', async () => {
        global.modelDeleteOrder.forEach(async (model) => {
          await db.$executeRawUnsafe(`DELETE from "${model}"`)
        })

        expect(await User.first()).toEqual(null)
      })
    })
  })

  describe('instance methods', () => {
    describe('destroy', () => {
      scenario('deletes a record', async (scenario) => {
        // delete posts ahead of time to avoid foreign key error
        await db.$executeRawUnsafe(`DELETE from "Post"`)

        const user = new User(scenario.user.tom)
        await user.destroy()

        await expect(User.find(user.id)).rejects.toThrow(
          Errors.RedwoodRecordNotFoundError
        )
      })
    })

    describe('save', () => {
      describe('create', () => {
        scenario('returns true if create is successful', async () => {
          const user = new User({
            email: `${Math.random()}@email.com`,
            hashedPassword: 'abc',
            salt: 'abc',
          })
          const result = await user.save()

          expect(result).toEqual(true)
        })

        scenario('returns false if create fails', async () => {
          const user = new User()
          const result = await user.save()

          expect(result).toEqual(false)
        })

        scenario('adds error if required field is missing', async () => {
          const user = new User()
          await user.save()

          expect(user.errors.base).toEqual(['email is missing'])
        })

        scenario('throws error if given the option', async () => {
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

        scenario('clears any errors after save', async (scenario) => {
          const user = new User(scenario.user.rob)
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
        const user = new User(scenario.user.rob)
        const result = await user.update({ name: 'Robert Cameron' })

        expect(result).toEqual(true)
        expect(user.name).toEqual('Robert Cameron')
      })
    })
  })
})
