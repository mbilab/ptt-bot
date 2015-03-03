var myBot = require('./PTT-BOT/ptt-bot');
var fs = require('fs');
var iconv = require('iconv-lite'); 
var S = require('string');

//get personal ID & PS from myID.txt
fs.readFile('myID.txt',{encoding:'utf-8'}, function (err, data) {
	
	if (err) throw err;
	id = S(data).between("ID:'","'").s;
	ps = S(data).between("PS:'","'").s;
	
	//create the connection object for robot.
	console.log('long time no see!');
	myBot.login( id, ps, function(){
		console.log('hi, chenchen chang, something about state is fixed');
		//console.log(myBot.getScreen());
		/*
		fs.writeFile('screen_data/cursormove.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
			if (err) throw err;
			console.log('cursormove is saved!');
		});
		*/
	});
	
});


myBot.toBoard('movie',function(){
	//console.log(myBot.getScreen());
	
	fs.writeFile('screen_data/toBoard.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('toBoard is saved!');
	});
	
});

