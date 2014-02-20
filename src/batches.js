define(["helpers"], function(helpers) {
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
