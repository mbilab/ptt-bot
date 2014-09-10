var myBot = require('./ptt-bot');
var fs = require('fs');
var iconv = require('iconv-lite'); 

//create the connection object for robot.
myBot.login('chengrobot','ps2014',function(){
	console.log('hi, chenchen chang');
	console.log(myBot.getScreen());
	fs.writeFile('screen1.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('It\'s saved!');
	});
});
myBot.toBoard( 'movie',function(){
	console.log(myBot.getScreen());
	fs.writeFile('screen2.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
		if (err) throw err;
		console.log('It\'s saved!');
	});
});


/**
myBot.toBoard('movie',function(){
	console.log("執行toBoard的callback");
});
myBot.pressAnyKey(function(){
	console.log(myBot.getScreen());
	console.log("執行pressAnyKey的callback");
});
myBot.sendPageUp(function(){
	console.log(myBot.getScreen());
	console.log("執行sendPageUp的callback");
});

myBot.toArticle('30009',function(){
	console.log("執行toArticle的callback");
});
myBot.fetchArticle(function(){
	console.log(myBot.getArticle());
	console.log("執行fetchArticle的callback");
});

myBot.toArticle('30001',function(){
	console.log("執行toArticle的callback");
});
myBot.fetchArticle(function(){
	console.log(myBot.getArticle());
	console.log("執行fetchArticle的callback");
});
**/