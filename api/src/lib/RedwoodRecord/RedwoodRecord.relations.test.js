import RedwoodRecord from './RedwoodRecord'
import RedwoodRecordRelationProxy from './RedwoodRecordRelationProxy'

global.modelDeleteOrder = ['Post', 'User']

describe('hasMany', () => {
  scenario('instantiates hasMany relationships methods', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)

    expect(record.posts instanceof RedwoodRecordRelationProxy).toEqual(true)
    expect(record.posts.model).toEqual(Post)
    expect(record.posts.relation).toEqual({
      where: { userId: scenario.user.rob.id },
    })
  })

  scenario('fetches related records with all()', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)
    const posts = await record.posts.all()

    expect(posts.length).toEqual(1)
    expect(posts[0].id).toEqual(scenario.post.rob.id)
  })

  scenario('fetches related records with find()', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)
    const post = await record.posts.find(scenario.post.rob.id)

    expect(post.id).toEqual(scenario.post.rob.id)
  })
})
