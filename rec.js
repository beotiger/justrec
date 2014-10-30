$(document).ready(function() {
		// INITIALIZATION
	justrec.init({
			swf_path : 'justrec.swf',
			host : 'micupload.php?f=jrec' ,
			
			recordingStarted: justStarted,
			recordingStopped: justStopped,
			recordingError: 	recordError,			
			
			recordingActivity: function(time, level) { activity(time, level); },
			
			sendingFinished:  sendingFinished,
			sendingProgress:	function(percent) { sending(percent); },
			
			mp3Converting:		function(percent) { converting(percent); },
			mp3Converted: 		converted,
			mp3ConvertingError: convertError
	 }, 'myflashrec');

	// COMMANDS
	var maxTime; // store maximum time for recording globally
	
	$('#record').click(function(){
		$('#stop').prop('disabled', false);
		$('#record').prop('disabled', true);
		
		// define maxTime from select field
		maxTime = parseInt($('#maxtime').val());
			if(!$.isNumeric(maxTime))
				maxTime = 30;
			else if(maxTime < 1 || maxTime > 600)
				maxTime = 30;
				
		__log('** justrec.record(' + maxTime + ')');
		justrec.record(maxTime);
	});

	$('#stop').click(function(){
		__log('** justrec.stop()')
	 justrec.stop();
	});

	$('#preview').click(function(){
	 __log('** justrec.preview()');
	 justrec.preview();
	});
	$('#stoppreview').click(function(){
	 __log('** justrec.stoppreview()');
	 justrec.stoppreview();
	});
	

	$('#convert').click(function(){
	 __log('** justrec.convert()');
	 
	 $('#level').text('');
	 justrec.convert();
	});

	$('#send').click(function(){
		__log('** justrec.send()');
		
		$('#level').text('');
		justrec.send();
	});

	// EVENTS

	function recordError()
	{
		__log('?? Recording error');
	}

	function justStarted()
	{
		__log('Recording is started');
	}

	function justStopped()
	{
		$('#record').prop('disabled', false);
		$('#stop').prop('disabled', true);

		__log('Stop request is accepted');
	}

	// sending process
	function sending(percent)
	{
		__log('..sending file to server: ' + percent + '%');
		
		var wid = Math.round($('#levelbase').width() * ( percent / 100));
		$('#levelbar').width(wid);

	}

	function sendingFinished()
	{
		__log('!! File has been sent to server');
	}

	function activity(time, level)
	{
		// maxTime - global var
		var time = maxTime - time;
		if (time < 0) time = 0;
		var min = Math.floor(time / 60),
				sec = Math.floor(time % 60);

		$('#time').text((min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec);
		
		$('#level').text(level);
		
		if(level == -1)
			$('#levelbar').width(4);
		else
			$('#levelbar').width(level * 4);
	}

	// MP3 converting process event callbacks
	function converting(percent)
	{
		__log('..converting to MP3: ' + percent + '%');
		var wid = Math.round($('#levelbase').width() * ( percent / 100));
		$('#levelbar').width(wid);

	}
	
	function converted()
	{
		__log('!! Converting to MP3 succeeded');
	}

	function convertError()
	{
		__log('?? Error converting to MP3');
	}

	// let's log...
	function __log(s)
	{
		$('#log').val($('#log').val() + s + '\n')
		.scrollTop($('#log')[0].scrollHeight);
	}

});
