var myBot = require('./ptt-bot');

//create the connection object for robot.
myBot.login('chengrobot','ps2014',function(){
	console.log('hi chenchenbox');
});
/**fetchArticleList**/
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
/**fetchArticleContent**/
myBot.toArticle('30009',function(){
	console.log("執行toArticle的callback");
});
myBot.fetchArticle(function(){
	console.log(myBot.getArticle());
	console.log("執行fetchArticle的callback");
});
/**fetchArticleContent**/
myBot.toArticle('30001',function(){
	console.log("執行toArticle的callback");
});
myBot.fetchArticle(function(){
	console.log(myBot.getArticle());
	console.log("執行fetchArticle的callback");
});
