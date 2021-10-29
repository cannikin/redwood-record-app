import RedwoodRecord from './RedwoodRecord'

describe('static methods', () => {
  test('returns the name of itself', () => {
    expect(RedwoodRecord.name).toEqual('RedwoodRecord')
  })

  test('defaults `accessor` property to undefined', () => {
    expect(RedwoodRecord.accessor).toEqual(undefined)
  })

  test('defaults to a camelCase dbAccessor name', () => {
    expect(RedwoodRecord.dbAccessor).toEqual('redwoodRecord')
  })

  test('can override the accessor name if needed', () => {
    class TestClass extends RedwoodRecord {
      static accessor = 'TesterTable'
    }

    expect(TestClass.dbAccessor).toEqual('TesterTable')
  })
})

describe('instance methods', () => {
  it('instantiates with a list of attributes', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.attributes).toEqual(attrs)
  })

  it('creates getters for each attribute', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.foo).toEqual('bar')
  })

  it('creates setters for each attribute', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)
    record.foo = 'baz'

    expect(record.foo).toEqual('baz')
  })

  it('instantiates with an error object', () => {
    const attrs = { foo: 'bar' }
    const record = new RedwoodRecord(attrs)

    expect(record.errors.base).toEqual([])
    expect(record.errors.foo).toEqual([])
  })
})
