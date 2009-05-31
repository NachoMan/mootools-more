/*
Script: Date.js
	Extends the Date native object to include methods useful in managing dates.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
		Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
		Harald Kirshner - mail [at] digitarald.de; http://digitarald.de

*/

(function(){

['now', 'parse', 'UTC'].each(function(method){
	Native.genericize(Date, method, true);
});

Date.Methods = {};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'DaysInMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

$each({
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
}, function(value, key){
	Date.Methods[key] = value;
});

var zeroize = function(what, length){
	return '0'.repeat(length - what.toString().length) + what;
};

Date.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				prop = prop.toLowerCase();
				var m = Date.Methods;
				if (m[prop]) this['set' + m[prop]](value);
		}
		return this;
	},

	get: function(prop){
		prop = prop.toLowerCase();
		var m = Date.Methods;
		if (m[prop]) return this['get' + m[prop]]();
		return null;
	},

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = $pick(times, 1);
		
		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('daysInMonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}
		
		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');
		
		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * $pick(times, 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(d, resolution){
		resolution = resolution || 'day';
		if ($type(d) == 'string') d = Date.parse(d);
		
		switch (resolution){
			case 'year':
				return d.get('year') - this.get('year');
			case 'month':
				var months = (d.get('year') - this.get('year')) * 12;
				return months + d.get('mo') - this.get('mo');
			default:
				var diff = d.get('time') - this.get('time');
				if (Date.units[resolution]() > diff.abs()) return 0;
				return ((d.get('time') - this.get('time')) / Date.units[resolution]()).round();
		}
		
		return null;
	},
	
	getDaysInMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getWeek: function(){
		return (this.get('dayofyear') / 7).ceil();
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+')
			+ zeroize((off.abs() / 60).floor(), 2)
			+ zeroize(off % 60, 2);
	},
	
	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM')
			return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM')
			return this.increment('hour', 12);
		return this;
	},
	
	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date) {
		return !!(date || this).valueOf();
	},

	format: function(f){
		if (!this.isValid()) return 'invalid date';
		f = f || '%x %X';
		f = formats[f.toLowerCase()] || f;	// replace short-hand with actual format
		var d = this;
		
		return f.replace(/\%([aAbBcdHIjmMpSUWwxXyYTZ\%])/g,
			function($1, $2){
				switch ($2){
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return zeroize(d.get('date'), 2);
					case 'H': return zeroize(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return zeroize(d.get('dayofyear'), 3);
					case 'm': return zeroize((d.get('mo') + 1), 2);
					case 'M': return zeroize(d.get('min'), 2);
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return zeroize(d.get('seconds'), 2);
					case 'U': return zeroize(d.get('week'), 2);
					case 'W': throw new Error('%W is not supported yet');
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
					case '%': return '%';
				}
				return $2;
			}
		);
	},
	
	toISOString: function(){
		return this.format('iso8601');
	}

});

Date.alias('diff', 'compare');
Date.alias('format', 'strftime');

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	iso8601: '%Y-%m-%dT%H:%M:%S%T',
	rfc822: '%a, %d %b %Y %H:%M:%S %Z',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M'
};

var nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1;
	var translated = Date.getMsg(type + 's');
	
	switch ($type(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[month - 1];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + index);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length)    throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}
	
	return (num) ? translated.indexOf(ret) : ret;
};


Date.extend({

	getMsg: function(key, args) {
		return MooTools.lang.get('Date', key, args);
	},
	
	units: {
		ms: $lambda(1),
		second: $lambda(1000),
		minute: $lambda(60000),
		hour: $lambda(3600000),
		day: $lambda(86400000),
		week: $lambda(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth($pick(month, d.get('mo')), $pick(year, d.get('year'))) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},
	
	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return new Date(year, 1, 29).get('date') == 29;
	},

	parse: function(from){
		var t = $type(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;
		
		var parsed;
		Date.parsePatterns.some(function(pattern){
			var r = pattern.re.exec(from);
			return (r) ? (parsed = pattern.handler(r)) : false;
		});
		
		return parsed || new Date(nativeParse(from));
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(localDate.get('year'), localDate.get('mo'),
		localDate.get('date'), localDate.get('hr'), localDate.get('min'), localDate.get('sec'));
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
		return Date;
	},

	defineFormats: function(formats){
		for (var name in formats) Date.defineFormat(name, formats[f]);
		return Date;
	},

	parsePatterns: [],
	
	defineParser: function(format){
		Date.parsePatterns.push( (format.re && format.handler) ? format : build(format) );
		return Date;
	},
	
	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
		return Date;
	},
	
	define2DigitYearStart: function(year){
		yr_start = year % 100;
		yr_base = year - yr_start;
		return Date;
	}

});

var yr_base = 1900;
var yr_start = 70;

var keys = {
	a: /[a-z]{3,}/,
	d: /\d{1,2}/,
	s: /\d+/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	T: /Z|[+-]\d{2}(?::?\d{2})?/,
	
	o: /[^\d\s]*/,
	X: /%H([.:]%M)?([.:]%S([.:]%s)?)?\s?%p?\s?%T?/
};

keys.B = keys.b = keys.A = keys.a;
keys.H = keys.I = keys.m = keys.M = keys.S = keys.d;

var parsers = function(key){
	if (key == 'x')		// iso8601 covers yyyy-mm-dd, so just check if month is first
		return (Date.orderIndex('month') == 1) ? '%m[.-/]%d([.-/]%y)?' : '%d[.-/]%m([.-/]%y)?';
	
	return keys[key] ? keys[key].source : null;
};

var lang;

var build = function(format){
	if (!lang) return {format: format};	// wait until language is set
	
	var parsed = [null];

	var re = (format.source || format)	// allow format to be regex
	 .replace(/%([xXo])/g,
		function($1, $2){
			return parsers($2) || $2;
		}
	).replace(/\((?!\?)/g, '(?:')		// make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ')		// be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($1, $2){
			var f = parsers($2);
			if (!f) return $2;
			parsed.push($2);
			return '(' + f + ')';
		}
	);
	
	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		
		handler: function(bits){
			var date = new Date().clearTime();

			for (var i = 1; i < parsed.length; i++)
				date = handle.call(date, parsed[i], bits[i]);

			return date;
		}
	};
};

var handle = function(key, value){
	if (!value){
		if (key == 'm' || key == 'd') value = 1;
		else return this;
	}
	
	switch(key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': 			return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm':			return this.set('mo', value - 1);
		case 'M':			return this.set('min', value);
		case 'p':			return this.set('ampm', value.replace(/\./g, ''));
		case 'S':			return this.set('sec', value);
		case 's': 			return this.set('ms', ('0.' + value) * 1000);
		case 'w':			return this.set('day', value);
		case 'Y':			return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += yr_base + (value < yr_start ? 100 : 0);
			return this.set('year', value);
		case 'T':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-]\d{2}):?(\d{2})?/);
			offset = offset[1] * 60 + (offset[2] || 0).toInt() + this.getTimezoneOffset();
			return this.set('time', (this * 1) + offset * 60000);
	}
	
	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?',		// "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?',					// "19991231", "19991231T1159", compact
	'%x( %X)?',								// "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?',				// "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?'				// "December 1999" and same as above with month and day switched
);

MooTools.lang.addEvent('langChange', function(language){
	if (!MooTools.lang.get('Date')) return;
	
	lang = language;
	Date.parsePatterns.each(function(pattern, i){
		if (pattern.format) Date.parsePatterns[i] = build(pattern.format);
	});
	
}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();