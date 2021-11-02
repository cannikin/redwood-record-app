import User from 'src/models/User'

export const users = () => {
  return User.all()
}

export const user = ({ id }) => {
  return User.find(id)
}

export const createUser = async ({ input }) => {
  return User.create(input, { throw: true })
}

export const updateUser = async ({ id, input }) => {
  const user = await User.find(id)
  return user.update(input, { throw: true })
}

export const deleteUser = async ({ id }) => {
  const user = await User.find(id)
  return user.destroy({ throw: true })
}
