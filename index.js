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

### Conf Options
The `conf` option can be set to read specific configuration from a file(s). The value should be a full path. If the path points to a directory, the conf loader will read all json files, sort them and load their values in an overriding order. Sorting is done in a descending, lexigraphical order.

```sh
└── conf
    ├── 20-keef.json
    ├── 10-keef.json
    └── 30-keef.json
```

Given the above directory of conf files, the server can be configured by pointing the `conf` arguments at the directory

```sh
node server --conf=$HOME/conf
```

The configruation would be read in the following priority
``` 10-keef.json < 20-keef.json < 30-keef.json```

where 20 overrides 10, and 30 overrides 20.

### Static File Defaults

To Simplify configuration for deployments, `keef` will look for configuration files in fixed locations eliminating the need for run time configuration. File Locations are as follows:

1. a file in the rooot of your project with the name `<package.name>`.`NODE_ENV`.`json` For example, if the `name` attribute in your package.json is `foobar`, and the environment var `NODE_ENV` is set as `production`, the file look up is `foobar.production.json`. If `NODE_ENV` is not set, it would be `foobar.development.json`
2. A json file named after your project name in the root of your project - `foobar.json`
3. A json file named after your project in a `.config` directory in the current users home directory - `.config/foobar.json`
4. A json file named after your project in the `/etc` directory - `/etc/foobar.json

### ETCD2 Clusters

For distributed deployments, An etcd2 cluster may be used for configuration purposes. To enable `etcd2` configuration loading, 2 environment variables should be set:
1. `etcd__hosts` - A comma separated list of `host`:`port` addresses - `etcd1.domain.com:4001,etcd2.domain.com:4001`.
2. `etcd__namespace` - a keyspace to keep data separate from everything else.

Any configuration that is stored as object, we be translated into `etcd` directories automatically

```js
keef.set('a:b:c', 1)

// Object data
{
  "a": {
    "b": {
      "c": 1
    }
  }
}

// etc data
/a/b/c 1
```

### System defaults
defaults are what they sound like. Sane defaults for values that are needed to get the application running. They are located in the {@link module:keef-conf/lib/defaults|Defaults} module and are used only as fallback values.

### Option Shorthands
Top level options can be aliased. Short hand aliases can be found and defined in the {@link module:keef-conf/lib/shorthands|Shorthands} module of `keef-conf`

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
 * @summary The configuration loader for keef, the spirit shop platform api.*
 * @module keef
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires nconf
 * @requires path
 * @requires os
 * @requires debug
 * @requires fs
 * @requires keef-conf/lib/shorthands
 * @requires keef-conf/lib/defaults
 * @requires keef-conf/lib/overrides
 */

 var nconf        = require( 'nconf' )                                            // flatiron nconf module
   , path         = require( 'path' )                                             // node path module
   , util         = require( 'util' )                                             // node path module
   , os           = require( 'os' )                                               // node os module
   , fs           = require( 'fs' )                                               // node fs module
   , Etcd         = require('nconf-etcd2')
   , debug        = require( 'debug' )('keef:conf')                               // debug function spoped to keef:conf
   , shorthands   = require('./lib/shorthands')                                   // quick argv shorthands mapping
   , defaults     = require('./lib/defaults')                                     // config defaults
   , overrides    = require('./lib/overrides')                                    // static system overrides that can't / shouldn't change
   , merge        = require('mout/object/merge')
   , keefcheck    = /^keef/
   , apppaths     = [ ]
   , defaultCfg   = {}
   , modules
   , lookuppaths                                                                  // look up paths to possible locations where config files may live
   , startup                                                                      // referece to the conf object for start up options. Gets deleted at the end
   , configFile                                                                   // the location to look for a user defined config file, or a directory
   , envFile
   , pkg
   , pkgname
   , pkgfile
   , etc_config
   , conf
   , cwd                                                                          // the final configuration object to export
   ;

cwd = process.cwd();

startup = nconf
         .argv()
         .env({separator:'__'})
         .defaults( defaults );

try{
   pkg     = path.join(overrides.PROJECT_ROOT, 'package.json');
   pkgname = require(pkg).name.trim();
} catch( e ){
   debug('package error ', e.message);
   pkgname = 'default';
}

pkgfile = pkgname +'.json'
envFile = util.format('%s.%s.json', pkgname, startup.get('NODE_ENV') || 'development');
envFile = path.resolve( cwd, envFile);
debug("package info: ", pkgname, pkg)

// order matters, otherwise this could be an object
lookuppaths =[
   ['nenv', envFile ]
 , ['project', path.normalize( path.join( overrides.PROJECT_ROOT, pkgfile ) )]
 , ['home',path.normalize( path.join(( process.env.USERPROFILE || process.env.HOME || overrides.PROJECT_ROOT ),'.config', pkgfile) ) ]
 , ['etc', path.normalize('/etc/' + pkgfile )]
];

configFile = path.resolve( startup.get( 'conf' ) || pkgfile );
overrides.CONFIG_PATH = configFile
startup.remove('env');
startup.remove('argv');
startup.remove('defaults');
startup = null;

debug('config file set to %s', configFile );
debug('project root set to %s', overrides.PROJECT_ROOT );
debug('package path set to %s', overrides.PACKAGE_PATH );



conf = nconf
      .overrides( overrides )
      .argv( shorthands )
      .env({separator:'__'});


// if the specified config file is actually a directory
// start looking for json files and try to sort them
if( fs.existsSync( configFile ) ){
   if( fs.statSync( configFile ).isDirectory() ){
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
         });
   } else{
      conf = conf.file( 'conf', configFile );
   }
}


lookuppaths.forEach(function( lp ){
   debug('loading config file `%s`: %s', lp[0], lp[1]);
   conf = conf.file( lp[0], lp[1] );
});

apppaths = conf.get(pkgname + ':applications') || [];
apppaths = Array.isArray( apppaths ) ? apppaths : [apppaths];
apppaths.push( cwd );

debug('setting config defaults');
debug("configuration modules %s", apppaths.join(', '));

apppaths.forEach(function( pconf ){
   var config;
   try{
      config = require( path.join( pconf, 'conf' ) );
      defaultCfg = merge( defaultCfg, config );
      debug('loaded package defaults from %s', pconf );
   } catch( e ){
      debug('unable to load %s configuration: %s', pconf, e.message );
   }
});

etc_config = conf.get('etcd')
debug('etcd config: ', etc_config )
if( etc_config && etc_config.hosts ){
  var etc_hosts = toArray( typeof etc_config.hosts === 'string' ? etc_config.hosts.split(',') : etc_config.hosts );
  debug('found etcd hosts:', etc_hosts)
  etc_config.hosts = etc_hosts;
  etc_hosts && conf.use('etcd', etc_config );
}

apppaths.pop();

defaultCfg = merge( defaultCfg, defaults );
conf
   .defaults(defaultCfg);

module.exports = conf;
