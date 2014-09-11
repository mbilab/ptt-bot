/** node modulus **/
var net = require('net');
var iconv = require('iconv-lite'); 
var S = require('string');
var fs = require('fs');

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
const PageUp = 'P';
const PageDown = 'N';
const CtrlL = '\u000c';

/** Screens **/
const Main = 0; //【主功能表】
const HotBoard = 1; //【熱門看板列表】
const FavBoard = 2; //【我的最愛看板列表】
const BoardClass = 3; //【分類看板】
const BoardList = 4; //【看板列表】
const ArticleList = 5; //【文章列表】
const Article = 6; //【文章內】

/** Working State **/
const LoadNextPttbotComand = 0;
const ExcutingLogin = 1;
const CollectingArticle = 2;

/** para @ global screen **/
const nullScreen = '\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n';
var g_conn ;//connecton to ptt-sever
var g_screenBuf = 'wait...';//mimic screen of terminal
var g_screenBufRow = [];
var g_articleBuf = '';
var g_workingState = ExcutingLogin;
var g_commandsObj = {
	PttCommands: [],
	callbacks: []
}

/*****
	public function
*****/
function login(id, ps, callback){
	g_conn = net.createConnection(23, 'ptt.cc');
	g_commandsObj.callbacks.push((callback ? callback : function(){}));	
	//Listeners
	g_conn.addListener('connect', function(){
		console.log('[1;31mconnect to ptt-sever[m');
	});
	g_conn.addListener('end',function(){
		console.log("[1;31mDisconnected...![m");
	});
	g_conn.addListener('data', function(data){
		var newdataStr = iconv.decode(data,'big5');
		switch(g_workingState){
			case ExcutingLogin :
				loginDataHandler(newdataStr, id, ps);
				break;
			case LoadNextPttbotComand :
				//parse new data and mimic terminal screen. 
				var nullScreenRow = [' null_row;'].concat(S(nullScreen).lines());
				g_screenBufRow = (g_screenBuf!='wait...' ? parseNewdata(g_screenBufRow,newdataStr) : parseNewdata(nullScreenRow,newdataStr));
				g_screenBuf = '';
				for(var _=0;_<g_screenBufRow.length;_++){
					g_screenBuf += g_screenBufRow[_] + '\r\n';
				}
				executeCallback();
				sendCommand();
				break;
			case CollectingArticle :
				var nullScreenRow = [' null_row;'].concat(S(nullScreen).lines());
				g_screenBufRow = parseNewdata(nullScreenRow,newdataStr);
				g_screenBuf = '';
				for(var _=0;_<g_screenBufRow.length;_++){
					g_screenBuf += g_screenBufRow[_] + '\r\n';
				}
				collectArticle(); 
				moveToNextPage();
				break;
			default :
				//do nothing
		}
		//processBeforeMain(newdataStr, id, ps);
		/*
		if(g_afterMain){
			if(!g_inArticle){
				//parse new data and mimic terminal screen. 
				var nullScreenRow = [' null_row;'].concat(S(nullScreen).lines());
				g_screenBufRow = (g_screenBuf!='wait...' ? parseNewdata(g_screenBufRow,newdataStr) : parseNewdata(nullScreenRow,newdataStr));
				g_screenBuf = '';
				for(var _=0;_<g_screenBufRow.length;_++){
					g_screenBuf += g_screenBufRow[_] + '\r\n';
				}
				executeCallback();
				sendCommand();
			}
			else{
				var nullScreenRow = [' null_row;'].concat(S(nullScreen).lines());
				g_screenBufRow = parseNewdata(nullScreenRow,newdataStr);
				g_screenBuf = '';
				for(var _=0;_<g_screenBufRow.length;_++){
					g_screenBuf += g_screenBufRow[_] + '\r\n';
				}
				collectArticle(); 
				moveToNextPage();
			}
		}*/
	});
	return g_conn;
}
function reformScreen(){
}
function toArticle(NumStr,callback){
	var command = NumStr+'\r\r';
	addCommands(command,callback);
}
function fetchArticle(callback){
	var command = CtrlL;
	addCommands(command,function(){
		g_inArticle = true;
	});
	addCommands(command,callback);
}
function getScreen(){
	return g_screenBuf;
}
function getArticle(){
	return g_articleBuf;
}
function where(){
	/**FIXME**/
	var screenStr = iconv.decode(iconv.encode(g_screenBuf,'big5'),'big5');
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
function escapeANSI(str){
	return	str.replace(AnsiSetDisplayAttr,"");
}
function pressAnyKey(callback){
	addCommands(Enter,callback);
}
function toBoard( BoardName,callback ){
	var command = 's' + BoardName + '\r';
	addCommands(command,callback);
}
function sendCtrlL(callback){
	addCommands(CtrlL,callback);	
}
function sendPageUp(callback){
	addCommands(PageUp,callback);	
}
function sendPageDown(){
	addCommands(pageDown,callback);	
}
function sendLeft(){
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
	g_conn.write( 'c' );
	g_conn.write( '\r' );
	g_conn.write( 'p' );
	g_conn.write( '\r' );	
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
exports.where = where;
exports.escapeANSI = escapeANSI;
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
function sendCommand(){
	if(g_commandsObj.PttCommands.length != 0){	
		var PttCommand = g_commandsObj.PttCommands.shift();
		g_conn.write(PttCommand);	
	}
	else {
		g_conn.removeAllListeners('data');
		g_conn.end();
	}	
}
function moveToNextPage(){
	if(g_inArticle) {
		g_conn.write(Right+CtrlL);
	}
	else{
		executeCallback();
		g_conn.write(Left);	//goes back to 【文章列表】
		sendCommand();
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
	for(var _=0;_<articleRow.length;_++){
		g_articleBuf += articleRow[_] + '\r\n';
	}
	if(S(g_screenBuf).between(ArticlePercentStart,ArticlePercentEnd).s == '100'){
		g_inArticle = false;
	}
}
function addCommands(command,callback){
	g_commandsObj.PttCommands.push(command);
	g_commandsObj.callbacks.push((callback ? callback : function(){}));	
}
function addAnsiAttrSeq(str,col,seq){
	/*
		only used in ANSI DisplayAttr sequence;
	*/
	var WordMap = generateWordMap(str);
	var wordLength = getMaxVal(WordMap);
	var colIndex = WordMap.indexOf(col);	
	var padLength = str.length+(col-wordLength)-1;
	if(colIndex==-1) return S(str).padRight(padLength).s+seq;
	return str.substr(0,colIndex) + seq + str.substr(colIndex);
}
function addAnsiEOLSeq(str,col,seq){
	/*
		only used in ANSI EraseEOL sequence;
	*/
	var WordMap = generateWordMap(str);
	var wordLength = getMaxVal(WordMap);
	var colIndex = WordMap.indexOf(col);	
	var padLength = str.length+(col-wordLength)-1;
	if(colIndex==-1) return S(str).padRight(padLength).s+seq; 
	return str.substr(0,colIndex) + seq;
}
function decode_asBig5(data){
	return iconv.decode( data ,'big5');
}
function detectOldAnsi(str, wordCursor){
	/**
		detect OldANSI.
	**/	
	var Ansi = {
		exist : false,
		length : 0
	}
	var wordMap = generateWordMap(str);
	var WordIndex = wordMap.indexOf(wordCursor);
	var preWordIndex = (wordCursor==1 ? -1 : wordMap.indexOf(wordCursor-1));
	if(WordIndex-preWordIndex!=1 && WordIndex!=-1){
		Ansi.exist = true;
		Ansi.length = WordIndex-preWordIndex-1;
	}
	return Ansi;
}
function eraseOldAnsi(OldAnsi, str, wordCursor){
	/**
		OldAnsi include AnsiDisplayAttr and AnsiCursorHome.
	**/
	var wordMap = generateWordMap(str);
	var preWordIndex = (wordCursor==1 ? 0 : wordMap.indexOf(wordCursor-1));
	return str.substr(0,preWordIndex+1)+str.substr(preWordIndex+OldAnsi.length+1);
}
function generateWordMap(wordSequence){
	var wordIndex = Array(wordSequence.length); 
	var AnsiSet = /\[(\d+)*;*(\d+)*;*(\d+)*;*(\d+)*[mKH]/g;
	while ((AnsiMatch = AnsiSet.exec(wordSequence)) !== null){	
		var startIndex = AnsiMatch.index;
		var lastIndex = AnsiSet.lastIndex-1;
		for(var i=startIndex;i<=lastIndex;i++){
			wordIndex[i]=0;
		}
	}
	var wordCount = 1;
	for(var _=0;_<wordIndex.length;_++){
		if(wordIndex[_]!=0){
			wordIndex[_]=wordCount;
			wordCount++;
		}
	}
	return wordIndex;
}
function getMaxVal(arr){
	var max = 0;
	for(var _=0;_<arr.length;++_){
		if(max<arr[_]){
			max=arr[_];
		}
	}
	return max;
}
function getNearestAnsi(str, wordCursor){
	/**
		search nearest front ansi code for #big5 character.
		note: if no ansi matches then set esc[m
	**/
	var WordMap = generateWordMap(str);
	var backIndex = WordMap.indexOf(wordCursor);
	var ansi = "" 
	//if(wordCursor>getMaxVal(WordMap)) console.log('Error: can not find proper char in getNearestAnsi()');
	for(var _=backIndex;_>=0;_--){
		if(str[_]==''){
			var foreIndex = _;
			for (var _2=foreIndex;_2<backIndex;_2++){
				ansi += str[_2];
				if(str[_2]=='m') break;
			}
			break;
		}
		if(_==0){
			ansi = '[m';
		}
	}
	return ansi;
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
		g_conn.write( 'y\r' );	
		console.log( '已刪除其他重複登入的連線' );
	}
	if (newdataStr.indexOf("登入中") != -1){
		console.log("[1;33m登入中...[m");
	}
	if (newdataStr.indexOf("請輸入代號，或以 guest 參觀，或以 new 註冊:") != -1){
		console.log("[1;33m請輸入代號，或以 guest 參觀，或以 new 註冊:[m");
		g_conn.write( id+'\r' );
		console.log("[32m(已輸入帳號)[m");
	}
	if (newdataStr.indexOf("請輸入您的密碼") != -1){
		console.log("[1;33m請輸入您的密碼:[m");
		g_conn.write( ps+'\r' );
		console.log("[32m(已輸入密碼)[m");
	}		
	if (newdataStr.indexOf("歡迎您再度拜訪") != -1){
		console.log("[1;33m歡迎您再度拜訪![m");
		g_conn.write( '\r' );
		console.log("[32m(已按任意鍵繼續)[m");
	}
	if (newdataStr.indexOf("按任意鍵繼續") != -1 && newdataStr.indexOf("請勿頻繁登入以免造成系統過度負荷") != -1){
		g_conn.write( '\r' );
		console.log("[32m(請勿頻繁登入以免造成系統過度負荷)[m");
	}
	if (newdataStr.indexOf("主功能表") != -1){
		console.log( 'Robot commands for main screen should be executed here.↓ ↓ ↓\n[1;32m您現在位於【主功能表】[m' ); 
		g_workingState = LoadNextPttbotComand;
	}	
}

function parseNewdata(ScreenRow,newdataStr){
	//spilt all new data into sequence. 
	var cursor = {row: 1, col: 1}; //origin cursor
	var newSequence = [];
	var preIndex= 0;
	var newString = '';
	var prematch = {};
	var strLength_withANSI = 0;
	newdataStr += '[H_END'; 
	while ((match = AnsiCursorHome.exec(newdataStr)) !== null){
		strLength_withANSI = AnsiCursorHome.lastIndex - preIndex - match[0].length;
		newString = S(newdataStr).left(AnsiCursorHome.lastIndex-match[0].length).right(strLength_withANSI).s;
		newSequence.push({
			'cursorControl' : prematch[0],
			'row' : (prematch[1] ? parseInt(prematch[1]) : 1),
			'col' : (prematch[2] ? parseInt(prematch[2]) : 1),
			'newString' : newString	
 		});
		preIndex = AnsiCursorHome.lastIndex;
		prematch = match;
	}
	newSequence.shift();
	//insert all new sequence into prior screen by simulate the terminal.
	for(var _=0;_<newSequence.length;_++){
		var newSeq = newSequence[_]['newString'];
		var len = newSeq.length;
		var ch = '';
		var Ansi ={
			state : false, //default non-ANSI state.
			  str : 'no-ansi' //default non-ANSI character.	
		}
		//move the cursor to current position
		cursor.row = newSequence[_].row ;
		cursor.col = newSequence[_].col ;
		//start moving the cursor
		var oldStr = ScreenRow[cursor.row];
		for(var _2=0;_2<len;_2++){
			ch = newSeq.slice(0, 1);
			newSeq = newSeq.slice(1);	
			if(Ansi.state){//in ANSI state
				Ansi.str += ch;
				if(Ansi.str.slice(-1)=='m'){
					ScreenRow[cursor.row] = addAnsiAttrSeq(ScreenRow[cursor.row],cursor.col,Ansi.str);
					Ansi.state = false;
					Ansi.str = 'no-ansi';
				}
				if(Ansi.str.slice(-1)=='K'){
					ScreenRow[cursor.row] = addAnsiEOLSeq(ScreenRow[cursor.row],cursor.col,Ansi.str);
					Ansi.state = false;
					Ansi.str = 'no-ansi';
				}
			}
			else{//in non-ANSI state
				switch(ch){
					case '':
						Ansi.str = ch;
						Ansi.state = true;
						break;
					case '\r': //carriage return: return to the col 1
						cursor.col = 1;
						break;
					case '\n': //line feed: move to next row
						cursor.row += 1;
						oldStr = ScreenRow[cursor.row];
						break;
					/** FIXME: star should be consider as 2 char!?.
					case '★':
						ScreenRow[cursor.row] = replaceCharAt(ScreenRow[cursor.row],cursor.col,ch);
						cursor.col += 2;
						break;
					**/
					default:
					    /*eraseOldAnsi*/
						var OldAnsi = detectOldAnsi(oldStr, cursor.col);
						if(OldAnsi.exist) ScreenRow[cursor.row] = eraseOldAnsi(OldAnsi, ScreenRow[cursor.row], cursor.col);
						/*eraseOldAnsi*/
						ScreenRow[cursor.row] = replaceCharAt(ScreenRow[cursor.row],cursor.col,ch);
						cursor.col += 1;
				}
			}
			if(_2==len-1){//if last character, copy old ansi for next word
				if(generateWordMap(oldStr).indexOf(cursor.col)!=-1) ScreenRow[cursor.row] = addAnsiAttrSeq(ScreenRow[cursor.row], cursor.col, getNearestAnsi(oldStr, cursor.col));
			}
		}
	}
	return ScreenRow;
}
function replaceCharAt(str,col,chr) {
	/*
		only used in non-ansi char;
		col start from 1, index start from 0 instead;
		index has to escape all the ansi sequence.
	*/
	var WordMap = generateWordMap(str);
	var wordLength = getMaxVal(WordMap);
	var colIndex = WordMap.indexOf(col);	
	var padLength = str.length+(col-wordLength)-1;
	if(colIndex==-1) return S(str).padRight(padLength).s+chr;
    return str.substr(0,colIndex) + chr + str.substr(colIndex+1);
}