/* lightrest-ng 0.2.2 */

﻿(function () {
    'use strict';

    angular
    .module('lightrest', []);

    angular
    .module('lightrest')
    .factory('lightrest', ['$http', '$q', function ($http, $q) {
        function clone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        function defaults(config, options) {
            if (options.urlApiPrepend === undefined) options.urlApiPrepend = true;
            else if (options.urlApiPrepend === true) ;
            else if (options.urlApiPrepend === false) ;
            else throw new Error('urlApiPrepend option can only be one of these: undefined true false')

            if (options.arrayMode === undefined) ;
            else if (options.arrayMode == 'concurrent') ;
            else if (options.arrayMode == 'sequential') ;
            else throw new Error('array option should be one of these: concurrent sequential');
        }

        function build(config, options) {
            if (!config) config = {};
            else config = clone(config);
            if (!options) options = {};

            defaults(config, options);

            if (options.urlApiPrepend) {
                if (config.url[0] != '/') config.url = '/' + config.url;
                if (config.url.indexOf('/api') != 0) config.url = '/api' + config.url;
            }

            function ajax(data) {
                if (!data) data = {};
                var _config = clone(config);
                var urlParams = data.urlParams;
                _config.url = _config.url.replace(/:(\w+)/g, function (a, urlParam) {
                    /* data[urlParam] can be either non empty string or number */
                    var err = new Error('Url parameter ' + urlParam + ' was not included in the data');
                    if (!urlParams) throw err;
                    var val = urlParams[urlParam];
                    if (val == null) throw err;
                    val = val.toString();
                    if (!val) throw err;
                    return val;
                });
                if ((!config.method || config.method.toLowerCase() == 'get' ) 
                    && data.body !== undefined) {
                    throw new Error('Can\'t send data in body for get requests');
                }
                _config.data = data.body;
                _config.query = data.query;
                return {
                    run: function () { return $http(_config); }
                }
            }
            return function (data) {
                if (options.arrayMode) {
                    var ajaxes = [];
                    var length = data.length;
                    for (var i = 0; i < length; i++) {
                        ajaxes.push(ajax(data[i]));
                    }
                    if (options.arrayMode == 'concurrent') {
                        for (var i = 0; i < length; i++) {
                            ajaxes[i] = ajaxes[i].run();
                        }
                        return $q.all(ajaxes);
                    }
                    else if (options.arrayMode == 'sequential') {
                        var length = ajaxes.length;
                        var i = -1;
                        var run = function() {
                            i++;
                            if (i >= length) return true;
                            return ajaxes[i].run().then(run, run);
                        }
                        return run();
                    }
                }
                else {
                    return ajax(data).run();
                }
            }
        }
        var rest = {
            build: build,
        }
        return rest;
    }])
})();
