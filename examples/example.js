/*globals jQuery,localStorage,alert,M2X*/
(function($) {
    function M2XExample() {
        this.$statusBar = $("#status-bar span");
        this.$apiKey = $("input[name=api-key]");
        this.$feedID = $("input[name=feed-id]");
        this.$feedView = $("#feed-view");
        this.$streamPush = $("#stream-push");
        this.$streamView = $("#stream-view");

        this.bindEvents();

        // Load api/feed values from localStorage (if any)
        this.$apiKey.val( localStorage.getItem("api-key") || "" );
        this.$feedID.val( localStorage.getItem("feed-id") || "" );
        this.onKeyChange();
        this.onFeedChange();
    }

    M2XExample.prototype.bindEvents = function() {
        // Call onKeyChange when api key input changes
        this.$apiKey.on("change", $.proxy("onKeyChange", this));

        // Call onFeedChange when feed-id input changes
        this.$feedID.on("change", $.proxy("onFeedChange", this));

        // Hook this event on all buttons so that we share the check
        // for api-key/feed-id, which is needed for all three operations
        $("button").on("click", $.proxy(function(ev) {
            if (! this.m2x) {
                alert("You must type an API Key first.");
            } else if (! this.feedID) {
                alert("You must type a Feed ID first.");
            } else {
                return;
            }

            ev.stopPropagation();
        }, this));

        // Handler for getting feed information
        this.$feedView.on("click", "button", $.proxy(function() {
            this.setLoading(true);

            this.m2x.feeds.view(this.feedID, $.proxy(function(data) {
                $("code", this.$feedView).text(JSON.stringify(data));

                this.setLoading(false);
            }, this));
        }, this));

        // Handler for pushing values to a data stream
        this.$streamPush.on("click", "button", $.proxy(function() {
            var streamName = $("input[name=stream-name]", this.$streamPush).val();
            var value = $("input[name=stream-value]", this.$streamPush).val();

            if (! streamName) {
                alert("You must type an Stream name first.");
            } else if (! value) {
                alert("You must type a value to be pushed.");
            } else {
                this.setLoading(true);

                this.m2x.feeds.
                    updateStream(this.feedID, streamName, { value: value }, $.proxy(function() {

                    this.setLoading(false);
                }, this));
            }
        }, this));

        // Handler for fetching values from a data stream
        this.$streamView.on("click", "button", $.proxy(function() {
            var streamName = $("input[name=stream-name]", this.$streamView).val();

            if (! streamName) {
                alert("You must type an Stream name first.");
            } else {
                this.setLoading(true);

                this.m2x.feeds.streamValues(this.feedID, streamName, $.proxy(function(data) {
                    $("code", this.$streamView).text(JSON.stringify(data));

                    this.setLoading(false);
                }, this));
            }
        }, this));
    };

    M2XExample.prototype.onFeedChange = function() {
        this.feedID = this.$feedID.val();
        localStorage.setItem("feed-id", this.feedID);
    };

    M2XExample.prototype.onKeyChange = function() {
        // In this example we create a new M2X object each time the api key changes,
        // but in most cases you'll be using the same api key all the time, so what we
        // do here might not necessarily apply for your use case.
        var key = this.$apiKey.val();

        if (key) {
            this.m2x = new M2X(key);
        } else {
            this.m2x = undefined;
        }

        localStorage.setItem("api-key", key);
    };

    M2XExample.prototype.setLoading = function(enabled) {
        if (enabled) {
            this.$statusBar.text("Loading...");
        } else {
            this.$statusBar.text("Done!");
        }
    };

    $(function() {
        new M2XExample();
    });
}(jQuery));
