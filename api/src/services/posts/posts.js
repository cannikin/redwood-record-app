export const posts = async () => {
  return context.currentUser.posts.all()
}

export const post = ({ id }) => {
  return context.currentUser.posts().find(id)
}

export const createPost = ({ input }) => {
  return context.currentUser.posts().create(input)
}

export const updatePost = async ({ id, input }) => {
  const post = await context.currentUser.posts().find(id)
  return post.update(input)
}

export const deletePost = async ({ id }) => {
  const post = await context.currentUser.posts().find(id)
  return post.destroy()
}
