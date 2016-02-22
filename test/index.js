var expect, Cycler;
if(typeof(window)==="undefined") {
	expect = require("chai").expect;
	Cycler = require('../index.js');
}

describe('Cycler ', function() {
	it('should support cycling Objects ', function() {
		var a = {name:"a"};
		var b = {name:"b"};
		a.related = b;
		b.related = a;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled.related.related).to.equal(retrocycled);
	});
	it('should support complex cycling Objects ', function() {
		var a = {name:"a"};
		var b = {name:"b"};
		var c = {name:"c"}
		a.related = b;
		b.related = a;
		b.anotherRelation = c;
		c.related = b;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled.related.anotherRelation.related).to.equal(retrocycled.related);
	});
	it('should support cycling null property values ', function() {
		var a = {name:"a",unrelated:null};
		var b = {name:"b",unrelated:null};
		a.related = b;
		b.related = a;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled.related.related).to.equal(retrocycled);
		expect(retrocycled.related.unrelated).to.equal(null);
	});
	it('should support cycling nested Arrays ', function() {
		var a = {name:"a"};
		var b = [a];
		a.b = b;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled.b[0]).to.equal(retrocycled);
	});
	it('should support cycling top level Arrays ', function() {
		var a = {name:"a"};
		var b = [a];
		a.b = b;
		var decycled = Cycler.decycle(b);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled[0].b).to.equal(retrocycled);
	});
	it('should support cycling custom classes ', function() {
		function A(name) {
			this.name = name;
		}
		function B(name) {
			this.name = name;
		}
		var a = new A("a");
		var b = new B("b");
		a.related = b;
		b.related = a;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled,{A:A,B:B});
		expect(retrocycled.related.related).to.equal(retrocycled);
		expect(retrocycled.constructor).to.equal(A);
	});
	it('should support POJO creation when new scope does not contain constructor for $kind ', function() {
		function A1(name) {
			this.name = name;
		}
		function B1(name) {
			this.name = name;
		}
		var a = new A1("a");
		var b = new B1("b");
		a.related = b;
		b.related = a;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled);
		expect(retrocycled.related.related).to.equal(retrocycled);
		expect(retrocycled.constructor).to.equal(Object);
	});
	it('should support cycling custom nested arrays ', function() {
		function A(name) {
			this.name = name;
		}
		function B() {
			for(var i=0;i<arguments.length;i++) {
				this.push(arguments[i]);
			}
		}
		B.prototype = Object.create(Array.prototype);
		B.prototype.constructor = B;
		var a = new A("a");
		var b = new B(a);
		a.related = b;
		var decycled = Cycler.decycle(a);
		var retrocycled = Cycler.retrocycle(decycled,{B:B});
		expect(retrocycled.related[0]).to.equal(retrocycled);
		expect(retrocycled.related.constructor).to.equal(B);
	});
	it('should support anonymous constructors ', function() {
		var A = function(name) {
			this.name = name;
		}
		var B = function() {
			for(var i=0;i<arguments.length;i++) {
				this.push(arguments[i]);
			}
		}
		B.prototype = Object.create(Array.prototype);
		B.prototype.constructor = B;
		var a = new A("a");
		var b = new B(a);
		a.related = b;
		var decycled = Cycler.decycle(a,{A:A,B:B});
		var retrocycled = Cycler.retrocycle(decycled,{A:A,B:B});
		expect(retrocycled.related[0]).to.equal(retrocycled);
		expect(retrocycled.related.constructor).to.equal(B);
	});
	it('should support cycling custom top level arrays ', function() {
		function B() {
			for(var i=0;i<arguments.length;i++) {
				this.push(arguments[i]);
			}
		}
		B.prototype = Object.create(Array.prototype);
		B.prototype.constructor = B;
		var a = {name:"a"};
		var b = new B(a);
		a.b = b;
		var decycled = Cycler.decycle(b);
		var retrocycled = Cycler.retrocycle(decycled,{B:B});
		expect(retrocycled[0].b).to.equal(retrocycled);
		expect(retrocycled[0].b.constructor).to.equal(B);
	});
})
