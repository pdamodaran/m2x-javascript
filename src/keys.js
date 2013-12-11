define(["m2x/helpers"], function(helpers) {
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
