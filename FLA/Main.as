package
{
	import fr.kikko.lab.ShineMP3Encoder;

	import flash.events.ErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.StatusEvent;
	
	import flash.display.Sprite;
	import flash.media.Microphone;
	import flash.system.Security;
	
	import org.bytearray.micrecorder.*;
	import org.bytearray.micrecorder.events.RecordingEvent;
	import org.bytearray.micrecorder.encoder.WaveEncoder;
	
	import flash.events.MouseEvent;
	import flash.events.Event;
	import flash.events.ActivityEvent;

	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.display.LoaderInfo;
	import flash.external.ExternalInterface;
	import flash.media.Sound;

	import org.as3wavsound.WavSound;
	import org.as3wavsound.WavSoundChannel;
	
	public class Main extends Sprite
	{
		// private var recBar:RecBar = new RecBar();
		
		private var mic:Microphone;
		private var waveEncoder:WaveEncoder = new WaveEncoder();
		private var recorder:MicRecorder = new MicRecorder(waveEncoder);
		
		private var maxTime:Number = 30;	// default time to record in seconds

		private var tts:WavSound;
		private var playingChannel:WavSoundChannel;
		
		private var mp3Encoder:ShineMP3Encoder;
		private var mp3done:Boolean = false;	// if we done converting to mp3
		
		private var wasRecorded:Boolean = false;	// if we done recording
		
		private var isPreviewing:Boolean = false;	// if we are in previewing state now?
		private var isConverting:Boolean = false;	// if we are in converting state now?
		
		public function Main():void
		{
			mic = Microphone.getMicrophone();
			mic.setSilenceLevel(mic.activityLevel);
			mic.gain = 50;
			mic.setLoopBack(false);
			mic.setUseEchoSuppression(true);
		
			recorder.addEventListener(RecordingEvent.RECORDING, recording);

			addCommands();
		}
		
		public function jStartRecording(max_time:Number):void
		{
			if (mic != null) {
				mp3done = false;
				wasRecorded = false;
				maxTime = max_time;

				recorder.record();
				// recorder.microphone.addEventListener(StatusEvent.STATUS, onMicStatus);

				ExternalInterface.call("justrec.recordingStarted");
			}
			else
			{
				ExternalInterface.call("justrec.recordingError");
			}
		}
		
		public function jStopRecording():void
		{
			recorder.stop();
			wasRecorded = true;
			
			mic.setLoopBack(false);
			ExternalInterface.call("justrec.recordingStopped");
		}
		
		public function jPreview():void
		{
			if(wasRecorded) {
				previewRecording();
			}
		}
		public function jStopPreview():void
		{
			if(isPreviewing) {
				stopPreviewRecording();
			}
		}

		// convert WAV to MP3
		public function jConvert2MP3():void
		{
			if(wasRecorded) {
				convert2mp3();
			}
		}

		public function jSendFileToServer():void
		{
			// do nothing if we have not converted our record
			if(mp3done) {
				sendRecording();			
			}
			else {
				ExternalInterface.call("justrec.mp3ConvertingError");
			}
		}
		
		/* ************ */
		/* Private area */
		/* ************ */
		
		private function recording(e:RecordingEvent):void
		{
			var currentTime:int = Math.floor(e.time / 1000);
			ExternalInterface.call("justrec.recordingActivity",  String(currentTime),  mic.activityLevel);
			
			if(currentTime >= maxTime )
			{
				// force stop recording
				jStopRecording();
			}
		}
		
		private function previewRecording():void
		{
			if(isConverting) {
				return;
			}

			if(isPreviewing) {
				stopPreviewRecording();
			}
			
			isPreviewing = true;	// force into previewing mode
			
			tts = new WavSound(recorder.output);
      playingChannel = tts.play();

			// ?? ExternalInterface.call("justrec.previewStarted");
		}
		private function stopPreviewRecording():void
		{
      playingChannel.stop();
			isPreviewing = false;
			
			// ?? ExternalInterface.call("justrec.previewStopped");
		}
		
		// convert to mp3 using ShineMP3Encoder
		private function convert2mp3():void {
			if(isConverting) {
				return;
			}
			
			if(isPreviewing) {
				stopPreviewRecording();
			}
			
			// set position of ByteArray with WAV data to 0
			// either converting sticks if previewing is done
			recorder.output.position = 0;
			isConverting = true;

			mp3Encoder = new ShineMP3Encoder(recorder.output);
			mp3Encoder.addEventListener(Event.COMPLETE, mp3EncodeComplete);
			mp3Encoder.addEventListener(ProgressEvent.PROGRESS, mp3EncodeProgress);
			mp3Encoder.addEventListener(ErrorEvent.ERROR, mp3EncodeError);
			mp3Encoder.start();
		}
		
		private function mp3EncodeProgress(event: ProgressEvent) : void {
			var percent:int = Math.round(event.bytesLoaded / event.bytesTotal * 100);
			ExternalInterface.call("justrec.mp3Converting", String(percent));
		}
		
		private function mp3EncodeError(event: ErrorEvent) : void {
			isConverting = false;
			ExternalInterface.call("justrec.mp3ConvertingError");
		}
		
		private function mp3EncodeComplete(event: Event) : void {
			mp3done = true;	// converting flag
			isConverting = false;
			ExternalInterface.call("justrec.mp3Converted");
		}
		
		// send data to server
		private function sendRecording():void
		{
			var _var1:String = '';
			var globalParam:Object = LoaderInfo(this.root.loaderInfo).parameters;
			
			for (var element:String in globalParam) {
     		if (element == 'host'){
           	_var1 = globalParam[element];
     			}
			}
			
			if(_var1 != '')	{
				var req:URLRequest = new URLRequest(_var1);
        req.contentType = 'application/octet-stream';
				req.method = URLRequestMethod.POST;
				// req.data = recorder.output; -- for WAV data
				req.data = mp3Encoder.mp3Data;	// for MP3 data
				
				var loader:URLLoader = new URLLoader(req);
				loader.addEventListener(Event.COMPLETE, sendComplete);
				loader.addEventListener(ProgressEvent.PROGRESS, sendProgress);
			}
		}

		private function sendProgress(event: ProgressEvent) : void {
			var percent:int = Math.round(event.bytesLoaded / event.bytesTotal * 100);
			ExternalInterface.call("justrec.sendingProgress", String(percent));
		}
		
		// done sending record
		private function sendComplete(event: Event) : void {
			ExternalInterface.call("justrec.sendingFinished");
		}
		
		/* ***************** */
		// helper functions //
		/* *************** */
		
		private function addCommands():void
		{
			
			ExternalInterface.addCallback("jStartRecording", jStartRecording);
			ExternalInterface.addCallback("jStopRecording", jStopRecording);
			
			ExternalInterface.addCallback("jPreview", jPreview);
			ExternalInterface.addCallback("jStopPreview", jStopPreview);
			
			ExternalInterface.addCallback("jConvert2MP3", jConvert2MP3);
			ExternalInterface.addCallback("jSendFileToServer", jSendFileToServer);
		}
		
		// dispatches on allowing/denying access to Camera/Microphone
/*
		private function onMicStatus(event:StatusEvent):void 
		{ 
			ExternalInterface.call("justrec.micStatus");

			if (event.code == "Microphone.Muted")
			{
				ExternalInterface.call("justrec.recordingError");
				// trace("Microphone access was denied.");
			}
		}
*/
		
	}	// class Main
} // package
