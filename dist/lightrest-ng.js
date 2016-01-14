(function () {
    'use strict';

    angular
    .module('lightrest', []);

    angular
    .module('lightrest')
    .factory('lightrest', ['$http', '$q', function ($http, $q) {
        function clone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
        function check(config, options) {
            if (Object.prototype.toString.call(config) !== '[object Object]')
                throw new Error("config should be an object if anything");
            if (!config.url) { throw new Error("Tried to create a request without url"); }
        }

        function build(config, options) {
            if (!options) options = {};
            if (!config) config = {};
            else config = clone(config);

            check(config, options);

            if (options.urlApiPrepend != false) {
                if (config.url[0] != '/') config.url = '/' + config.url;
                if (config.url.indexOf('/api') != 0) config.url = '/api' + config.url;
            }

            function _ajaxFn(config) {
                config.url = config.url.replace(/:(\w+)/g, function (a, urlParam) {
                    /* data[urlParam] can be either non empty string or number */
                    if (!config.data) config.data = {};
                    var r = config.data[urlParam];
                    var err = new Error('Url parameter ' + urlParam + ' was not included in the data');
                    if (r == null) throw err;
                    r = r.toString();
                    if (!r) throw err;
                    return r;
                });
                if (options.dataField) config.data = config.data[options.dataField];
                if (!config.method || config.method.toLowerCase() == 'get') config.params = config.data;
                return {
                    run: function () { return $http(config); }
                }
            }
            return function (data) {
                config.data = data;
                if (options.array) {
                    var ajaxes = [];
                    var length = config.data.length;
                    for (var i = 0; i < length; i++) {
                        var _config = clone(config);
                        _config.data = config.data[i];
                        ajaxes.push(_ajaxFn(_config));
                    }
                    if (options.array == 'concurrent') {
                        for (var i = 0; i < length; i++) {
                            ajaxes[i] = ajaxes[i].run();
                        }
                        return $q.all(ajaxes);
                    }
                    else if (options.array == 'sequential') {
                        var length = ajaxes.length;
                        var i = -1;
                        var run = function() {
                            i++;
                            if (i >= length) return true;
                            return ajaxes[i].run().then(run, run);
                        }
                        return run();
                    }
                    else throw new Error('array option should be one of these: concurrent sequential');
                }
                else {
                    return _ajaxFn(config).run();
                }
            }
        }
        var api = {
            build: build,
            create: function (type) {
                if (type[0] != '/')
                    type = '/' + type;
                var url = type;
                var idUrl = '/:Id';
                return {
                    get: build({ url: url + idUrl }),
                    getAll: build({ url: url }),
                    post: build({ method: 'post', url: url }),
                    delete: build({ method: 'delete', url: url + idUrl }),
                    deleteMany: build({ method: 'delete', url: url + idUrl }, { array: 'concurrent' }),
                    put: build({ method: 'put', url: url + idUrl }),
                    putMany: build({ method: 'put', url: url + idUrl }, { array: 'concurrent' })
                }
            }
        }
        return api;
    }])
})();
