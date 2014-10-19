/******************************************

This file is consist of methods handing 
screen issue; that is, reconstruct the 
screen, parse the ANSI-sequence...etc. 

******************************************/

/** node modulus **/
var S = require('string');
var fs = require('fs');//test
var iconv = require('iconv-lite');//test

/** Regular Expression && Pattern **/
const AnsiCursorHome = /\[(\d+)*;*(\d+)*H/g;
const nullScreen = '\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n';

/* test function */
/*
(function(){
	fs.readFile('../screen_data/screen.txt', function (err, data) {
		if (err) throw err;
		console.log(iconv.decode(iconv.encode(data,'big5'),'big5'));
		console.log(iconv.decode(data,'big5'));
		const orginScreen = '1234\r\n23\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n';
		const orginScreenRow = [' null_row;'].concat(S(orginScreen).lines());
		var a =	parseNewdata(  {
								row: 0,
								col: 0
								},
								iconv.decode(data,'big5')
							);
		fs.writeFile('../screen_data/result.txt', iconv.encode(a,'big5'), function (err) {
			if (err) throw err;
			console.log('It\'s saved!');
		});
	});
})();
*/

function parseNewdata(g_cursor,newdataStr){
	
	//ScreenRow應該是清空的狀態阿!
	var ScreenRow = [' null_row;'].concat(S(nullScreen).lines());
	
	//insert all new sequence into prior screen by simulate the terminal.
	var len = newdataStr.length;
	var ch = '';
	var Ansi ={
		state : false, //default non-ANSI state.
	    str : 'no-ansi' //default non-ANSI character.	
	}
	
	for(var _ = -1, n = len ; ++_ < n ;){
			ch = newdataStr.slice(0, 1);
			newdataStr = newdataStr.slice(1);	
		
			if(Ansi.state){//in ANSI state
			
				Ansi.str += ch;
			
				switch( Ansi.str.slice(-1) ){
				
					case 'm':
						ScreenRow[g_cursor.row] = addAnsiAttrSeq(ScreenRow[g_cursor.row],g_cursor.col,Ansi.str);
						Ansi.state = false;
						Ansi.str = 'no-ansi';
						break;
					
					case 'K':
						ScreenRow[g_cursor.row] = addAnsiEOLSeq(ScreenRow[g_cursor.row],g_cursor.col,Ansi.str);
						Ansi.state = false;
						Ansi.str = 'no-ansi';
						break;
					
					case 'H':
						/**
							MOVE THE CURSOR TO RIGHT PLACE
						**/
						if (S(Ansi.str).between('[',';').s){
							g_cursor = {
								row: parseInt(S(Ansi.str).between('[',';').s),
								col: parseInt(S(Ansi.str).between(';','H').s)
							}
						}else{
							g_cursor = {
								row: 1,
								col: 1
							}
						}
						Ansi.state = false;
						Ansi.str = 'no-ansi';
						break;
						
					case 'J':
						/**
							CLEAR SCREEN 
						**/
						if(S(Ansi.str).contains('[2J')){
							ScreenRow = [' null_row;'].concat(S(nullScreen).lines()); //Clear entire screen
						}else{
							console.log('got undefined ANSI-pattern for J');
						}
						Ansi.state = false;
						Ansi.str = 'no-ansi';
						break;
						
					default: 
						//do nothing
						if(Ansi.str.length>25) console.log('got undefined ANSI-pattern');//alert if no ANSI-pattern matches.
				}				
			}
			
			else{//in non-ANSI state
				switch(ch){
					case '':
						Ansi.str = ch;
						Ansi.state = true;
						break;
				
					case '\r': //carriage return: return to the col 1
						g_cursor.col = 1;
						break;
						
					case '\n': //line feed: move to next row
						g_cursor.row += 1;
						//oldStr = ScreenRow[g_cursor.row];
						break;
					
					/** FIXME: star should be consider as 2 char!?.
					case '★':
						ScreenRow[g_cursor.row] = replaceCharAt(ScreenRow[g_cursor.row],g_cursor.col,ch);
						g_cursor.col += 2;
						break;
					**/
					
					default: //normal character
						ScreenRow[g_cursor.row] = replaceCharAt(ScreenRow[g_cursor.row],g_cursor.col,ch);
						g_cursor.col += 1;
				
				}
			}
	}
	
	var fullScreen = '';
	
	for(var _=0;_<ScreenRow.length;_++){
		fullScreen += ScreenRow[_] + '\r\n';
	}
	
	return fullScreen;

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
function getMaxVal(arr){

	var max = 0;
	
	for(var _ = -1 , n = arr.length ; ++_ < n;){
		if(max<arr[_]){
			max=arr[_];
		}
	}

	return max;
	
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

exports.parseNewdata = parseNewdata;