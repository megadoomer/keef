/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Loads configuration form different data stores before the server starts
 * @module alice-conf/lib/overrides
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires path
 */

 var path = require( 'path' )
   , env  = process.env
/**
 * @readonly
 * @property {String} PROJECT_ROOT static path to the root of this project
 */
exports.PROJECT_ROOT = path.normalize( env.PROJECT_ROOT ? path.resolve( env.PROJECT_ROOT ) : process.cwd() )

/**
 * @readonly
 * @property {String} PACKAGE_PATH static path to location on standalone internal packages
 */
exports.PACKAGE_PATH = env.PACKAGE_PATH ? path.resolve( env.PACKAGE_PATH ) : path.normalize( path.join( exports.PROJECT_ROOT, 'packages' ) )

/**
 * @readonly
 * @property {Object} pkg data parsed from the project package.json file
 */
exports.pkg = require( path.join( exports.PROJECT_ROOT, 'package.json'))
