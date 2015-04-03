/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
The conf package reads configurations options in an overriding fashion from a number of sources. In order of importance:

1. System level overrides
2. Command line arguments
3. Environment variables
4. A configuration file(s)
5. System specified defaults

### Overrides
Overrides can not be overriden or changed at any point in time. The are defined in `conf/lib/overrides.js` and should be reserved for static run time properties. Conf serves as a central place to get that information. 

For example, the full path to the packages directory is resolved at run time and loaded in to the conf loader. It won't / can't change during run time, but may change in the future. By getting the information from conf, application logic does not need to change between restarts or releases.

If overrides need to be change or added the `overrides.js` file must be changed

### Command Line Arguments
Command line arguments are the highest level of maliable values. The can be used to set specific and nested values in the configuration JSON document but using a `:` spearator between keys. For example, using the flag: `--foo:bar=1`, would create an object like

```js
{
   "foo":{
      "bar": 1
   }
}
```

### Environment Variables
Environment variables work much the same as command line arguments. However, most bash implenetations don't read `:`'s very well, so the double underscore ( `__` ) is used in its place `foo__bar=1` npm start

```js
{
   "foo":{
      "bar": 1
   }
}
```

### Conf File
The `conf` options can be set to read specific configuration from a file(s). The value should be a full path. If the path points to a directory, the conf loader will read all json files, sort them and load their values in an overriding order. Sorting is done in a descending, lexigraphical order.

```sh
└── conf
    ├── 20-hive.json
    ├── 10-hive.json
    └── 30-hive.json
```

Given the above directory of conf files, the server can be configured by pointing the `conf` arguments at the directory

```sh
node server --conf=$HOME/conf
```

The configruation would be read in the following priority
``` 10-hive.json < 20-hive.json < 30-hive.json```

where 20 overrides 10, and 30 overrides 20.

### System defaults
defaults are what they sound like. Sane defaults for values that are needed to get the application running. They are located in the {@link module:hive-conf/lib/defaults|Defaults} module and are used only as fallback values.

### Option Shorthands
Top level options can be aliased. Short hand aliases can be found and defined in the {@link module:hive-conf/lib/shorthands|Shorthands} module of `hive-conf`

Flag | Shorthand | Description 
-----|:---------:|:------------
PORT | p | Specifies the port the server will bind to
logger | l | specify the type(s) of logging transports for the server to use

the following invocations are treated the same

```sh
node server --PORT=3001 --logger=stdout --logger=file
```
```sh
PORT=3001 logger=stdout nodeserver -l file
```
```sh
node server -p 3001 -l stdout -l file
```
 * @summary The configuration loader for hive, the spirit shop platform api.*
 * @module hive-conf
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires nconf
 * @requires path
 * @requires os
 * @requires debug
 * @requires fs
 * @requires hive-conf/lib/shorthands
 * @requires hive-conf/lib/defaults
 * @requires hive-conf/lib/overrides
 */

 var nconf       = require( 'nconf' )                                            // flatiron nconf module
   , path        = require( 'path' )                                             // node path module
   , os          = require( 'os' )                                               // node os module
   , fs          = require( 'fs' )                                               // node fs module
   , debug       = require( 'debug' )('hive:conf')                              // debug function spoped to hive:conf
   , shorthands  = require('./lib/shorthands')                                   // quick argv shorthands mapping
   , defaults    = require('./lib/defaults')                                     // config defaults
   , overrides   = require('./lib/overrides')                                    // static system overrides that can't / shouldn't change
   , merge       = require('mout/object/merge')
   , hivecheck  = /^hive/
   , packagepaths = [ path.join(process.cwd(), 'conf') ]
   , lookuppaths                                                                 // look up paths to possible locations where config files may live
   , startup                                                                     // referece to the conf object for start up options. Gets deleted at the end
   , configFile                                                                  // the location to look for a user defined config file, or a directory
   , conf                                                                        // the final configuration object to export
   ;

// order matters, otherwise this could be an object
lookuppaths =[
   ['project', path.normalize( path.join(overrides.PROJECT_ROOT,"hive.json") )]
 , ['home',path.normalize( path.join(( process.env.USERPROFILE || process.env.HOME || overrides.PROJECT_ROOT ),'.config', "hive.json") ) ]
 , ['etc', path.normalize('/etc/hive.json')]
]

startup = nconf
         .argv()
         .env({separator:'__'})
         .defaults( defaults );

configFile = path.resolve( startup.get( 'conf' ) || 'hive.json' )

startup.remove('env');
startup.remove('argv');
startup.remove('defaults');
startup = null;

debug('config file set to %s', configFile );
debug('project root set to %s', overrides.PROJECT_ROOT );
debug('package path set to %s', overrides.PACKAGE_PATH );

if(fs.existsSync( overrides.PACKAGE_PATH ) ){
   packagepaths = fs
                  .readdirSync( overrides.PACKAGE_PATH )
                  .filter( function( dir ){
                     return hivecheck.test( dir )
                  })
                  .map(function( dir ){
                     return path.join(overrides.PACKAGE_PATH, dir, 'conf' )
                  })
}

debug("configuration modules %s", packagepaths.join(', '))


conf = nconf
      .overrides( overrides )
      .argv( shorthands )
      .env({separator:'__'})

// if the specified config file is actually a directory
// start looking for json files and try to sort them
if(  fs.existsSync( configFile ) && fs.statSync( configFile ).isDirectory() ){
   debug('detected config directorty')
   
   fs
      .readdirSync( configFile )
      .filter( function( file ){
         return (/\.json$/).test( file );
      })
      .sort( function( file_a, file_b ){
         return file_a < file_b;
      })
      .forEach( function( file ){
         var filepath = path.normalize( path.join( configFile, file ) );
         debug('loading config file `%s` %s', file, filepath);
         conf = conf.file( file, filepath );
      })
}

lookuppaths.forEach(function( lp ){
   debug('loading config file `%s`: %s', lp[0], lp[1])
   conf = conf.file( lp[0], lp[1] )
});
debug('setting config defaults')


var defaultCfg = {};

packagepaths.forEach(function( pconf ){
   var config;
   try{
      config = require( pconf )
      defaultCfg = merge( defaultCfg, config )
      debug('loaded package defaults from %s', pconf  )
   } catch( e ){
      debug('unable to load %s: %s', pconf, e.message )
   }
});

defaultCfg = merge( defaultCfg, defaults )
conf
   .defaults(defaultCfg);

module.exports = conf;
