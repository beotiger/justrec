/*
 * justrec - JavaScript Recording (using Flash)
 * http://beotiger.com/justrec
 *
 * based on jRecorder 1.1 by Sajith Amma
 *
 * Copyright (c) 2014 beotiger
 * Licensed under the MIT
 *  - http://www.opensource.org/licenses/mit-license.php
 *
 * Author: beotiger
 * Version: 1.0
 * Date: 21-28 October 2014 AD
 * 
 */

// justrec CONSTRUCTOR
var justrec = {

	settings: {},
	
	init: function( options, element ) {
		if(element) {
			if (element.jquery) {
				element = element[0];
			} else if (typeof element == 'string') {
				if (/^#.*/.test(element))
					element = element.slice(1);
				element = document.getElementById(element);
			}
		}
		
		// if the element is not defined, append to body then
		if (!element || element.nodeType != 1)
			element = document.getElementsByTagName('body')[0];
		
		// init default settings
		this.settings = {
			'rec_width': 480,
			'rec_height': 320,
			
			'recorderlayout_id' : 'justrec_area',
			'recorder_id' : 'justrec',
			'recorder_name': 'justrec',
			
			'swf_path': 'justrec.swf',
			'host': 'micupload.php?f=justrec.mp3',
			
			// callback functions
			'recordingStarted' : function(){},
			'recordingStopped': function(){},
			'recordingError' : function(){},
			
			'recordingActivity': function(time, level){},
			
			'sendingFinished' : function(){},
			'sendingProgress' : function(percent){},
			
			'mp3Converting' : function(percent){},
			'mp3Converted' : function(){},
			'mp3ConvertingError' : function(){}
		};
			
		// reset new added options
		for (var prop in options)
				this.settings[prop] = options[prop];
		
		// inject flash object into page
		var createParam = function(el, n, v) {
			var p = document.createElement("param");
			p.setAttribute("name", n);
			p.setAttribute("value", v);
			el.appendChild(p);
		};
		
		htmlObj = document.createElement("object");
		htmlObj.setAttribute("id", this.settings['recorder_id'] );
		htmlObj.setAttribute("name", this.settings['recorder_name'] );
		htmlObj.setAttribute("data",  this.settings['swf_path'] + '?host=' + this.settings['host'] );
		htmlObj.setAttribute("type", "application/x-shockwave-flash");
		htmlObj.setAttribute("width", this.settings['rec_width']);
		htmlObj.setAttribute("height", this.settings['rec_height']);
		
		createParam(htmlObj, "allowscriptaccess", 'always');
		createParam(htmlObj, "bgcolor", '#FFF');
		createParam(htmlObj, "wmode", 'transparent' );
		
		// container DIV
		var divObj = document.createElement("div");
		divObj.setAttribute("id", this.settings['recorderlayout_id']);
		divObj.setAttribute("style", 'position:absolute; top:0; left:0; z-index:-1');
		divObj.appendChild(htmlObj);
		
		// change positioning type of element if it is STATIC
		var elPosType = element.style.position.toUpperCase(),
				elStatic = (elPosType == '' || elPosType == 'STATIC');
				
		if(element.nodeName.toUpperCase() != 'BODY' && elStatic)
			element.style.position = 'relative';
		
		element.appendChild(divObj);
	},

	// return flash object from name
	getFlashMovie: function (movieName) {
		 return window.document[movieName];
	},

	/***************/
	/** COMMANDS **/
	/*************/

	// start a recording
	record: function(maxTime){
		//change z-index to make it top
		document.getElementById(this.settings['recorderlayout_id']).style.zIndex = 100000;
		this.getFlashMovie(this.settings['recorder_name']).jStartRecording(maxTime);
	},

	// stop recording
	stop: function(){
		this.getFlashMovie(this.settings['recorder_name']).jStopRecording();
	},

	// preview recording
	preview: function(){
		this.getFlashMovie(this.settings['recorder_name']).jPreview();
	},

	// stop previewing recording
	stoppreview: function(){
		this.getFlashMovie(this.settings['recorder_name']).jStopPreview();
	},

	// convert recording to MP3
	convert: function(){
		this.getFlashMovie(this.settings['recorder_name']).jConvert2MP3();
	},

	// send MP3 data to server
	send: function(){
		this.getFlashMovie(this.settings['recorder_name']).jSendFileToServer();
	},

	/****************/
	/** CALLBACKS **/
	/**************/

	recordingStarted: function() {
		this.settings['recordingStarted']();
	},

	recordingStopped: function() {
		this.settings['recordingStopped']();
	},

	recordingError: function() {
		this.settings['recordingError']();
	},

	sendingProgress: function(percent) {
		this.settings['sendingProgress'](percent);
	},

	sendingFinished: function() {
		this.settings['sendingFinished']();
	},

	recordingActivity: function(time, level) {
		document.getElementById(this.settings['recorderlayout_id']).style.zIndex = -1;
		this.settings['recordingActivity'](time, level);
	},

	//  process of converting to mp3
	mp3Converting: function(percent) {
		this.settings['mp3Converting'](percent);
	},

	//  done converting to mp3
	mp3Converted: function() {
		this.settings['mp3Converted']();
	},

	// if error occurred while converting
	mp3ConvertingError: function() {
		this.settings['mp3ConvertingError']();
	}

} // /justrec CONSTRUCTOR
