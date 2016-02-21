/*
    Copyright, Feb 2016, AnyWhichWay
    
    MIT License (since some CDNs and users must have some type of license and MIT in pretty un-restrictive)
    
    Substantive portions based on:
    
    cycle.js
    2013-02-19 crockford

    Public Domain.
    
*/
(function() {
	"use strict";

var cycler = {};

cycler.decycle = function decycle(object, context) {

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form
//      {$ref: PATH}
// where the PATH is a JSONPath string that locates the first occurance.
// So,
//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));
// produces the string '[{"$ref":"$"}]'.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child member or
// property.

   // AnyWhichWay do any required top-level conversion from POJO's to $kinds
   context = (context ? context : (this ? this : (typeof(window)!=="undefined" ? window : null)));

   var objects = new Map(); // AnyWhichWay, replaced objects and paths arrays with Map, Feb 2016

    return (function derez(value, path) {

// The derez recurses through the object, producing the deep copy.

        var i,          // The loop counter
        	pathfound, // AnyWhichWay added Feb 2016
            name,       // Property name
            nu;         // The new object or array

// typeof null === 'object', so go on if this value is really an object but not
// one of the weird builtin objects.

        if (typeof value === 'object' && value !== null &&
                !(value instanceof Boolean) &&
                !(value instanceof Date)    &&
                !(value instanceof Number)  &&
                !(value instanceof RegExp)  &&
                !(value instanceof String)) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a $ref/path object. 

            pathfound = objects.get(value); // AnyWhichWay replaced array loops with Map get, Feb 2016
            if(pathfound) {
            	return {$ref: pathfound};
            }
        	
// Otherwise, accumulate the unique value and its path.
			objects.set(value,path); // AnyWhichWay replace array objects and paths with Map, Feb 2016
// If it is an array, replicate the array.
            if (Object.prototype.toString.apply(value) === '[object Array]' || value instanceof Array) { // instanceof added by AnyWhichWay, Feb 2016
                nu = [];
                for (i = 0; i < value.length; i += 1) {
                    nu[i] = derez(value[i], path + '[' + i + ']');
                }
                // AnyWhichWay augment array with $kind
                if(!value.constructor.name) {
                	Object.keys(context).some(function(name) {
                		if(context[name]===value.constructor) {
                			nu.push({$kind: name});
                			return true;
                		}
                	});
                } else {
                    nu.push({$kind: value.constructor.name});
                }
            } else {
// If it is an object, replicate the object.
                nu = {};
                for (name in value) {
                    if (Object.prototype.hasOwnProperty.call(value, name)) {
                        nu[name] = derez(value[name],
                            path + '[' + JSON.stringify(name) + ']');
                    }
                }
                // AnyWhichWay augment objects with $kind
                if(!value.constructor.name) {
                	Object.keys(context).some(function(name) {
                		if(context[name]===value.constructor) {
                			nu.$kind = name;
                			return true;
                		}
                	});
                } else {
                	nu.$kind = value.constructor.name; 
                }
            }
            return nu;
        }
        return value;
    }(object, '$'));
};

function convert(item) {
	var obj;
	if(item && item.$kind) {
		// make sure constructors exist in target environment
		if(typeof(this[item.$kind])==="function") {
          	obj = Object.create(this[item.$kind].prototype);
       		obj.constructor = this[item.$kind];
       		for(var key in item) {
       			if(key!=="$kind") {
       				obj[key] = item[key];
       			}
       		}
       		item = obj;
		} else {
			delete item.$kind;
		}
   	// $kind exists as the single data member of the last item in an Array
   	} else if(item instanceof Array) {
   		if(item[item.length-1].$kind && Object.keys(item[item.length-1]).length===1) {
   			if(typeof(this[item[item.length-1].$kind])==="function") {
           		obj = Object.create(this[item[item.length-1].$kind].prototype);
           		obj.constructor = this[item[item.length-1].$kind];
           		for(var i=0;i<item.length-1;i++) {
           			obj.push(item[i]);
           		}
           		item = obj;
   			} else {
   				item.splice(item.length-1,1);
   			}
   		}
   	}
	return item;
}

cycler.retrocycle = function retrocycle($,context) {

	function resolve(string) {
		return eval(string);
	}
// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// AnyWhichWay
// Object containing $kind member are converted to the kind specified
// Arrays with last member {$kind: <some kind>} are converted to the specified kind of array

// A dynamic Function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.
	
	// AnyWhichWay do any required top-level conversion from POJO's to $kinds
	context = (context ? context : (this ? this : (typeof(window)!=="undefined" ? window : null)));
	$ = convert.call(context,$);
	
    var obj, px =
        /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

    (function rez(value) {

// Modified by AnyWhichWay, Feb 2016
// The rez function walks recursively through the object looking for $ref
// and $kind properties or array values. When it finds a $ref value that is a path, 
// then it replaces the $ref object with a reference to the value that is found by
// the path. When it finds a $kind value that names a function in the global scope,
// it assumes the function is a constructor and uses it to create an object which
// replaces the JSON such that it is restored with the appropriate class semantics
// and capability rather than just a general object. If no constructor exists, a
// POJO is used.

        var i, item, name, path;

        //if (value && typeof value === 'object') {
            if (value && (Object.prototype.toString.apply(value) === '[object Array]' || value instanceof Array)) { // AnyWhichWay added instanceof check, Feb 2016
                for (i = 0; i < value.length; i += 1) {
                    item = value[i];
                    if (item && typeof item === 'object') {
                    	// added by AnyWhichWay, Feb 2016
                    	item = convert.call(context,item);
                    	// re-assign in case item has been converted
                       	value[i] = item;
                       	// end AnyWhichWay addition
                        path = item.$ref;
                        if (typeof path === 'string' && px.test(path)) {
                            value[i] = resolve(path); 
                        } else {
                            rez(item);
                        }
                    }
                }
            } else {
                for (name in value) {
                	item = value[name];
                    if (item && typeof value[name] === 'object') {
                    	// added by AnyWhichWay, Feb 2016
                    	item = convert.call(context,item);
                    	// re-assign in case item has been converted
                       	value[name] = item;
                        // end AnyWhichWay addition
                        path = item.$ref;
                        if (typeof path === 'string' && px.test(path)) {
                            value[name] = resolve(path);
                        } else {
                            rez(item);
                        }
                    }
                }
            }
      //  }
    }($));
    return $;
}

if (this.exports) {
	this.exports  = cycler;
} else if (typeof define === 'function' && define.amd) {
	// Publish as AMD module
	define(function() {return cycler;});
} else {
	this.Cycler = cycler;
}

}).call((typeof(window)!=='undefined' ? window : (typeof(module)!=='undefined' ? module : null)));