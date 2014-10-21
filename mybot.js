var myBot = require('./PTT-BOT/ptt-bot');
var fs = require('fs');
var iconv = require('iconv-lite'); 

//create the connection object for robot.
myBot.login('chengrobot','ps2014',function(){
	console.log('hi, chenchen chang, how are you?');
	//console.log(myBot.getScreen());
	/*
	fs.writeFile('screen_data/cursormove.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('cursormove is saved!');
	});
	*/
});


myBot.toBoard('movie',function(){
	//console.log(myBot.getScreen());
	
	fs.writeFile('screen_data/toBoard.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('toBoard is saved!');
	});
	
});

