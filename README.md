[![Build Status](https://travis-ci.org/anywhichway/cycler.svg)](https://travis-ci.org/anywhichway/cycler)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/f46753323da34de8af383e7fa478d7c2)](https://www.codacy.com/app/syblackwell/cycler)
[![Code Climate](https://codeclimate.com/github/anywhichway/cycler/badges/gpa.svg)](https://codeclimate.com/github/anywhichway/cycler)
[![Test Coverage](https://codeclimate.com/github/anywhichway/cycler/badges/coverage.svg)](https://codeclimate.com/github/anywhichway/cycler/coverage)
[![Issue Count](https://codeclimate.com/github/anywhichway/cycler/badges/issue_count.svg)](https://codeclimate.com/github/anywhichway/cycler)


# cycler.js

Cycler.js is based on a fork of the hugely popular cycle.js code base from Douglas Crockford, Nuno Job, and Justin Warkentin. 

Cycler is typically used to serialize objects prior to file storage or network transmission. So long as the same constructors are available in the serializing and de-serializing environments it ensures that functional semantics follow along with data as it is transmitted or stored and restored. This is ideal for fully isomorphic programming and distributed processing.

Cycler enhances cycle.js by:

* the utilization of newer JavaScript constructs such as Map,
* ensuring objects are restored as instances of their original kind rather than just POJOs
* providing support for proper handling of classes derived from Array
* distinct packaging for NodeJS and the browser including pre-minified code
* the addition of unit tests

For a detailed review of the changes see http://anywhichway.github.io/cycler.html

For reference here is the cycle.js download data:

[![NPM](https://nodei.co/npm/cycle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cycle/)

Please star Cycler on NPM and GitHub if you find it useful.


# Installation

npm install cycler

The index.js and package.json files are compatible with https://github.com/anywhichway/node-require so that Cycler can be served directly to the browser from the node-modules/cycler directory when using node Express.

Browser code can also be found in the browser directory at https://github.com/anywhichway/cycler.
 
# Usage


Usage is almost identical to that of cycle.js; with the exception the "root" object is ```Cycler``` rather than ```cycle```.

Additionally, ```Cycler.decycle``` and ```Cycler.retrocycle``` can take 
a second argument which is the constructor context to be used. If a context is not provided, the ```global``` scope is used in NodeJS and ```window``` is used in the browser. The only values required in the context are constructors, which should be keyed by their name, e.g.:

```
function MyConstructor(name) { this.name = name; this.self = this; }; // trivial cyclic class
var instance = new MyConstructor("joe");
var decycled = Cycler.decycle(instance,{MyConstructor:MyConstructor});
Cycler.retrocycle(decycled,{MyConstructor:MyConstructor});
```

The context is only required for ```.decycle``` if your constructors are anonymous or their name properties are unavailable (as is the case with Internet Explorer).

You will not need to use the context argument for ```.retrocycle```, if all your constructors are available in the same scope as Cycler.

If constructors are unavailable in a target restoration environment, then POJOs will be returned.

# Building & Testing

Building & testing is conducted using Travis, Mocha, Chai, and Istanbul.

# Updates (reverse chronological order)

2016-05-05 v0.1.1 - Modified behavior so that if a class can't be found in scope for reviving, then a POJO is created and the $class property is left in place as a non-enumerable property to support debugging. Modified behavior so retrocycle just returns value if it is not an object. Optimized resurrect function down to one call from multiple property creation calls.

2016-05-04 v0.1.0 - simplified packaging, no functional changes, amd modules no longer supported which may break dependents, so major version incremented.

2016-02-XX v0.0.1 - v0.0.8 ongoing optimization and enhancement of Douglas Crockfords cycle.js. v0.0.8 appears to be as far as things can be taken.