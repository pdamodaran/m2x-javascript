define(["Client", "Batches", "Blueprints", "Datasources", "Feeds", "Keys"],
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
