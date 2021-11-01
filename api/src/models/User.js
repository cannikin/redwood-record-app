import RedwoodRecord from 'src/lib/RedwoodRecord/RedwoodRecord'
import Post from './Post'

export default class User extends RedwoodRecord {
  static hasMany = [Post]
}
