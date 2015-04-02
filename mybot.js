var myBot = require('./PTT-BOT/ptt-bot');
var fs = require('fs');
var iconv = require('iconv-lite'); 
var S = require('string');

//login
fs.readFile('myID.txt',{encoding:'utf-8'}, function (err, data) {
	
	var articleArr = [];
	
	
	if (err) throw err;
	id = S(data).between("ID:'","'").s;
	ps = S(data).between("PS:'","'").s;
	
	//create the connection object for robot.
	console.log('long time no see!');
	myBot.login( id, ps, function(){
		console.log('hi, chenchen chang, something about state is fixed ya');
		
		console.log(myBot.getScreen());
		/*
		fs.writeFile('screen_data/cursormove.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
			if (err) throw err;
			console.log('cursormove is saved!');
		});
		*/
		console.log('登入完畢，接著進入movie板!');
	});
	
	
	myBot.toBoard('movie',function(){
		
		console.log(myBot.getScreen());
	
		fs.writeFile('screen_data/toBoard.txt', iconv.encode(myBot.getScreen(),'big5'), function (err) {
			if (err) throw err;
			console.log('toBoard is saved!');
		});
		
		console.log('已進入movie板，接著收集文章!');
	});
	
	
	
	for(var i = 0 ; i < 5 ; i++){
	
		myBot.toArticle(i+53625,function(){ //or myBot.sendRight()
			
			//console.log(myBot.getScreen());
		
		});
	
		myBot.fetchArticle(function(){
		
			//console.log(myBot.getArticle());
			//FIXME: i doesnt change
			articleArr[i] = myBot.getArticle();
		
		});
	}
	
	myBot.addCallbackWithNullCommand(function(){
			
		console.log(articleArr);
		
		for(var a=0  ; a < 5 ; a++){
			
			fs.writeFile('C:/Users/user/Google 雲端硬碟/movieBoardData/movieArticle' + a + '.txt', iconv.encode(articleArr[a],'big5'), function (err) {
				if (err) throw err;
				console.log('Article is saved!');
			});
			
		}
			
	});
	
	
});



