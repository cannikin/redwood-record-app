// This test requires that a schema.prisma file exists or is mocked:
//
// model User {
//   id                  Int     @id @default(autoincrement())
//   email               String  @unique
//   name                String?
//   posts               Post[]
//   hashedPassword      String
//   salt                String
//   resetToken          String?
//   resetTokenExpiresAt DateTime?
// }
//
// model Post {
//   id     Int     @id @default(autoincrement())
//   userId Int
//   user   User @relation(fields: [userId], references: [id])
//   title  String
// }

import { Reflection, RedwoodRecord } from './internal'

global.modelDeleteOrder = ['Post', 'User']

class Post extends RedwoodRecord {}
class User extends RedwoodRecord {
  static requiredModels = [Post]
}

describe('constructor', () => {
  it('should store the model name', () => {
    const reflect = new Reflection(User)

    expect(reflect.model).toEqual(User)
  })
})

describe('relationship', () => {
  it('includes hasMany relationships', () => {
    const reflection = new Reflection(User)
    const hasMany = reflection.hasMany

    expect(hasMany).toEqual({
      posts: { modelName: 'Post', foreignKey: 'userId', primaryKey: 'id' },
    })
  })

  it('includes belongsTo relationships', () => {
    const reflection = new Reflection(Post)
    const belongsTo = reflection.belongsTo

    expect(belongsTo).toEqual({
      user: { modelName: 'User', foreignKey: 'userId', primaryKey: 'id' },
    })
  })

  it('includes attributes', () => {
    const userReflection = new Reflection(User)
    const userAttributes = userReflection.attributes
    const postReflection = new Reflection(Post)
    const postAttributes = postReflection.attributes

    expect(Object.keys(userAttributes).length).toEqual(7)
    // doesn't include hasMany relationships
    expect(userAttributes.posts).toEqual(undefined)

    expect(Object.keys(postAttributes).length).toEqual(3)
    // doesn't include belongsTo relationships
    expect(postAttributes.user).toEqual(undefined)
    // does include foreign keys
    expect(postAttributes.userId).not.toEqual(undefined)
  })
})
