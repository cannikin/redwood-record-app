import { RedwoodRecord } from '../lib/RedwoodRecord'
import Post from 'src/models/Post'

export default class User extends RedwoodRecord {
  static requiredModels = [Post]
}
