import Post from 'src/models/Post'

export const posts = async () => {
  return context.currentUser.posts()
}

export const post = ({ id }) => {
  return Post.find(id)
}

export const createPost = ({ input }) => {
  return Post.create(input)
}

export const updatePost = async ({ id, input }) => {
  const post = await Post.find(id)
  return post.update(input)
}

export const deletePost = async ({ id }) => {
  const post = await Post.find(id)
  return post.destroy()
}
