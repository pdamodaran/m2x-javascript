Javascript M2X API Client
=========================

The AT&T M2X API provides all the needed operations and methods to connect your devices to AT&T's M2X service. This client provides an easy to use interface for your favorite language, Javascript.


Getting Started
---------------
1. Signup for an M2X Account: https://m2x.att.com/signup
2. Obtain your *Master Key* from the Master Keys tab of your Account Settings: https://m2x.att.com/account
3. Create your first Data Source Blueprint and copy its *Feed ID*: https://m2x.att.com/blueprints
4. Review the M2X API Documentation: https://m2x.att.com/developer/documentation/overview

If you have questions about any M2X specific terms, please consult the M2X glossary: https://m2x.att.com/developer/documentation/glossary


Compatibility
-------------
Currently, the M2X Javascript client is supported on all newer browsers except IE8 and IE9.


Quick API Reference
-------------------
The main object encapsulating all API functionality is the global variable ``M2X``.
An ``M2X`` object is initialized by passing an API key to it:

    var m2x = new M2X("<API Key>"[, "<Alternate API Server URL>"]);

After you've done this the ``m2x`` object will be able to communicate with M2X's API:

    m2x.feeds.search({ q: "sensor" }, function(data) { /*...do something...*/ });

    m2x.feeds.view("<Feed-ID>", function(data) { /* ...do something ...*/ });

    m2x.keys.list(function(data) { /* ...do something ...*/ });

As you can see, M2X has two properties named ``feeds`` and ``keys`` which
at the same time contain methods for manipulating data. In order to see each
specific method, check out the code under the ``src/`` directory.


Examples
--------
There's an example included in the ``examples/`` directory.


License
-------
This library is released under the MIT license. See ``LICENSE`` for the terms.
