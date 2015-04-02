/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * place for short hand aliases for the command line parser
 * @module alice-conf/lib/shorthands
 * @author Eric Satterwhite
 * @since 0.1.0
 */
module.exports = {
	/**
	 * @property {String} p alias for the PORT setting
	 */
	'port':{
		type:Number
		,alias:'PORT'
		,description:'Port number for the api server to bind to'
	},
	'p':{
		type:Number
		,alias:'PORT'
		,description:'Port number for the api server to bind to'
	},

	/**
	 * @property {String} l alias for the logger settings ( stdout, file, syslog )
	 */
	'l':{
		alias:'logger',
		type:String,
		description:'logger types to enable ( stdout, file, syslog )'
	}
}