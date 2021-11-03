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

import RedwoodRecordReflection from './RedwoodRecordReflection'

global.modelDeleteOrder = ['Post', 'User']

describe('constructor', () => {
  it('should store the model name', () => {
    const reflect = new RedwoodRecordReflection('User')

    expect(reflect.modelName).toEqual('User')
  })
})

describe('relationship', () => {
  it('includes hasMany relationships', async () => {
    const reflection = new RedwoodRecordReflection('User')
    const hasMany = await reflection.hasMany

    expect(hasMany).toEqual({ posts: { modelName: 'Post' } })
  })

  it('includes belongsTo relationships', async () => {
    const reflection = new RedwoodRecordReflection('Post')
    const belongsTo = await reflection.belongsTo

    expect(belongsTo).toEqual({
      user: { modelName: 'User', foreignKey: 'userId' },
    })
  })

  it('includes attributes', async () => {
    const userReflection = new RedwoodRecordReflection('User')
    const userAttributes = await userReflection.attributes
    const postReflection = new RedwoodRecordReflection('Post')
    const postAttributes = await postReflection.attributes

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
