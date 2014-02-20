define(["helpers"], function(helpers) {
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
