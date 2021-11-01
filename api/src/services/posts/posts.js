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
  await post.update(input)
  return post.attributes
}

export const deletePost = async ({ id }) => {
  const post = await Post.find(id)
  post.destroy()
  return post.attributes
}
