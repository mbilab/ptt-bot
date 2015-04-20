	var myBot = require('./PTT-BOT/ptt-bot');
	var fs = require('fs');
	var iconv = require('iconv-lite'); 

	/*  與Ptt-sever建立連線  */
	myBot.login(id,ps, function(){ //請自行輸入帳號密碼
		
		/*	登入完後即停留在主功能表 */	
		console.log('已進入主功能表');
	
	});
	
	/*	進入欲收集的電影版版中	*/
	myBot.toBoard('movie',function(){
		
			console.log('已進入movie板，接著收集文章!');
		
	});
	
	/*	從編號54635的文章開始收集	*/
	_indexForArticle = 54635; //global
	
	/*	往後收集5篇文章	*/
	for( var _=0;_<5;_++ ){
		
		/*	先進入文章中	*/
		myBot.toArticle(_+_indexForArticle,function(){ 
			
			console.log('進入'+_indexForArticle+'文章中');
			
		});
	
		/*	接著下載文章	*/
		myBot.loadArticle(function(){
		
			/*	從getArticle()取得文章內容	*/
			fs.writeFile('./'+'movie'+_indexForArticle+'_withoutANSI.txt', iconv.encode( myBot.escapeANSI( myBot.getArticle() ),'big5' ), function (err) {
				
				if (err) throw err;
				console.log('movie'+_indexForArticle+' 已經被儲存囉!');
				_indexForArticle++;
				
			});
		
		});
		
	}
	
	/**	
	//或使用 applied-method	
	
	//與Ptt-sever建立連線  
	myBot.login(id,ps, function(){ //請自行輸入帳號密碼
		
		//登入完後即停留在主功能表	
		console.log('已進入主功能表');
	
	});
	
	//直接執行收集文章的功能	
	myBot.collectArticleFromBoard('movie',54620,5,'./');

	**/