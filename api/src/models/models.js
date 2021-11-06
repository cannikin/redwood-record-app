import User from './User'
import Post from './Post'

Post.requiredModels = [User]
User.requiredModels = [Post]

export { User, Post }
