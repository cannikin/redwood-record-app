import RedwoodRecord from './RedwoodRecord'
import RedwoodRecordRelationProxy from './RedwoodRecordRelationProxy'

global.modelDeleteOrder = ['Post', 'User']

class Post extends RedwoodRecord {}
class User extends RedwoodRecord {
  static hasMany = [Post]
}

describe('hasMany', () => {
  scenario('instantiates hasMany relationships methods', async (scenario) => {
    const record = await User.find(scenario.user.rob.id)

    expect(record.posts instanceof RedwoodRecordRelationProxy).toEqual(true)
    expect(record.posts.model).toEqual(Post)
    expect(record.posts.relation).toEqual({
      where: { userId: scenario.user.rob.id },
    })
  })

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
})
