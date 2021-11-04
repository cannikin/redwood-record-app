import RedwoodRecord from './RedwoodRecord'
import RelationProxy from './RelationProxy'

global.modelDeleteOrder = ['Post', 'User']

class Post extends RedwoodRecord {}
class User extends RedwoodRecord {
  static hasMany = [Post]
}

describe('hasMany', () => {
  scenario.only(
    'instantiates hasMany relationships methods',
    async (scenario) => {
      const record = await User.find(scenario.user.rob.id)
      const proxy = await record.posts
      console.info(proxy.model)

      expect(proxy instanceof RelationProxy).toEqual(true)
      expect(proxy.model).toEqual(Post)
      expect(proxy.relation).toEqual({
        where: { userId: scenario.user.rob.id },
      })
    }
  )

  scenario('creates records tied to parent', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const newPost = await record.posts.create({ title: 'My second post' })

    expect(newPost.userId).toEqual(record.id)
  })

  scenario('fetches related records with where()', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)
    const posts = await record.posts.where()

    expect(posts.length).toEqual(1)
    expect(posts[0].id).toEqual(scenario.post.rob.id)
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
})
