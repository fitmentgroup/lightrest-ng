/* lightrest-ng 0.2.4 */

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
        function getNestedProp(obj, desc) {
            var arr = desc.split(".");
            while(arr.length && (obj = obj[arr.shift()]));
            return obj;
        }


        function defaults(config, options) {
            if (options.baseUrl === undefined || options.baseUrl === true) options.baseUrl = '/api';
            else if (options.baseUrl === false) options.baseUrl = '';
            else if (typeof options.baseUrl === 'string' || options.baseUrl instanceof String) ;
            else throw new Error('baseUrl option can only be one of these: undefined true false string')

            if (options.arrayMode === undefined) ;
            else if (options.arrayMode == 'concurrent') ;
            else if (options.arrayMode == 'sequential') ;
            else throw new Error('arrayMode option should be one of these: undefined \'concurrent\' \'sequential\'');

            if (options.body === undefined) 
                options.body = (!config.method || config.method.toLowerCase() == 'get') 
                ? false : true;
            else if (options.body === false) ;
            else if (options.body === true) ;
            else if (typeof options.body === 'string' || options.body instanceof String) ;
            else throw new Error('body option should be one of these: undefined true false string');

            if (options.query === undefined) 
                options.query = (!config.method || config.method.toLowerCase() == 'get') 
                ? true : false;
            else if (options.query === false) ;
            else if (options.query === true) ;
            else if (typeof options.query === 'string' || options.query instanceof String) ;
            else throw new Error('query option should be one of these: undefined true false string');

            if (options.urlParams === undefined) options.urlParams = true;
            else if (options.urlParams === true) ;
            else if (options.urlParams === false) ;
            else throw new Error('urlParams option can only be one of these: undefined true false')
        }

        function build(config, options) {
            if (!config) config = {};
            if (!options) options = {};

            defaults(config, options);
            if (options.baseUrl.slice(-1) == '/') options.baseUrl = options.baseUrl.slice(0, -1);

            function ajax(data) {
                if (!data) data = {};
                var _config = clone(config);
                if (options.urlParams) {
                    _config.url = _config.url.replace(/:([\w.]+)/g, function (a, urlParam) {
                        /* data[urlParam] can be either non empty string or number */
                        var err = new Error('Url parameter ' + urlParam + ' was not included in the data');
                        if (!data) throw err;
                        var val = getNestedProp(data, urlParam);
                        if (val == null) throw err;
                        val = val.toString();
                        if (!val) throw err;
                        return val;
                    });   
                }
                if (_config.url[0] != '/') _config.url = '/' + _config.url;
                _config.url = options.baseUrl + _config.url;
                if (options.body) {
                    var _data = (typeof options.body === 'string' || options.body instanceof String) 
                        ? getNestedProp(data, options.body)
                        : data
                    _config.data = _data;
                }
                if (options.query && data !== undefined) {
                    var _data = (typeof options.query === 'string' || options.query instanceof String)
                            ? getNestedProp(data, options.query)
                            : data;
                    _config.params = _data;
                }
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
