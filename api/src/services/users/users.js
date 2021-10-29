import User from 'src/models/User'

export const users = () => {
  return User.all()
}

export const user = async ({ id }) => {
  try {
    return await User.find(id)
  } catch (e) {
    return null
  }
}

export const createUser = ({ input }) => {
  return User.create(input)
}

export const updateUser = async ({ id, input }) => {
  const user = await User.find(id)
  await user.update(input)
  return user
}

export const deleteUser = async ({ id }) => {
  const user = await User.find(id)
  await user.destroy()
  return null
}
