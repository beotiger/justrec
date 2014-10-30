<?php

// f is mandatory parameter
// for default host parameter
if(!isset($_REQUEST['f']))
 die('ERR');

// add timestamp to default file name
$filename = 'recs/'.$_REQUEST['f'].'_'.date('Ymd-His');

// save file on the server side
file_put_contents($filename.'.mp3', file_get_contents('php://input'));

// blank or corrupted file - delete it and spawn error
if(filesize($filename.'.mp3') < 10) {
	@unlink($filename);
	die('ERR');
}

die('OK');
