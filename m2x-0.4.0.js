(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define(factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.M2X = factory();
    }
}(this, function () {

/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../dist/lib/almond", function(){});

define('helpers',[],function() {
    function extend(target) {
        var sources = [].slice.call(arguments, 1), si;
        for (si = 0; si < sources.length; si++) {
            var source = sources[si], prop;
            for (prop in source) {
                target[prop] = source[prop];
            }
        }
        return target;
    }

    function format(s) {
        // String formatting function.
        // From http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery
        var i = arguments.length;

        while (i--) {
            s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i + 1]);
        }

        return s;
    }

    function url(f) {
        var params = Array.prototype.slice.call(arguments, 1).map(function(param) {
            return encodeURIComponent(param);
        });

        return format.apply(this, [f].concat(params));
    }


    return {
        extend: extend,
        format: format,
        url: url
    };
});

/*globals XMLHttpRequest,XDomainRequest*/

define('Client',["helpers"], function(helpers) {
    var API_BASE = "http://api-m2x.att.com/v1";

    function encodeParams(params) {
        var param, result;

        for (param in params) {
            var value = params[param];
            result = result ? result + "&" : "";
            result += encodeURIComponent(param) + "=" + encodeURIComponent(value);
        }

        return result;
    };

    function request(options, onSuccess, onError) {
        var xhr = new XMLHttpRequest();
        var querystring = encodeParams(options.qs);
        var path = querystring ? options.path + "?" + querystring : options.path;

        if ("withCredentials" in xhr) {
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(options.verb, path, true);

        } else if (typeof XDomainRequest !== "undefined") {
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's (8 & 9) way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(options.verb, path);

        } else {
            // Otherwise, CORS is not supported by the browser.
            throw "CORS is not supported by this browser.";
        }

        for (var header in options.headers) {
            xhr.setRequestHeader(header, options.headers[header]);
        }

        xhr.onerror = onError;
        xhr.onload = function() {
            if (onSuccess) {
                var data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
                onSuccess.apply(xhr, [data]);
            }
        }

        xhr.send(options.body);

        return xhr;
    }


    var Client = function(apiKey, apiBase) {
        this.apiKey = apiKey;
        this.apiBase = apiBase || API_BASE;

        this.defaultHeaders = {
            "X-M2X-KEY": this.apiKey
        };

        // Define request methods by verb. We could use forEach but it wouldn't work on IE8.
        var verbs = ['get', 'post', 'put', 'del', 'head', 'options', 'patch'], vi;
        for (vi = 0; vi < verbs.length; vi++) {
            var verb = verbs[vi];
            this[verb] = function(verb) {
                return function(path, options, cb) {
                    this.request(verb, path, options, cb);
                };
            }(verb);
        }
    };

    Client.prototype.request = function(verb, path, options, cb) {
        var body, headers;

        if (typeof options === "function") {
            // callback was sent in place of options
            cb = options;
            options = {};
        }

        headers = helpers.extend(this.defaultHeaders, options.headers || {});

        if (! headers["Content-Type"]) {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (options.params) {
            switch (headers["Content-Type"]) {
            case "application/json":
                body = JSON.stringify(options.params);
                break;

            case "application/x-www-form-urlencoded":
                body = encodeParams(options.params);
                break;

            default:
                throw "Unrecognized Content-Type `" + headers["Content-Type"] + "`";
            }
        }

        request({
            path: this.apiBase + path,
            qs: options.qs,
            verb: verb,
            headers: headers,
            body: body
        }, cb, function() {
            // TODO: handle errors
        });
    };

    return Client;
});

define('Batches',["helpers"], function(helpers) {
    // Wrapper for AT&T M2X Batches API
    //
    // See https://m2x.att.com/developer/documentation/datasource
    var Batches = function(client) {
        this.client = client;
    };

    // List/search all the data source batches that belong to the user
    // associated with the M2X API key supplied when initializing M2X
    //
    // The list of data source batches can be filtered by using one or
    // more of the following optional parameters:
    //
    // * `q` text to search, matching the name and description.
    // * `tags` a comma separated list of tags.
    // * `limit` how many results per page.
    // * `page` the specific results page, starting by 1.
    // * `latitude` and `longitude` for searching feeds geographically.
    // * `distance` numeric value in `distance_unit`.
    // * `distance_unit` either `miles`, `mi` or `km`.
    Batches.prototype.search = function(params, cb) {
        return this.client.get("/batches", { params: params }, cb);
    };

    Batches.prototype.list = function(cb) {
        return this.search({}, cb);
    };

    // Create a new data source batch
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Batches.prototype.create = function(params, cb) {
        return this.client.post("/batches", { params: params }, cb);
    };

    // Retrieve information about an existing data source batch
    Batches.prototype.view = function(id, cb) {
        return this.client.get(helpers.url("/batches/%s", id), cb);
    };

    // Update an existing data source batch details
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Batches.prototype.update = function(id, params, cb) {
        return this.client.put(helpers.url("/batches/%s", id), { params: params }, cb);
    };

    // List/search all data sources in the batch
    //
    // See Datasources#search for search parameters description.
    Batches.prototype.datasources = function(id, params, cb) {
        params = { params: params || {} };
        return this.client.get(helpers.url("/batches/%s/datasources", id), params, cb);
    };

    // Add a new data source to an existing batch
    //
    // Accepts a `serial` parameter, that must be a unique identifier
    // within this batch.
    Batches.prototype.addDatasource = function(id, serial, cb) {
        var params = { params: { serial: serial } };
        return this.client.post(helpers.url("/batches/%s/datasources", id), params, cb);
    };

    // Delete an existing data source batch
    Batches.prototype.del = function(id, cb) {
        return this.client.del(helpers.url("/batches/%s", id), cb);
    };

    return Batches;
});

define('Blueprints',["helpers"], function(helpers) {
    // Wrapper for AT&T M2X Blueprints API
    //
    // See https://m2x.att.com/developer/documentation/datasource
    var Blueprints = function(client) {
        this.client = client;
    };

    // List/search all the blueprints that belong to the user associated
    // with the M2X API key supplied when initializing M2X
    //
    // The list of blueprints can be filtered by using one or more of the
    // following optional parameters:
    //
    // * `q` text to search, matching the name and description.
    // * `tags` a comma separated list of tags.
    // * `limit` how many results per page.
    // * `page` the specific results page, starting by 1.
    // * `latitude` and `longitude` for searching feeds geographically.
    // * `distance` numeric value in `distance_unit`.
    // * `distance_unit` either `miles`, `mi` or `km`.
    Blueprints.prototype.search = function(params, cb) {
        return this.client.get("/blueprints", { params: params }, cb);
    };

    Blueprints.prototype.list = function(cb) {
        return this.search({}, cb);
    };

    // Create a new data source blueprint
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source blueprint.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Blueprints.prototype.create = function(params, cb) {
        return this.client.post("/blueprints", { params: params }, cb);
    };

    // Retrieve information about an existing data source blueprint
    Blueprints.prototype.view = function(id, cb) {
        return this.client.get(helpers.url("/blueprints/%s", id), cb);
    };

    // Update an existing data source blueprint's information
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source blueprint.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Blueprints.prototype.update = function(id, params, cb) {
        return this.client.put(helpers.url("/blueprints/%s", id), { params: params }, cb);
    };

    // Delete an existing data source blueprint
    Blueprints.prototype.del = function(id, cb) {
        return this.client.del(helpers.url("/blueprints/%s", id), cb);
    };

    return Blueprints;
});

define('Datasources',["helpers"], function(helpers) {
    // Wrapper for AT&T M2X Data Sources API
    //
    // See https://m2x.att.com/developer/documentation/datasource
    var Datasources = function(client) {
        this.client = client;
    };

    // List/search all the datasources that belong to the user associated
    // with the M2X API key supplied when initializing M2X
    //
    // The list of data sources can be filtered by using one or more of the
    // following optional parameters:
    //
    // * `q` text to search, matching the name and description.
    // * `tags` a comma separated list of tags.
    // * `limit` how many results per page.
    // * `page` the specific results page, starting by 1.
    // * `latitude` and `longitude` for searching feeds geographically.
    // * `distance` numeric value in `distance_unit`.
    // * `distance_unit` either `miles`, `mi` or `km`.
    Datasources.prototype.search = function(params, cb) {
        return this.client.get("/datasources", params, cb);
    };

    Datasources.prototype.list = function(cb) {
        return this.search({}, cb);
    };

    // Create a new data source
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Datasources.prototype.create = function(params, cb) {
        return this.client.post("/datasources", { params: params }, cb);
    };

    // Retrieve information about an existing data source
    Datasources.prototype.view = function(id, cb) {
        return this.client.get(helpers.url("/datasources/%s", id), cb);
    };

    // Update an existing data source details
    //
    // Accepts the following parameters as members of a hash:
    //
    // * `name` the name of the new data source.
    // * `visibility` either "public" or "private".
    // * `description` containing a longer description (optional).
    // * `tags` a comma separated string of tags (optional).
    Datasources.prototype.update = function(id, params, cb) {
        return this.client.put(helpers.url("/datasources/%s", id), { params: params }, cb);
    };

    // Delete an existing data source
    Datasources.prototype.del = function(id, cb) {
        return this.client.del(helpers.url("/datasources/%s", id), cb);
    };

    return Datasources;
});

define('Keys',["helpers"], function(helpers) {
    // Wrapper for AT&T M2X Keys API
    //
    // See https://m2x.att.com/developer/documentation/keys for AT&T M2X
    // HTTP Keys API documentation.
    var Keys = function(client) {
        this.client = client;
    };

    // List all the Master API Keys that belongs to the user associated
    // with the AT&T M2X API key supplied when initializing M2X
    Keys.prototype.list = function(cb) {
        return this.client.get("/keys", cb);
    };

    // Return the details of the API Key supplied
    Keys.prototype.view = function(key, cb) {
        return this.client.get(helpers.url("/keys/{0}", key), cb);
    };

    // Delete the supplied API Key
    Keys.prototype.del = function(key, cb) {
        return this.client.del(helpers.url("/keys/{0}", key), cb);
    };

    // Create a new API Key
    //
    // Note that, according to the parameters sent, you can create a
    // Master API Key or a Feed/Stream API Key. See
    // https://m2x.att.com/developer/documentation/keys#Create-Key for
    // details on the parameters accepted by this method.
    Keys.prototype.create = function(params, cb) {
        return this.client.post("/keys", {
            headers: { "Content-Type": "application/json" },
            params: params
        }, cb);
    };

    // Update API Key properties
    //
    // This method accepts the same parameters as create API Key and
    // has the same validations. Note that the Key token cannot be
    // updated through this method.
    Keys.prototype.update = function(key, params, cb) {
        return this.client.put(helpers.url("/keys/{0}", key), {
            headers: { "Content-Type": "application/json" },
            params: params
        }, cb);
    };

    // Regenerate an API Key token
    //
    // Note that if you regenerate the key that you're using for
    // authentication then you would need to change your scripts to
    // start using the new key token for all subsequent requests.
    Keys.prototype.regenerate = function(key, cb) {
        return this.client.post(helpers.url("/keys/{0}/regenerate", key), cb);
    };

    return Keys;
});

define('Feeds',["helpers", "Keys"], function(helpers, Keys) {
    // Wrapper for AT&T M2X Feed API
    //
    // See https://m2x.att.com/developer/documentation/feed for AT&T M2X
    // HTTP Feed API documentation.
    var Feeds = function(client) {
        this.client = client;
        this.keysAPI = new Keys(this.client);
    };


    // List/search all the feeds that belong to the user associated
    // with the M2X API key supplied when initializing M2X
    //
    // The list of feeds can be filtered by using one or more of the
    // following optional parameters:
    //
    // * `q` text to search, matching the name and description.
    // * `type` one of `bleuprint`, `batch` and `datasource`.
    // * `tags` a comma separated list of tags.
    // * `limit` how many results per page.
    // * `page` the specific results page, starting by 1.
    // * `latitude` and `longitude` for searching feeds geographically.
    // * `distance` numeric value in `distance_unit`.
    // * `distance_unit` either `miles`, `mi` or `km`.
    Feeds.prototype.search = function(params, cb) {
        return this.client.get("/feeds", { qs: params || {} }, cb);
    };

    // List all the feeds that belong to the user associated with the
    // M2X API key supplied when initializing M2X
    Feeds.prototype.list = function(cb) {
        return this.search({}, cb);
    };

    // Return the details of the supplied feed
    Feeds.prototype.view = function(id, cb) {
        return this.client.get(helpers.url("/feeds/{0}", id), cb);
    };

    // Return a list of access log to the supplied feed
    Feeds.prototype.log = function(id, cb) {
        return this.client.get(helpers.url("/feeds/{0}/log", id), cb);
    };

    // Return the current location of the supplied feed
    //
    // Note that this method can return an empty value (response status
    // of 204) if the feed has no location defined.
    Feeds.prototype.location = function(id, cb) {
        return this.client.get(helpers.url("/feeds/{0}/location", id), cb);
    };

    // Update the current location of the feed
    Feeds.prototype.updateLocation = function(id, params, cb) {
        return this.client.
            put(helpers.url("/feeds/{0}/location", id), { params: params }, cb);
    };

    // Return a list of the associated streams for the supplied feed
    Feeds.prototype.streams = function(id, cb) {
        return this.client.get(helpers.url("/feeds/{0}/streams", id), cb);
    };

    // Return the details of the supplied stream
    Feeds.prototype.stream = function(id, name, cb) {
        return this.client.get(helpers.url("/feeds/{0}/streams/{1}", id, name), cb);
    };

    // List values from an existing data stream associated with a
    // specific feed, sorted in reverse chronological order (most
    // recent values first).
    //
    // The values can be filtered by using one or more of the following
    // optional parameters:
    //
    // * `start` An ISO 8601 timestamp specifying the start of the date
    // * range to be considered.
    //
    // * `end` An ISO 8601 timestamp specifying the end of the date
    // * range to be considered.
    //
    // * `limit` Maximum number of values to return.
    Feeds.prototype.streamValues = function(id, name, params, cb) {
        var url = helpers.url("/feeds/{0}/streams/{1}/values", id, name);

        if (typeof params === "function") {
            cb = params;
            params = {};
        }

        return this.client.get(url, { qs: params }, cb);
    };

    // Update stream's properties
    //
    // If the stream doesn't exist it will create it. See
    // https://m2x.att.com/developer/documentation/feed#Create-Update-Data-Stream
    // for details.
    Feeds.prototype.updateStream = function(id, name, params, cb) {
        return this.client.
            put(helpers.url("/feeds/{0}/streams/{1}", id, name), { params: params }, cb);
    };

    // Delete the stream (and all its values) from the feed
    Feeds.prototype.deleteStream = function(id, name, cb) {
        return this.client.del(helpers.url("/feeds/{0}/streams/{1}", id, name), cb);
    };

    // Returns a list of API keys associated with the feed
    Feeds.prototype.keys = function(id, cb) {
        return this.client.get("/keys", { qs: { feed: id } }, cb);
    };

    // Creates a new API key associated to the feed
    //
    // If a parameter named `stream` is supplied with a stream name, it
    // will create an API key associated with that stream only.
    Feeds.prototype.createKey = function(id, params, cb) {
        this.keysAPI.create(helpers.extend(params, { feed: id }), cb);
    };

    // Updates an API key properties
    Feeds.prototype.updateKey = function(id, key, params, cb) {
        this.keysAPI.update(key, helpers.extend(params, { feed: id }), cb);
    };

    // Post multiple values to multiple streams
    //
    // This method allows posting multiple values to multiple streams
    // belonging to a feed. All the streams should be created before
    // posting values using this method. The `values` parameters is a
    // hash with the following format:
    //
    //   {
    //     "stream-name-1": [
    //       { "at": <Time in ISO8601>, "value": x },
    //       { "value": y }
    //     ],
    //     "stream-name-2": [ ... ]
    //   }
    //
    // If the `at` attribute is missing the the current time of the
    // server, in UTC, will be used.
    Feeds.prototype.postMultiple = function(id, values, cb) {
        return this.client.post(helpers.url("/feeds/{0}", id), {
            headers: { "Content-Type": "application/json" },
            params: { values: values }
        }, cb);
    };

    // Retrieve list of triggers associated with the specified feed.
    Feeds.prototype.triggers = function(id, cb) {
        return this.client.get(helpers.url("/feeds/%s/triggers", id), cb);
    };

    // Get details of a specific trigger associated with an existing feed.
    Feeds.prototype.trigger = function(id, triggerID, cb) {
        return this.client.get(helpers.url("/feeds/%s/triggers/%s", id, triggerID), cb);
    };

    // Create a new trigger associated with the specified feed.
    Feeds.prototype.createTrigger = function(id, params, cb) {
        return this.client.post(helpers.url("/feeds/%s/triggers", id), {
            params: params
        }, cb);
    };

    // Update an existing trigger associated with the specified feed.
    Feeds.prototype.updateTrigger = function(id, triggerID, params, cb) {
        return this.client.put(helpers.url("/feeds/%s/triggers/%s", id, triggerID), {
            params: params
        }, cb);
    };

    // Test the specified trigger by firing it with a fake value.
    // This method can be used by developers of client applications
    // to test the way their apps receive and handle M2X notifications.
    Feeds.prototype.testTrigger = function(id, triggerName, cb) {
        return this.client.post(helpers.url("/feeds/%s/triggers/%s", id, triggerName), cb);
    };

    // Delete an existing trigger associated with a specific feed.
    Feeds.prototype.deleteTrigger = function(id, triggerID, cb) {
        return this.client.del(helpers.url("/feeds/%s/triggers/%s", id, triggerID), cb);
    };

    return Feeds;
});

define('m2x',["Client", "Batches", "Blueprints", "Datasources", "Feeds", "Keys"],
function(Client, Batches, Blueprints, Datasources, Feeds, Keys) {
    var M2X = function(apiKey, apiBase) {
        this.client = new Client(apiKey, apiBase);

        this.batches = new Batches(this.client);
        this.blueprints = new Blueprints(this.client);
        this.datasources = new Datasources(this.client);
        this.feeds = new Feeds(this.client);
        this.keys = new Keys(this.client);
    };

    M2X.prototype.status = function(cb) {
        return this.client.get("/status", cb);
    };

    return M2X;
});
    return require("m2x");
}));
