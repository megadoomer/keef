## hive-conf

[ ![Codeship Status for team-umbrella/hive-conf](https://codeship.com/projects/0e911ba0-bbd4-0132-2beb-7ab97aac1fb6/status?branch=master)](https://codeship.com/projects/72290)

**The configuration loader for hive, the spirit shop platform api.**

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
defaults are what they sound like. Sane defaults for values that are needed to get the application running. They are located in `conf/lib/defaults.js` and are used only as fallback values.

### Option Shorthands
Top level options can be aliased. Short hand aliases can be found and defined in the `lib/shorthands.js' module of `hive-conf`

Flag | Shorthand | Description 
-----|:---------:|------------
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
