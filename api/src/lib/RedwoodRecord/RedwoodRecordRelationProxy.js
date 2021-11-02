// Proxies access to a related model. Stores the requirements for the relation,
// so that any function called on it is called on the original model, but with
//
export default class RedwoodRecordRelationProxy {
  constructor(model, relation) {
    this.model = model
    this.relation = relation
  }

  all(where, options = {}) {
    const relatedWhere = { where, ...this.relation.where }

    return this.model.all({ where: relatedWhere }, options)
  }

  find(id, options = {}) {
    const relatedWhere = {
      [this.model.primaryKey]: id, // primary key
      ...(options.where || {}), // any additional `where` clause
      ...this.relation.where, // foreignKey relation
    }

    return this.model.findBy(relatedWhere)
  }
}
