define(["Client", "Keys", "Feeds"],
function(Client, Keys, Feeds) {
    var M2X = function(apiKey, apiBase) {
        this.client = new Client(apiKey, apiBase);
        this.keys = new Keys(this.client);
        this.feeds = new Feeds(this.client);
    };

    M2X.prototype.status = function(cb) {
        return this.client.get("/status", cb);
    };

    return M2X;
});
