import { Core, Reflection, RelationProxy, Validation } from './internal'

export class RedwoodRecord extends Validation(Core) {
  _createPropertyForAttribute(name) {
    super._createPropertyForAttribute(name)
    this._errors[name] = []
  }

  _onSaveError(...args) {
    super._onSaveError(...args)
    this.addError(...args)
  }

  static get reflect() {
    return new Reflection(this.name)
  }

  static build(attributes) {
    const record = super.build(attributes)
    RelationProxy.addRelations(record, Core.schema)
    return record
  }
}
