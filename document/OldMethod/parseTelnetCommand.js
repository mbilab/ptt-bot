// Handle Telnet Connections according to RFC 854
//
// Telnet commands
const SE = new Buffer('\xf0','binary');
const NOP = new Buffer('\xf1','binary');
const DATA_MARK = new Buffer('\xf2','binary');
const BREAK = new Buffer('\xf3','binary');
const INTERRUPT_PROCESS = new Buffer('\xf4','binary');
const ABORT_OUTPUT = new Buffer('\xf5','binary');
const ARE_YOU_THERE = new Buffer('\xf6','binary');
const ERASE_CHARACTER = new Buffer('\xf7','binary');
const ERASE_LINE = new Buffer('\xf8','binary');
const GO_AHEAD = new Buffer('\xf9','binary');
const SB = new Buffer('\xfa','binary');

// Option commands
const WILL = new Buffer('\xfb','binary');
const WONT = new Buffer('\xfc','binary');
const DO = new Buffer('\xfd','binary');
const DONT = new Buffer('\xfe','binary');
const IAC = new Buffer('\xff','binary');

// Telnet options
const ECHO  = new Buffer('\x01','binary');
const SUPRESS_GO_AHEAD = new Buffer('\x03','binary');
const TERM_TYPE = new Buffer('\x18','binary');
const IS = new Buffer('\x00','binary');
const SEND = new Buffer('\x01','binary');
const NAWS = new Buffer('\x1f','binary');

// state
const STATE_DATA=0;
const STATE_IAC=1;
const STATE_WILL=2;
const STATE_WONT=3;
const STATE_DO=4;
const STATE_DONT=5;
const STATE_SB=6;

var state = STATE_DATA;
var iac_sb = new Buffer(0);


/*FIXME: buffer comparison can be fixed by using modules 'node-buffertools'.
   note: there aren't buffer comparison in node.js ,please refer to -> http://stackoverflow.com/questions/13790259/buffer-comparison-in-node-js */	
function parseCommand (buf) {	
		var data = new Buffer(0); /**  variable used to store non-command data for ANSI-parsing  **/  		
		for(var i = 0;i<buf.length; ++i) {
			var ch = buf.slice(i,i+1);
			//console.log('state =' +state);
			//console.log(ch);
			switch(state) {
                case STATE_DATA:
                    if(JSON.stringify(ch) == JSON.stringify(IAC)) {
						//console.log('i got IAC');
                        if(data) { /**  feeding data to ANSI-parser while seeing IAC command  **/
                            //this.listener.onData(this, data);
                            data = new Buffer(0); /**  clear all the data that has been parse to ANSI code **/
                        }
                        state = STATE_IAC; /** turn to state-IAC for parsing TELNET command **/
                    }
                    else
						data = Buffer.concat([ data,ch ]); /** store the non-command data for ANSI-parsing  **/
                    break;
                case STATE_IAC:
                    switch( JSON.stringify(ch) ) {
                    case JSON.stringify(WILL):
                        state=STATE_WILL;
                        break;
                    case JSON.stringify(WONT):
                        state=STATE_WONT;
                        break;
                    case JSON.stringify(DO):
                        state=STATE_DO;
                        break;
                    case JSON.stringify(DONT):
                        state=STATE_DONT;
                        break;
                    case JSON.stringify(SB):
                        state=STATE_SB;
                        break;
                    default:
                        state=STATE_DATA;
                    }
                    break;
                case STATE_WILL:
                    switch( JSON.stringify(ch) ) {
                    case JSON.stringify(ECHO):
                    case JSON.stringify(SUPRESS_GO_AHEAD):
                        //conn.write( IAC + DO + ch );
						conn.write( Buffer.concat([ IAC,DO,ch ]) );
                        break;
                    default:
                        //conn.write( IAC + DONT + ch );
						conn.write( Buffer.concat([ IAC,DONT,ch ]) );
                    }
                    state = STATE_DATA;
                    break;
                case STATE_DO:
                    switch( JSON.stringify(ch) ) {
                    case JSON.stringify(TERM_TYPE):
                        //conn.write( IAC + WILL + ch );
                        conn.write( Buffer.concat([ IAC,WILL,ch ]) );
						break;
                    default:
                        //conn.write( IAC + WONT + ch );
						conn.write( Buffer.concat([ IAC,WONT,ch ]) );
                    }
                    state = STATE_DATA;
                    break;
                case STATE_DONT:
                case STATE_WONT:
                    state = STATE_DATA;
                    break;
                case STATE_SB: // sub negotiation 
                    iac_sb = Buffer.concat([ iac_sb,ch ]);
                    if( JSON.stringify(iac_sb.slice(-2)) == JSON.stringify( Buffer.concat([ IAC,SE ])) ) { 
                        // end of sub negotiation
                        switch( JSON.stringify(iac_sb.slice(0,1)) ) {
                        case JSON.stringify(TERM_TYPE): {
                            //FIXME: support other terminal types
                            //conn.write(IAC + SB + TERM_TYPE + IS + 'VT100' + IAC + SE);
                            conn.write( Buffer.concat([ IAC,SB,TERM_TYPE,IS,new Buffer('VT100'),IAC,SE ]) );
							break;
                            }
                        }
                        state = STATE_DATA;
                        iac_sb = new Buffer(0);
                        break;
                    }
			}
		}
		//console.log('data for parsing as ANSI...');
		//console.log(data);
		//console.log( "data in json code = \n"+ JSON.stringify( data ) );
		//console.log( "data in big5 code = \n"+ iconv.decode( data, 'big5') );
        if(data) {
			//this.listener.onData(this, data);
			data = new Buffer(0);
		}
}

	