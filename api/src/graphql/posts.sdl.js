export const schema = gql`
  type Post {
    id: Int!
    userId: Int!
    user: User!
    title: String!
  }

  type Query {
    posts: [Post!]! @requireAuth
    post(id: Int!): Post @requireAuth
  }

  input CreatePostInput {
    userId: Int!
    title: String!
  }

  input UpdatePostInput {
    userId: Int
    title: String
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post! @requireAuth
    updatePost(id: Int!, input: UpdatePostInput!): Post! @requireAuth
    deletePost(id: Int!): Post! @requireAuth
  }
`
