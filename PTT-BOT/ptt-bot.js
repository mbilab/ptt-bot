/** node modulus **/
var net = require('net');
var iconv = require('iconv-lite'); 
var S = require('string');
var fs = require('fs');
var screen = require('./screen');

/** Regular Expression && Pattern **/
const AnsiSetDisplayAttr = /\[(\d+)*;*(\d+)*;*(\d+)*;*(\d+)*[mHK]/g ;
const ArticleListStart = /\s人氣:[0-9]{1,5}\s/ ;
const ArticleListEnd = "[34;46m 文章選讀" ;
const AnsiEraseEOL = /\[K/g ;
const AnsiCursorHome = /\[(\d+)*;*(\d+)*H/g
const ArticleIndexStart = "[1;30;47m 目前顯示: 第";
const ArticleIndexEnd = "行[";
const ArticlePercentStart = " 頁 (";
const ArticlePercentEnd = "%) [1;30;47m";

/** Telnet Keyboard Equivalents **/
const Enter = '\r';
const Left = '\u001b[D';
const Right = '\u001b[C';
const Up = '\u001b[A';
const Down = '\u001b[B';
const PageUp = 'P';
const PageDown = 'N';
const CtrlL = '\u000c';
const CtrlZ = '\u001a';

/** Screens **/
const Main = 0; //【主功能表】
const HotBoard = 1; //【熱門看板列表】
const FavBoard = 2; //【我的最愛看板列表】
const BoardClass = 3; //【分類看板】
const BoardList = 4; //【看板列表】
const ArticleList = 5; //【文章列表】
const Article = 6; //【文章內】

/** Working State **/
const State_ExcutingLogin = 0;
const State_LoadNextPttbotComand = 1;
const State_EnteringBoard = 2;
const State_CollectingArticle = 3;
const State_ReturningToMain = 4;


/** para @ global screen **/
const nullScreen = '\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n';
const nullScreenRow = [' null_row;'].concat(S(nullScreen).lines());
var g_conn ;//connecton to ptt-sever
var g_screenBuf = 'wait...';//mimic screen of terminal
var g_screenBufRow = [];
var g_articleBuf = '';
var g_new_data = '';
var g_workingState = State_ExcutingLogin;
var g_commandsObj = {
	PttCommands: [],
	callbacks: []
}
var g_cursor = {
	row: 1,
	col: 1
}

/*****
	public function
*****/
function login(id, ps, callback){

	g_conn = net.createConnection(23, 'ptt.cc');
	
	g_conn.setTimeout(1000);
	
	g_commandsObj.callbacks.push((callback ? callback : function(){}));	
	
	//Listeners
	g_conn.addListener('connect', function(){
	
		console.log('[1;31mconnected to ptt-sever[m');

	});
	
	g_conn.addListener('end',function(){
	
		console.log("[1;31mDisconnected...![m");
	
	});
	
	g_conn.addListener('data', function(data){

		g_new_data += iconv.decode(data,'big5');

	});
	
	g_conn.addListener('timeout', function(){
		
		var newdataStr = g_new_data;

		switch( g_workingState ){		
			case State_ExcutingLogin:
				loginDataHandler(newdataStr, id, ps);
				break;
				
			case State_LoadNextPttbotComand:
				g_screenBuf = screen.parseNewdata(g_cursor,newdataStr);
				executeCallback();
				g_screenBuf = '';//clear old data
				loadNextCommand();
				break;
				
			case State_EnteringBoard:
				enteringBoardDataHandler(newdataStr);
				break;
			
			case State_CollectingArticle:
				g_screenBuf = screen.parseNewdata(g_cursor,newdataStr);	
				collectArticle(); 
				moveToNextPage();
				break;
				
			case State_ReturningToMain:
				//go back to main screen
				g_screenBuf = screen.parseNewdata(g_cursor,newdataStr);
				console.log('hihi State_ReturningToMain');
				g_screenBuf = '';//clear old data
				ReturningMainDataHandler(newdataStr);
				break;
				
			default :
				console.log('working state is undifined.');
		
		}
		
		
		g_new_data = '' ;		
		
	});
	
	return g_conn;
}


function returnMain( callback ){
	
	//比照toBoard的想法 新增狀態 returning to Main 隨著狀態(screen當下位置)的不同而下不同的指令回主選單
	//ctrlz 可以快去切換去某些地方 但在某些地方(文章內) 並不適用
	
	addCallbackWithNullCommand(function(){ //在傳送指令前, 先將ptt-bot的狀態改變
		g_workingState = State_ReturningToMain;
		g_screenBufRow = [' null_row;'].concat(S(nullScreen).lines());//clean old data, since g_screenBufRow is not used until nextPttComand. 
	});
	addCommands(CtrlL,function(){
		console.log(g_screenBuf);
	});//重傳內容, 讓bot根據不同的內容作不同的回應
	
}

function toBoard( BoardName,callback ){

	var command = 's' + BoardName + '\r';
	addCallbackWithNullCommand(function(){ //在傳送指令前, 先將ptt-bot的狀態改變
		g_workingState = State_EnteringBoard;
		g_screenBufRow = [' null_row;'].concat(S(nullScreen).lines());//clean old data, since g_screenBufRow is not used until nextPttComand. 
	});
	addCommands(command,callback);
	
}

function toArticle(NumStr,callback){

	var command = NumStr+'\r\r';
	addCommands(command,callback);

}

function fetchArticle(callback){
	
	addCallbackWithNullCommand(function(){ 
		g_workingState = State_CollectingArticle;
		g_screenBufRow = [' null_row;'].concat(S(nullScreen).lines());//clean old data, since g_screenBufRow is not used until nextPttComand. 
	});
	addCommands(CtrlL,callback);
	
}

function getScreen(){

	return g_screenBuf;

}

function getArticle(){

	return g_articleBuf;

}

function escapeANSI(str){

	return	str.replace(AnsiSetDisplayAttr,"");

}

function pressAnyKey(callback){

	addCommands(Enter,callback);

}

function sendCtrlL(callback){

	addCommands(CtrlL,callback);	

}

function sendPageUp(callback){

	addCommands(PageUp,callback);	

}

function sendPageDown(callback){

	addCommands(pageDown,callback);	

}

function sendLeft(callback){

	addCommands(Left,callback);
	
}

function sendRight(callback){

	addCommands(Right,callback);

}

function MaintoFavBoard(callback){

	/**FIXME**/
	var command = 'f\r';
	addCommands(command,callback);

}

function MaintoHotBoard(){

	/**FIXME**/
	sendCommand( 'c' );
	sendCommand( '\r' );
	sendCommand( 'p' );
	sendCommand( '\r' );	

}

function fetchBoardHeader(){

	var output = S(g_screenBuf).between('[33m', '[0;1;37;44m').s; 		
	return output;

}

function fetchArticleList(){

	var output = S(g_screenBuf).between(ArticleListStart.exec(g_screenBuf)[0],ArticleListEnd).s ;	
	return output;

}

function fetchArticleList_inArr(){

	var outputArr = S( S(g_screenBuf).between(ArticleListStart.exec(g_screenBuf)[0],ArticleListEnd).s ).lines();
	outputArr.shift();
	outputArr.pop();
	return outputArr;

}



/*
	export public function
*/
exports.login = login;
exports.getScreen = getScreen;
exports.getArticle = getArticle;
exports.pressAnyKey = pressAnyKey;
exports.escapeANSI = escapeANSI;
exports.returnMain = returnMain;
exports.toBoard = toBoard;
exports.toArticle = toArticle;
exports.toArticlesList = toBoard;
exports.sendCtrlL = sendCtrlL;
exports.sendPageUp = sendPageUp;
exports.sendPageDown = sendPageDown;
exports.sendLeft = sendLeft;
exports.sendRight = sendRight;
exports.MaintoFavBoard = MaintoFavBoard;
exports.MaintoHotBoard = MaintoHotBoard;
exports.fetchBoardHeader = fetchBoardHeader;
exports.fetchArticleList = fetchArticleList;
exports.fetchArticleList_inArr = fetchArticleList_inArr;
exports.fetchArticle = fetchArticle;

/*****
	private function
*****/

function executeCallback(){

	g_commandsObj.callbacks.shift()();

}

function sendCommand(command){
	g_conn.write(command);
}

function loadNextCommand(){

	if(g_commandsObj.PttCommands.length != 0){		
		var PttCommand = g_commandsObj.PttCommands.shift();
		sendCommand(PttCommand+CtrlL);	//FixMe
	}
	
	else {
		g_conn.removeAllListeners('timeout');
		g_conn.end();
	}	
	
}

function moveToNextPage(){

	if(g_workingState==State_CollectingArticle) {
		sendCommand(Right+CtrlL);
	}
	
	else{
		executeCallback();
		sendCommand(Left);	//goes back to 【文章列表】
		loadNextCommand();
		g_articleBuf= '';
	}

}

function collectArticle(){

	var row = S(g_screenBuf).between(ArticleIndexStart,ArticleIndexEnd).replaceAll(' ', '"').replaceAll('~', '","').s; 
	var rowStart = parseInt(S(row).parseCSV()[0]==1 ? 0 : S(row).parseCSV()[0]);
	var rowEnd = parseInt(S(row).parseCSV()[1]);	
	var articleRow = S(g_articleBuf).lines();
	var newArticleRow = S(g_screenBuf).lines().slice(1);
	
	for(var _=rowStart;_<=rowEnd;_++){
		articleRow[_] = newArticleRow[_-rowStart];
	}
	
	g_articleBuf = '';
	
	for(var _ = -1, n = articleRow.length; ++_ < n ;){
		g_articleBuf += articleRow[_] + '\r\n';
	}
	
	if(S(g_screenBuf).between(ArticlePercentStart,ArticlePercentEnd).s == '100'){
		g_workingState = State_LoadNextPttbotComand;
	}
	
}

function addCommands(command,callback){
	
	g_commandsObj.PttCommands.push(command);
	g_commandsObj.callbacks.push((callback ? callback : function(){}));	
	
}

/* 	
	Add callback function for null command, mostly used for 
	state transfer internally before execute user's callback 
	function.
	
*/
function addCallbackWithNullCommand(callback){
	
	g_commandsObj.PttCommands.push(CtrlL);//CtrlL is useless in here. Not for ask for reload screen data.
	g_commandsObj.callbacks.push((callback ? callback : function(){}));	

}

function decode_asBig5(data){

	return iconv.decode( data ,'big5');

}

function getAnsiInfo(){
    /**	
		when user need ansi information. generate it.
		return both big5Arr and AnsiArr.
	**/
}

function loginDataHandler(newdataStr, id, ps){

	if (newdataStr.indexOf("140.112.172.11") != -1 && newdataStr.indexOf("批踢踢實業坊") != -1) {
	}
	
	if (newdataStr.indexOf("您想刪除其他重複登入的連線嗎") != -1){
		sendCommand( 'y\r' );	
		console.log( '已刪除其他重複登入的連線' );
	}
	
	if (newdataStr.indexOf("登入中") != -1){
		console.log("[1;33m登入中...[m");
	}
	
	if (newdataStr.indexOf("請輸入代號，或以 guest 參觀，或以 new 註冊:") != -1){
		console.log("[1;33m請輸入代號，或以 guest 參觀，或以 new 註冊:[m");
		sendCommand( id+'\r' );
		console.log("[32m(已輸入帳號)[m");
	}
	
	if (newdataStr.indexOf("請輸入您的密碼") != -1){
		console.log("[1;33m請輸入您的密碼:[m");
		sendCommand( ps+'\r' );
		console.log("[32m(已輸入密碼)[m");
	}		
	
	if (newdataStr.indexOf("歡迎您再度拜訪") != -1){
		console.log("[1;33m歡迎您再度拜訪![m");
		sendCommand( '\r' );
		console.log("[32m(已按任意鍵繼續)[m");
	}
	
	if (newdataStr.indexOf("按任意鍵繼續") != -1 && newdataStr.indexOf("請勿頻繁登入以免造成系統過度負荷") != -1){
		sendCommand( '\r' );
		console.log("[32m(請勿頻繁登入以免造成系統過度負荷)[m");
	}
	
	if (newdataStr.indexOf("離開，再見…") != -1){
	
		console.log( 'Robot commands for main screen should be executed here.↓ ↓ ↓\n[1;32m您現在位於【主功能表】[m' ); 
		g_workingState = State_LoadNextPttbotComand;
	
		g_screenBufRow = screen.parseNewdata(g_cursor,newdataStr);

		sendCommand( CtrlL );

	}	

}

function ReturningMainDataHandler(newdataStr){
	
	//根據不同的地點執行不同的指令到回到相同的MAIN
	switch( where(newdataStr) ){
		
		case ArticleList:
			sendCommand( CtrlZ+'t'+Left );
			break;
		
		case Article:
			sendCommand( Left+CtrlZ+'t'+Left );
			break;
			
		case HotBoard:
			sendCommand( CtrlZ+'t'+Left );
			break;
			
		case FavBoard:
			sendCommand( CtrlZ+'t'+Left );
			break;
			
		case BoardList:
			sendCommand( CtrlZ+'t'+Left );
			break;
		
		case BoardClass:
			sendCommand( CtrlZ+'t'+Left );
			break;
		
		default:
			/* 已回主功能表 */
			g_workingState = State_LoadNextPttbotComand;
			sendCommand( CtrlL );//for emit next command
			console.log('已經回到主頁面囉!!!');
	
	}	
	
}	

/*
	FixME: 有些版有進版動畫, 會進入到頁面
		   but most case is OK!
*/
function enteringBoardDataHandler(newdataStr){
	
	console.log('enteringBoardDataHandler');
	if (newdataStr.indexOf("按任意鍵繼續") != -1){
	
		sendCommand( Enter );
		console.log("[32m已按任意見繼續 進入看板[m");
	
	}
	else{ 
		
		sendCommand( CtrlL );
		g_workingState = State_LoadNextPttbotComand;
		
	}	
}

function where(screenData){

	/**FIXME**/
	var screenStr = iconv.decode(iconv.encode(screenData,'big5'),'big5');
	if (screenStr.indexOf("主功能表") != -1){
		return Main;
	}
	
	else if(screenStr.indexOf("文章選讀") != -1 && screenStr.indexOf("進板畫面") != -1){
		return ArticleList;
	}
	
	else if(screenStr.indexOf("目前顯示") != -1 && screenStr.indexOf("瀏覽 第") != -1){
		return Article;
	}
	
	else if(screenStr.indexOf("只列最愛") != -1){
		return HotBoard;
	}
	
	else if(screenStr.indexOf("看板列") != -1 && screenStr.indexOf("增加看板") != -1){
		return FavBoard;
	}
	
	else if(screenStr.indexOf("加入/移出最愛") != -1){
		return BoardList;
	}
	
	else if(screenStr.indexOf("即時熱門看板") != -1){
		return BoardClass;
	}
	
	else{
		console.log("Error: where can't find where you are.");
		return false;
	}
	
}
