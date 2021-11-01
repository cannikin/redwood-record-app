import RedwoodRecord from './RedwoodRecord'

global.modelDeleteOrder = ['Post', 'User']

describe('hasMany', () => {
  scenario('instantiates hasMany relationships methods', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)

    expect(typeof record.posts).toEqual('function')
  })

  scenario('fetches related records', async (scenario) => {
    class Post extends RedwoodRecord {}
    class User extends RedwoodRecord {
      static hasMany = [Post]
    }
    const record = await User.find(scenario.user.rob.id)
    const posts = await record.posts()

    expect(posts[0].id).toEqual(scenario.post.rob.id)
  })
})
