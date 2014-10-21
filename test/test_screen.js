/* test function */

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
