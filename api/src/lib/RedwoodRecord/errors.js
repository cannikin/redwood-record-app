import { RedwoodError } from '@redwoodjs/api'

export class RedwoodRecordError extends RedwoodError {
  constructor() {
    super()
    this.name = 'RedwoodRecordError'
  }
}

export class RedwoodRecordNotFoundError extends RedwoodError {
  constructor(name) {
    super(`${name} record not found`)
    this.name = 'RedwoodRecordNotFoundError'
  }
}

export class RedwoodRecordNullAttributeError extends RedwoodError {
  constructor(name) {
    super(`${name} must not be null`)
    this.name = 'RedwoodRecordNullAttributeError'
  }
}
