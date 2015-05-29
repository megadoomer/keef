var assert = require('assert')
  , conf   = require('../')



describe('Conf loader', function(){
	describe('configuration heirarchy', function(){
		it('should read a directory', function(){
			assert.equal( conf.get('foo:bar:baz'), "hello world" )
		});

		it('should read env variables',function(){
			assert.equal( conf.get('STORAGE_TEST_A'), 'foo' )
			assert.equal( conf.get('STORAGE_TEST_B'), 'bar' )

		});

		it('should apply files in an overriding fashion', function(){
			assert.equal(conf.get('foo:bar:bells'), 'real', "expected real")
			assert.equal(conf.get('readible'), false )
		});
	});
	it('should allow values to be set',function( done ){
		assert.doesNotThrow(function(){
			conf.set('foo:bar:set', {key:'value'})
		});
		assert.equal( conf.get('foo:bar:set:key'), 'value')
		done();
	});
});
