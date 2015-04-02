/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Predefined project defaults
 * @module alice-conf/lib/defaults
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires path
 * @requires os
 */
var util = require('util')
var path = require('path')
var os = require('os')

module.exports = {
    /**
     * @property {Object} [mongoose] Config options for mongoose
     * @property {Object} [mongoose.debug=false] true to endable mongoose internal debug output
     **/
    mongoose:{
        debug: false
    },

    /**
     * @property {Object} databases defines the database connections the application will establish on startup
     * @property {Object|String} databases.commerce A full connection string or connection object for the commerce data base
     * @property {String} [databases.commerce.driver=mongodb]
     * @property {String} [databases.commerce.user=ss-mongodb-user]
     * @property {String} [databases.commerce.password=ss-mongodb-user]
     * @property {String} [databases.commerce.host=ds029817.mongolab.com]
     * @property {Number} [databases.commerce.port=29817]
     * @property {Boolean} [databases.commerce.default=true]
     * @property {Object|String} databases.queue A full connection string or connection object for the commerce data base
     * @property {String} [databases.queue.driver=mongodb]
     * @property {String} [databases.queue.user=ss-mongodb-user]
     * @property {String} [databases.queue.password=ss-mongodb-user]
     * @property {String} [databases.queue.host=ds029817.mongolab.com]
     * @property {Number} [databases.queue.port=29817]
     * @property {Boolean} [databases.queue.default=false]
     **/
    databases:{
        commerce:{
            driver:'mongodb'
            ,user:'ss-mongodb-user'
            ,password:'ss-mongodb-user'
            ,host:'ds029817.mongolab.com'
            ,port:29817
            ,default: true
        }

        ,rcommerce:{
            driver:'rethinkdb'
            ,host:'0.0.0.0'
            ,port:28015
            ,db:'commerce'
        }
    },
    affiliateApiKeys: {
        'c1c24905-86cc-4f57-9c9c-8dfd5c8113aa': 'MaxPreps-Dev',
        'c4125761-7f82-49b4-8436-3bde15dabb7e': 'SpiritShop-Dev'
    },
    jwtToken: {
        secret: 'BF7695D8-CF17-49AE-9178-8AE2D48D62D8',
        hours: 3
    },

    /**
     * @property {Object} searchly contains connection credentials to the searchly service
     **/
    search: {
      host: 'dwalin-us-east-1.searchly.com',
        port: 80,
        secure: false,
        auth: {
            username: 'ss-api',
            password: 'yql86b12txcay2uyeupmiehobkb3byow'
        }
    }
};


