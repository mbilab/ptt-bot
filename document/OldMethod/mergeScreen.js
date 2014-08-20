/** handle the leaking problem of received data **/

var fs = require('fs');
var S = require('string');
var iconv = require('iconv-lite'); 

/** Regular Expression &&Pattern **/
var AnsiCursorHome = /\[(\d+)*;*(\d+)*H/g
var AnsiSetDisplayAttr = /\[(\d+)*;*(\d+)*;*(\d+)*;*(\d+)*[mK]/g ;

function mergeScreen(priorScreen,Screen){
	fs.writeFile('priorScreen.txt',iconv.encode(priorScreen,'big5'), function (err) {
	if (err) throw err;
		//console.log('priorScreen is saved!');
	});			
	fs.writeFile('Screen.txt',iconv.encode(Screen, 'big5'), function (err) {
	if (err) throw err;
		//console.log('Screen is saved!');
	});
	
	//for priorScreen
	var priorScreenLines = S(priorScreen).lines();
	var wordIndexLines = Array(priorScreenLines.length);
	for (var _=0;_<priorScreenLines.length;_++){
		priorScreenLines[_] = priorScreenLines[_].replace(/\[K/g,"");
		wordIndexLines[_] = generateWordIndex(priorScreenLines[_]);
	}
	
	//for screen
	var newSequence = [];
	var preIndex= 0;
	var newString = '';
	var cursorControl = '';
	var strLength_withANSI = 0;
	while ((match = AnsiCursorHome.exec(Screen)) !== null){
		strLength_withANSI = AnsiCursorHome.lastIndex - preIndex - match[0].length;
		newString = S(Screen).left(AnsiCursorHome.lastIndex-match[0].length).right(strLength_withANSI).s;
		newSequence.push({
			'cursorControl' : cursorControl, //using The parenthesized substring matches, if any. The number of possible parenthesized substrings is unlimited.
			'newString' : newString			
 		});
		preIndex = AnsiCursorHome.lastIndex;
		cursorControl = match[0];
	}

	newSequence.shift();
	//console.log(newSequence);
	var tests = ''; // for testing
	for(var i =0;i<newSequence.length;i++){ 
		//console.log(newSequence[i]);
		var String = newSequence[i]['newString'];
		var ch = '';
		var Ansi_state = false; //default non-ANSI state.	
		var Ansi_str = 'no-ansi'; //default non-ANSI character.	
		var row = (newSequence[i]['cursorControl'].split(/[\[;H]/g)[2] ? newSequence[i]['cursorControl'].split(/[\[;H]/g)[2]-1 : 0);
		var col = (newSequence[i]['cursorControl'].split(/[\[;H]/g)[3] ? parseInt(newSequence[i]['cursorControl'].split(/[\[;H]/g)[3]) : 1);
		//if(col>30) col--;//for debug
		var big5Index = col;
		//console.log('in line '+row);
		for(var _=0;_<newSequence[i]['newString'].length;_++){
			ch = String.slice(0, 1);
			String = String.slice(1);
			//console.log(ch);
			switch(Ansi_state) {	
				case false: //in non-ANSI state
					if(ch==''){					
						Ansi_str = ch;
						Ansi_state = true;
					}	
					else{	
						//console.log('got non-ansi char');
						priorScreenLines[row] = setCharAt(priorScreenLines[row],wordIndexLines[row].indexOf(big5Index),ch);
						//console.log(priorScreenLines[row]);
						big5Index++;
						//console.log('in state big5');
						//console.log(priorScreenLines[row]);						
					}
					break;
				case true: //in ANSI state
					Ansi_str += ch;
					if(Ansi_str.slice(-1)=='m'){
						//console.log('got m');
						var _priorScreenLines = priorScreenLines[row];
						priorScreenLines[row] = _priorScreenLines.substr(0,wordIndexLines[row].indexOf(big5Index+1)-1)+ Ansi_str + _priorScreenLines.substr(wordIndexLines[row].indexOf(big5Index));
						wordIndexLines[row] = generateWordIndex(priorScreenLines[row]) ;
						Ansi_state = false;
						Ansi_str = 'no-ansi';
					}
					if(Ansi_str.slice(-1)=='K'){ 
						var _priorScreenLines = priorScreenLines[row];
						priorScreenLines[row] = _priorScreenLines.substr(0,wordIndexLines[row].indexOf(big5Index+1)-1)+ Ansi_str;		
						wordIndexLines[row] = generateWordIndex(priorScreenLines[row]) ;
						Ansi_state = false;
						Ansi_str = 'no-ansi';
					}
			}	
		}
		tests += priorScreenLines[3]+ '\n';		
	}
	fs.writeFile('data.txt',iconv.encode(tests, 'big5'), function (err) {
	if (err) throw err;
		//console.log('data.txt is saved!');
	});
	var outScreen = '';
	for(var t=0;t<priorScreenLines.length;t++){
		outScreen += priorScreenLines[t] + '\n';
	}
	//console.log(outScreen);
	fs.writeFile('outScreen.txt',iconv.encode(outScreen, 'big5'), function (err) {
	if (err) throw err;
		//console.log('outScreen is saved!');
	});
	//console.log(priorScreenLines[3]);
	//console.log(priorScreenLines[4]);
	//console.log(priorScreenLines[5]);
	//console.log(priorScreenLines[6]);
	//console.log(priorScreenLines[7]);
	//console.log(priorScreenLines[8]);
	//console.log(priorScreenLines[9]);
	//console.log(priorScreenLines[10]);
}
function generateWordIndex(wordSequence){
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
/*set char at certain Index*/
function setCharAt(str,index,chr) {
	if(index > str.length-1) return str;
	if(index == -1)	return str + chr;
    return str.substr(0,index) + chr + str.substr(index+1);
}
exports.mergeScreen = mergeScreen;