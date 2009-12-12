/*
---
 
script: Element.ESI.js
 
description: Extends the Element native object to include methods for handling Edge-Side Include (ESI) directives for debugging purposes.
 
credits: "Derived from Jay Kuri <jayk@cpan.org> from http://www.catalystframework.org/calendar/2008/17"
 
license: MIT-style license
 
authors:
- Michael Nachbaur
 
requires:
- core:1.2.4/Request.HTML
- /MooTools.More
 
provides: [Element.ESI]
 
...
*/

Element.implement({

	processESI: function(){
        var reg = /<!--esi(.*)-->/gm;
        var data = this.get('html');
        if (data.indexOf('<!--esi') != -1) {
            this.set('html', data.replace(/<!--esi(.*)-->/gm, "$1"));
        }

        var includes = this.getElementsByTagName('esi:include');
        for (var i = 0; i < includes.length; i++) {
            var include = includes[i];
            (function(el) {
                var req = new Request.HTML({
                    url:    el.get('src')
                });
                req.addEvent('success', function(nodes) {
                    for (var j = 0; j < nodes.length; j++) {
                        var node = nodes[j];
                        el.parentNode.appendChild(node, el);
                    }
                    el.processESI();
                    el.destroy();
                });
                req.send();
            })(include);
        }

        var removes = this.getElementsByTagName('esi:remove');
        for (var i = 0; i < removes.length; i++) {
            removes[i].destroy();
        }
	}

});
