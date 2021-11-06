import RedwoodRecord from './RedwoodRecord'
import Reflection from './Reflection'
import RelationProxy from './RelationProxy'

global.modelDeleteOrder = ['Post', 'User']

describe('reflect()', () => {
  it('returns instance of Reflection', () => {
    expect(RedwoodRecord.reflect instanceof Reflection).toEqual(true)
  })
})

describe('build()', () => {
  class Post extends RedwoodRecord {}
  class User extends RedwoodRecord {}
  User.requiredModels = [Post]

  it('adds relation properties', () => {
    const user = User.build({})

    expect(user.posts instanceof RelationProxy).toEqual(true)
  })
})

describe('_createPropertyForAttribute()', () => {
  it('creates error attribute placeholders', () => {
    const attrs = { foo: 'bar' }
    const record = RedwoodRecord.build(attrs)

    expect(record.errors.foo).toEqual([])
  })
})

describe('_onSaveError()', () => {
  class Post extends RedwoodRecord {}
  class User extends RedwoodRecord {}
  User.requiredModels = [Post]

  scenario('adds an error if save fails', async (scenario) => {
    const user = await User.find(scenario.user.rob.id)
    user.email = null
    await user.save()

    expect(user.errors.email).toEqual(['must not be null'])
  })
})
