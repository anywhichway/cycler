# cycler.js

Cycler.js is based on a fork of the hugely popular cycle.js code base from Douglas Crockford, Nuno Job, and Justin Warkentin. 

Cycler is typically used to serialize objects prior to file storage or network transmission. So long as the same constructors are available in the serializing and de-serializing environments it
ensures that functional semantics follow along with data as it is transmitted or stored and restored. This is ideal for fully isomorphic programming and distributed processing.

It enhances their work through:

-- the utilization of newer JavaScript constructs such as Map,
-- ensuring objects are restored as instances of their original kind rather than just POJOs
-- providing support for proper handling of classes derived from Array
-- distinct packaging for NodeJS and the browser including pre-minified code
-- the addition of unit tests

[![Build Status](https://travis-ci.org/anywhichway/recycler.svg)](https://travis-ci.org/anywhichway/recycler)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/42cd44eee8794c22aa7a4f780abd2d0b)](https://www.codacy.com/app/syblackwell/recycler)
[![Code Climate](https://codeclimate.com/github/anywhichway/recycler/badges/gpa.svg)](https://codeclimate.com/github/anywhichway/recycler)
[![Test Coverage](https://codeclimate.com/github/anywhichway/recycler/badges/coverage.svg)](https://codeclimate.com/github/anywhichway/recycler/coverage)
[![Issue Count](https://codeclimate.com/github/anywhichway/recycler/badges/issue_count.svg)](https://codeclimate.com/github/anywhichway/recycler)


For reference here is the cycle.js data:

[![NPM](https://nodei.co/npm/cycle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cycle/)


# Installation

npm install jovial

The index.js and package.json files are compatible with https://github.com/anywhichway/node-require so that jovial can be served directly to the browser from the node-modules/cycler directory when using node Express.

Browser code can also be found in the browser directory at https://github.com/anywhichway/cycler.
 
# Usage


Usage is almost identical to that of cycle.js; with the exception the "root" object is ```Cycler``` rather than ```cycle```.

Additionally, ```Cycler.decycle``` and ```Cycler.retrocycle``` can take 
a second argument which is the constructor context to be used. If a context is not provided, the currently available scope is used in NodeJS and ```window``` is used in the browser. The only values required in the context are constructors, which should be keyed by their name, e.g.:

```
function MyConstructor(name) { this.name = name; this.self = this; }; // trivial cyclic class
var instance = new MyConstructor("joe");
var decycled = Cycler.decycle(instance,{MyConstructor:MyConstructor});
Cycler.retrocycle(decycled,{MyConstructor:MyConstructor});
```

The context is only required for ```.decycle``` if your constructors are anonymous or their name properties are unavailable (as is the case with Internet Explorer).

You will not need to use the context argument for ```.retrocycle```, if all your constructors are available in the same scope as Cycler, .

If constructors are unavailable in a target restoration enviornment, then POJOs will be returned.


