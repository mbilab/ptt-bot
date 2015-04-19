PTT-BOT(This project is still under construction)
=====================


**Ptt-bot** 是一個開放原始碼的專案，它的目標在於提供開發者在開發批踢踢機器人所需要的底層架構與函式和上層應用程式，解決需要開發時會遇到的各種底層惱人的問題。**Ptt-bot** 由 **JavaScript**[1] 編寫，並需要在 [**node.JS**][package1] 的環境下運行。**Ptt-bot** 使用 **node.JS** 原生的 [**Net**][package2] 套件進行 **Telnet**[2] 的連線，並利用 [**iconv-lite**][package3] 和 [**String.js**][package4] 套件分別解決 **Big5編碼**[3] 與字串解析的問題。

Ptt-bot is an open source node.js project for crawling data from **PTT**[4].

關鍵字:　批踢踢機器人、自動化、PTT Crawler

# Development

第一次可以先執行此指令, 以安裝所有套件。 或自行個別安裝(參閱 **Require**)。

		npm i LiveScript
		./package.ls
		npm i

Require
----------
#### string.js ####
 
 
		npm install --save string 
	

#### iconv-lite ####
 
 
		npm install iconv-lite 
	


[1]: http://zh.wikipedia.org/wiki/JavaScript
[2]: http://courses.ywdeng.idv.tw/cust/2011/np/PPT/CH08-telnet.ppt
[3]: http://zh.wikipedia.org/zh-tw/%E5%A4%A7%E4%BA%94%E7%A2%BC
[4]: http://en.wikipedia.org/wiki/PTT_Bulletin_Board_System

[package1]: http://nodejs.org/
[package2]: http://nodejs.org/api/net.html
[package3]: https://github.com/ashtuchkin/iconv-lite
[package4]: http://stringjs.com/


Base-method
----------
 * login(id, ps, callback)
 
 * sendPressAnyKey(callback)
 
 * sendCtrlL(callback)
 
 * sendPageUp(callback)
 
 * sendPageDown(callback)
 
 * sendLeft(callback)
 
 * sendRight(callback)
 
 * getScreen()
 
 * getArticle()
 
 * escapeANSI(str)
 
 * toMain(callback)
 
 * toBoard(BoardName,callback)
 
 * toArticle(NumStr,callback)

 * loadArticle(callback)
 
 * execFuntion(func)
 
Applied-method
----------
 * collectArticleFromBoard(boardName,startIndex,totalAmount,targetDic)

 * collectArticleFromBoardWithoutANSI(boardName,startIndex,totalAmount,targetDic)
  

References
---------

* [**實作 Telnet Client 理論**][R1]
* [**利用純 JavaScript 寫 PCman火狐外掛 的原始碼**][R2]
* [**node.js 參考教學: node入門**][R3]
* [**ptt-bot in Ruby**][R4]
* [**Learning Advanced JavaScript by John Resig**][R5]
* [**Telnet 協定簡易介紹 Powerpoint**][R6]
* [**Telnet Keyboard Equivalents**][R7]
* [**Discussion in leaking problem of received data**][R8]

[R1]: http://dspace.lib.fcu.edu.tw/handle/2377/4110 
[R2]: https://code.google.com/p/pcmanfx/
[R3]: http://www.nodebeginner.org/index-zh-tw.html
[R4]: https://github.com/chenchenbox/backup-dog-ptt
[R5]: http://ejohn.org/apps/learn/#1 
[R6]: http://courses.ywdeng.idv.tw/cust/2011/np/PPT/CH08-telnet.ppt
[R7]: http://www.novell.com/documentation/extend52/Docs/help/Composer/books/TelnetAppendixB.html
[R8]: https://www.ptt.cc/bbs/Soft_Job/M.1388674793.A.B82.html 

