import { RelationProxy, RedwoodRecord } from './internal'
import * as Errors from './errors'

global.modelDeleteOrder = ['Post', 'User']

class Post extends RedwoodRecord {
  static requiredModels = []
}
class User extends RedwoodRecord {
  static requiredModels = []
}

beforeEach(() => {
  Post.requiredModels = [User]
  User.requiredModels = [Post]
})

describe('belongsTo', () => {
  scenario('adds nothing if model has no belongsTo relations', () => {
    const record = new User()

    RelationProxy.addRelations(record)

    expect(record.user).toEqual(undefined)
  })

  scenario('throws error if model does not require needed model', () => {
    Post.requiredModels = []
    const record = new Post()

    expect(() => RelationProxy.addRelations(record)).toThrow(
      Errors.RedwoodRecordMissingRequiredModelError
    )
  })

  scenario('instantiates belongsTo record', async (scenario) => {
    const record = new Post()
    record.userId = scenario.user.rob.id

    RelationProxy.addRelations(record)
    const user = await record.user

    expect(user instanceof User).toEqual(true)
    expect(user.id).toEqual(scenario.user.rob.id)
  })
})

describe('hasMany', () => {
  scenario('adds nothing if model has no hasMany relations', () => {
    const record = new Post()
    RelationProxy.addRelations(record)

    expect(record.posts).toEqual(undefined)
  })

  scenario('throws error if model does not require needed model', () => {
    User.requiredModels = []
    const record = new User()

    expect(() => RelationProxy.addRelations(record)).toThrow(
      Errors.RedwoodRecordMissingRequiredModelError
    )
  })

  scenario('instantiates hasMany proxy', () => {
    const record = new User()
    record.id = 1

    RelationProxy.addRelations(record)
    const proxy = record.posts

    expect(proxy instanceof RelationProxy).toEqual(true)
    expect(proxy.model).toEqual(Post)
    expect(proxy.relation).toEqual({ where: { userId: 1 } })
  })

  scenario('create hasMany record linked by foreign key', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const newPost = await record.posts.create({ title: 'My second post' })

    expect(newPost.userId).toEqual(record.id)
  })

  scenario('fetches related records with find()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const post = await record.posts.find(scenario.post.rob.id)

    expect(post.id).toEqual(scenario.post.rob.id)
  })

  scenario('fetches related records with findBy()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const post = await record.posts.findBy({ title: scenario.post.rob.title })

    expect(post.id).toEqual(scenario.post.rob.id)
  })

  scenario('fetches related records with where()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const posts = await record.posts.where()

    expect(posts.length).toEqual(1)
    expect(posts[0].id).toEqual(scenario.post.rob.id)
  })
})
