(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*
    Copyright, Feb 2016, AnyWhichWay
    
    MIT License (since some CDNs and users must have some type of license and MIT in pretty un-restrictive)
    
    Substantive portions based on:
    
    cycle.js
    2013-02-19 douglas crockford

    Public Domain.
    
 */
(function() {
	"use strict";

	var cycler = {};
	
	function isArray(value) {
		return Array.isArray(value) || value instanceof Array;
	}

	// AnyWhichWay, Feb 2016, isolates code for tagging objects with $class
	// during decycle. See resurrect for the converse.
	function augment(context, original, decycled) {
		var classname = original.constructor.name;
		// look in context if classname not available
		if (!classname || classname === "") { 
			Object.keys(context).some(function(name) {
				if (context[name] === original.constructor) {
					classname = name;
					return true;
				}
			});
		}
		// add the $class info to array or object
		if (classname && classname.length > 0) { 
			if (isArray(decycled)) {
				decycled.push({
					$class : classname
				});
				return decycled;
			}
			decycled.$class = classname;
			return decycled;
		}
	}
	
	function getContext(context) {
		return (context ? context : (typeof (window) !== "undefined" ? window : global));
	}
	
	function isDecyclable(value) {
		return typeof(value)==="object" && value
		&& !(value instanceof Boolean) && !(value instanceof Date)
		&& !(value instanceof Number) && !(value instanceof RegExp)
		&& !(value instanceof String);
	}

	cycler.decycle = function decycle(object, context) {

		// Make a deep copy of an object or array, assuring that there is at
		// most one instance of each object or array in the resulting structure. The
		// duplicate references (which might be forming cycles) are replaced
		// with an object of the form
		// {$ref: PATH}
		// where the PATH is a JSONPath string that locates the first occurance.
		// So,
		// var a = [];
		// a[0] = a;
		// return JSON.stringify(JSON.decycle(a));
		// produces the string '[{"$ref":"$"}]'.
		// Add a $class property to objects or element to arrays so that they
		// can be restored as their original kind.

		// JSONPath is used to locate the unique object. $ indicates the top
		// level of the object or array. [NUMBER] or [STRING] indicates a 
		// child member or property.

		// AnyWhichWay, Feb 2016, establish context
		context = getContext(context);

		// AnyWhichWay, Feb 201, replaced objects and paths arrays with Map
		var objects = new Map(); 

		return (function derez(value, path) {

			// The derez recurses through the object, producing the deep copy.

			var pathfound, // AnyWhichWay added Feb 2016
			nu = (isArray(value) ? [] : {}); 

			// AnyWhichWay, Feb 2016, converted test to function call
			if (isDecyclable(value)) { 

				// If the value is an object or array, look to see if we have
				// encountered it. If so, return a $ref/path object.
				// AnyWhichWay, Feb 2016 replaced array loops with Map get
				pathfound = objects.get(value); 
				if (pathfound) {
					return {
						$ref : pathfound
					};
				}
				// Otherwise, accumulate the unique value and its path.
				// AnyWhichWay, Feb 2016 replace array objects and paths with Map
				objects.set(value, path); 

				Object.keys(value).forEach(
						function(key) {
							nu[key] = derez(value[key], path
									+ "["
									+ (isArray(nu) ? key : JSON
											.stringify(key)) + "]");
						});
				// AnyWhichWay, Feb 2016 augment with $class
				return augment(context, value, nu); 
			}
			// otherwise, just return value
			return value;
		}(object, "$"));
	};

	function getConstructor(context, item) {
		// process objects and return possibly modified item
		if (item && item.$class) {
			if (typeof (context[item.$class]) === "function") {
				return context[item.$class];
			}
			// otherwise delete the $class data
			delete item.$class;
		}
		if (isArray(item)
				&& item[item.length - 1].$class
				&& Object.keys(item[item.length - 1]).length === 1) {
			if (typeof (context[item[item.length - 1].$class]) === "function") {
				return context[item[item.length - 1].$class];
			}
			// otherwise delete the $class data
			item.splice(item.length - 1, 1);
		}
	}
	// AnyWhichWay, Feb 2016, isolates code for resurrecting objects as their
	// original type see augment for inverse
	function resurrect(context, item) {
		var cons = getConstructor(context, item);
		// process objects and return possibly modified item
		if (cons) {
			var obj = Object.create(cons.prototype);
			Object.defineProperty(obj, "constructor", {
				enumerable : false,
				configurable : true,
				writable : true,
				value : cons
			});
			Object.keys(item).forEach(function(key, i) {
				// skip class spec
				if (key !== "$class" && (i !== item.length - 1 || !isArray(item))) {
					obj[key] = item[key];
				}
			});
			return obj;
		}
		return item;
	}

	cycler.retrocycle = function retrocycle($, context) {

		// Restore an object that was reduced by decycle. Members whose values
		// are objects of the form {$ref: PATH}
		// are replaced with references to the value found by the PATH. This
		// will restore cycles. The object will be mutated.

		// AnyWhichWay, Feb 2016
		// Objects containing $class member are converted to the class specified
		// Arrays with last member {$class: <some kind>} are converted to the
		// specified class of array

		// A dynamic Function is used to locate the values described by a PATH.
		// Root object is kept in a $ variable. A regular expression is used to
		// assure that the PATH is well formed. The regexp contain nested
		// * quantifiers. That has been known to have extremely bad performance
		// problems on some browsers for very long strings. A PATH should be
		// reasonably short. A PATH is allowed to belong to a very restricted
		// subset of Goessner's JSONPath.

		// So,
		// var s = '[{"$ref":"$"}]';
		// return JSON.retrocycle(JSON.parse(s));
		// produces an array containing a single element which is the array
		// itself.

		// AnyWhichWay, Feb 2016, establish the context
		context = getContext(context);

		// AnyWhichWay, Feb 2016 do any required top-level conversion from
		// POJO's to $classs
		$ = resurrect(context, $);

		var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

		(function rez(value) {

			// Modified by AnyWhichWay, Feb 2016
			// The rez function walks recursively through the object looking for
			// $ref and $class properties or array values. When it finds a $ref value
			// that is a path, then it replaces the $ref object with a reference to the value
			// that is found by the path. When it finds a $class value that names a function in
			// the global scope, it assumes the function is a constructor and uses it to create an
			// object which replaces the JSON such that it is restored with the appropriate
			// class semantics and capability rather than just a general object. If no
			// constructor exists, a POJO is used.

			// AnyWhichWay, Feb 2016, replaced separate array and object loops with forEach
			Object.keys(value).forEach(
					function(name) {
						value[name] = resurrect(context, value[name]);
						if (value[name] && typeof value[name] === "object"
								&& typeof value[name].$ref === "string"
								&& px.test(value[name].$ref)) {
							value[name] = Function("dollar",
									"var $ = dollar; return " + value[name].$ref)($);
						} else if (value[name] && typeof value[name] === "object") {
							rez(value[name]);
						}
					});

		}($));
		return $;
	};

	if(typeof(module)!=="undefined") {
		module.exports = cycler;
	}
	if(typeof(window)!=="undefined") {
		window.Cycler = cycler;
	}
})();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
