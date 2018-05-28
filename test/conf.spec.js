const tap = require('tap')
const keef = require('../')

const test = tap.test
const threw = tap.threw

test('Conf loader', (t) => {
  t.test('configuration heirarchy', (tt) => {
    tt.equal( keef.get('foo:bar:baz'), "hello world", 'should read a directory')
    tt.equal( keef.get('storage_test_a'), 'foo', 'env STORATE_TEST_A' )
    tt.equal( keef.get('storage_test_b'), 'bar', 'env STORAGE_TEST_B' )
    tt.test('should apply files in an overriding fashion', (ttt) => {
      ttt.equal(keef.get('foo:bar:bells'), 'real', "expected real")
      ttt.equal(keef.get('readible'), false )
      ttt.end()
    })
    tt.end()
  })

  t.test('should allow values to be set', (tt) => {
    tt.doesNotThrow(() => {
      keef.set('foo:bar:set', {key:'value'})
    })
    tt.equal( keef.get('foo:bar:set:key'), 'value')
    tt.end()
  })

  t.end()
}).catch(threw)
