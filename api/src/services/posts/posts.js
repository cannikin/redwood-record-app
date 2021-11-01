import Post from 'src/models/Post'
import User from 'src/models/User'

export const posts = async () => {
  return (await User.find(1)).posts()
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
