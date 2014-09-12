var myBot = require('./ptt-bot');
var fs = require('fs');
var iconv = require('iconv-lite'); 

//create the connection object for robot.
myBot.login('chengrobot','ps2014',function(){
	console.log('hi, chenchen chang, how are you?');
	//console.log(myBot.getScreen());
	fs.writeFile('screen/screen1.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('It\'s saved!');
	});
});
myBot.sendRight(function(){
	console.log('hi, chenchen chang, sendRight has been sent');
	console.log(myBot.getScreen());
});

/*
myBot.toBoard('movie',function(){
	console.log(myBot.getScreen());
	fs.writeFile('screen/screen2.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('It\'s saved!');
	});
});
*/