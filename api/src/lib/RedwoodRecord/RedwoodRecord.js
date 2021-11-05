import { Core, Reflection, RelationProxy, Validation } from './internal'

export class RedwoodRecord extends Validation(Core) {
  static get reflect() {
    return new Reflection(this.name)
  }

  // Call original build, but add related attributes
  static build(attributes) {
    const record = super.build(attributes)
    RelationProxy.addRelations(record, this.constructor.schema)
    return record
  }

  // Call original method, but add error keys for validation
  _createPropertyForAttribute(name) {
    super._createPropertyForAttribute(name)
    this._errors[name] = []
  }

  // Add validation error on save error
  _onSaveError(...args) {
    super._onSaveError(...args)
    this.addError(...args)
  }
}
