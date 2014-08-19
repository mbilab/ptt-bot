PTT-BOT
=====================


**Ptt-bot** 是一個開放原始碼的專案，它的目標在於提供開發者在開發批踢踢機器人所需要的底層架構與函式和上層應用程式，解決需要開發時會遇到的各種底層惱人的問題。**Ptt-bot** 由 **JavaScript**[1] 編寫，並需要在 [**node.JS**][package1] 的環境下運行。**Ptt-bot** 使用 **node.JS** 原生的 [**Net**][package2] 套件進行 **Telnet**[2] 的連線，並利用 [**iconv-lite**][package3] 和 [**String.js**][package4] 套件分別解決 **Big5編碼**[3] 與字串解析的問題。

Ptt-bot is an open source node.js project for crawling data from **PTT**[4] (a well-known BBS service in Taiwan).

[1]: http://zh.wikipedia.org/wiki/JavaScript
[2]: http://courses.ywdeng.idv.tw/cust/2011/np/PPT/CH08-telnet.ppt
[3]: http://zh.wikipedia.org/zh-tw/%E5%A4%A7%E4%BA%94%E7%A2%BC
[4]: http://en.wikipedia.org/wiki/PTT_Bulletin_Board_System

[package1]: http://nodejs.org/
[package2]: http://nodejs.org/api/net.html
[package3]: https://github.com/ashtuchkin/iconv-lite
[package4]: http://stringjs.com/


Screen 
----------
**每個Screen均有屬於自己的參數(flag)，供機器人判斷為第幾次進入該頁面，參數的取得可以參考para()函式，目前已定義的八大頁面如下: **

【主功能表】: 當機器人執行登入完後便會停留在【主功能表】，因此程式一般開始應該會由主功能表起頭(程式參考如下)，【主功能表】的參數為 *MCflag* 。 

    if(myBot.where()=='【主功能表】' && myBot.para().MCflag==1){
        /**	
            MCflag is set to 1, since it is the "1" time entering main screen.
            put all your robot commands for main screen here.
            please refer to Ptt-bot API.
        **/
    }

【我的最愛看板列表】: 目前僅能由【主功能表】執行 MaintoFavBoard() 進入，【我的最愛看板列表】的參數為 *FBflag* 。 

【熱門看板列表】: 目前僅能由【主功能表】執行 MaintoHotBoard() 進入，【熱門看板列表】的參數為 *HBflag* 。 

【分類看板】: 功能開發中，【分類看板】的參數為 *BCflag* 。 

【看板列表】: 功能開發中，【看板列表】的參數為 *BLflag* 。 

【文章列表】: 在【主功能表】、【文章列表】、【文章內】皆可使用 toBoard() 輸入板名，進入某板的文章列表，【看板列表】的參數為 *ALflag*。

【文章內】: 僅能由【文章列表】中利用 BoardtoArticle() 輸入預前往的文章編號(字串)進入，【文章內】的參數為 *ACflag*。

【文章代碼】: 當要先截取文章所有內容時，應該先進入【文章內】的執行 loadArticleURL() 後，進入【文章代碼】執行 fetchArticle() 取得文章(程式參考如下)。【文章代碼】的參數為 *AUflag*。 
        
    if(myBot.where()=='【文章列表】' && myBot.para().ALflag==1){
    	myBot.BoardtoArticle('30002'); 			
    }
    if(myBot.where()=='【文章內】' && myBot.para().ACflag==1){
    	myBot.loadArticleURL();
    }
    if(myBot.where()=='【文章代碼】' && myBot.para().AUflag==1){
    	myBot.fetchArticle();//Article will be return here.
    	myBot.arrowLeft();//goes back to 【文章列表】;
    }

base-method
----------
 * login( id , ps )
    執行登入ptt-sever的功能，登入完後會停留在 【主功能表】的頁面。開發者需要自行輸入機器人的帳號及密碼，並且回傳已連上ptt:23的connection物件。connection物件擁有write()等功能，connection物件詳細內容需參考Net原生套件[b1]。

        var conn = myBot.login('yourID','yourPassword');

 * screen() 
    在任何頁面皆可使用，取得目前頁面含色碼的資料。

 * para()
    取得頁面的參數，必須在 para() 後加入頁面的參數名稱，例如取得【主功能表】的參數如下。
    
        myBot.para().MCflag
    
    畫面參數對照

        'MCflag': 【主功能表】, // main-screen enter flag
		'HBflag': 【熱門看板列表】, //hot-board enter flag
		'FBflag': 【我的最愛看板列表】, //favorite-board enter flag
		'ALflag': 【文章列表】, //article-list enter flag
		'ACflag': 【文章內】, //article-content enter flag
		'BLflag': 【看板列表】, //board-list enter flag
		'BCflag': 【分類看板】, //board-class enter flag
		'AUflag': 【文章代碼】. //article-url enter flag

 * where ()
   回傳目前所在的頁面，供判斷頁面用(screen listener)。 不需傳入任何東西。目前支援的頁面為:【主功能表】、【文章列表】、【文章內】、【我的最愛看板列表】、【熱門看板列表】、【分類看板】、【看板列表】、【文章代碼】。

 * toBoard()  別名: toArticlesList()
   前往某板的【文章列表】，不需傳入任何東西，不會回傳任何東西，執行完後停留在該板的【文章列表】。在【主功能表】、【文章列表】、【文章內】皆可使用，【我的最愛看板列表】、【熱門看板列表】並不支援。

 * MaintoFavBoard()
    進入機器人自己的【我的最愛看板列表】，僅能從【主功能表】進入。不需傳入任何東西，並不會回傳任何東西。

 * MaintoHotBoard()
    進入【熱門看板列表】，僅能從【主功能表】進入。不需傳入任何東西，並不會回傳任何東西。

 * pageUp() 
    僅能在【文章列表】頁面使用。進入上一頁的【文章列表】。

 * pageDown() 
    僅能在【文章列表】頁面使用。進入下一頁的【文章列表】。
 
 * arrowLeft() 
    在各頁面皆可以使用，如同閱讀PTT時按向左鍵的功能。在【文章內】時可執行回【文章列表】的功能。 

 * arrowRight() 
    在各頁面皆可以使用，如同閱讀PTT時按向右鍵的功能。

 * loadArticleURL() 
    僅能在【文章內】執行，執行後進入該文章的【文章代碼】畫面。

 * escapeANSI(dataBig5) 
    在各頁面皆可以使用。需將想去除色碼的資料(Big5編碼)傳入，將回傳該頁面除去色碼後的內容(Big5編碼) 。

 * fetchBoardHeader()
    在【文章列表】頁面使用。不需傳入任何東西，將回傳該板的標題(Big5編碼)，例: 【八卦-公民議題可洽PublicIssue板】。

 * fetchArticleList()
    在【文章列表】頁面使用。不需傳入任何東西，將回傳該頁面內 **保留色碼** 的所有文章標題(Big5編碼)，標題內容包含文章編號、作者、日期等。

 * fetchArticleList_inArr()
     在【文章列表】頁面使用。不需傳入任何東西，將以 **陣列** 的方式回傳該頁面內的所有文章標題(Big5編碼)，標題內容包含文章編號、作者、日期等。

 * fetchArticle() //目前尚在開發中
   僅能在【文章代碼】頁面執行，取得該文章的詳細內容。詳細取得文章的流程請參考畫面介紹中的【文章代碼】。

[b1]: http://nodejs.org/api/net.html


applied-method
----------
 * filter( factor1, factor2, factor3 )

 * getPopularArticleTitles( board, #push, #article )
  

References
---------

* [**實作 Telnet Client 理論**][R1]
* [**利用純 JavaScript 寫 PCman火狐外掛 的原始碼**][R2]
* [**node.js 參考教學: node入門**][R3]
* [**ptt-bot in Ruby**][R4]
* [**Learning Advanced JavaScript by John Resig**][R5]
* [**Telnet 協定簡易介紹 Powerpoint**][R6]
* [**Telnet Keyboard Equivalents**][R7]
* [**Discussion in leaking problem of received data **][R8]

[R1]: http://dspace.lib.fcu.edu.tw/handle/2377/4110 
[R2]: https://code.google.com/p/pcmanfx/
[R3]: http://www.nodebeginner.org/index-zh-tw.html
[R4]: https://github.com/chenchenbox/backup-dog-ptt
[R5]: http://ejohn.org/apps/learn/#1 
[R6]: http://courses.ywdeng.idv.tw/cust/2011/np/PPT/CH08-telnet.ppt
[R7]: http://www.novell.com/documentation/extend52/Docs/help/Composer/books/TelnetAppendixB.html
[R8]: https://www.ptt.cc/bbs/Soft_Job/M.1388674793.A.B82.html 

Tools
---------
* [**Online Regex Tester**][T1] - an online regex tester for javascript, php, pcre and python.
* [**StackEdit**][T2] - markdown editor.
[T1]: http://regex101.com/#pcre
[T2]: https://stackedit.io/#
