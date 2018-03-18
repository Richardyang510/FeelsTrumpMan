var fs = require('fs');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var url = require('url');
var Twit = require('twit');
var http = require('http');

console.log('The bot is starting');

var T = new Twit({
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
});

var tone_analyzer = new ToneAnalyzerV3({
	username: "",
	password: "",
	version_date: '2017-09-21',
	headers: {
		'X-Watson-Learning-Opt-Out': 'true'
	}
});

const NUM_EMOTION = 7;

var inputText = {
	'text': ""
};
	
var params = {
	'tone_input': inputText,
	'content_type': 'application/json'
};
	
var file_data = [
	{y: 0, label: "Anger"},
	{y: 0, label: "Fear"},
	{y: 0, label: "Joy"},
	{y: 0, label: "Sadness"},
	{y: 0, label: "Analytical"},
	{y: 0, label: "Tentative"},
	{y: 0, label: "Confident"}
];

var watson_data;

T.get('statuses/user_timeline', {tweet_mode: 'extended', screen_name: 'realDonaldTrump', count: 5}, function (err, data, response) {
	console.log("Tweets read!");
	
	if (err)
		console.log('err:', err);
	
	else{
	
		for (var i = 0; i < 5; i++) {
			inputText.text += data[i].full_text;
		}

		tone_analyzer.tone(params, function (error, response) {
			if (error)
				console.log('error:', error);
			else {
				var out_data = response.document_tone.tones;
				watson_data = response.sentences_tone;
				for (var j = 0; j < out_data.length; j++) {
					for (var k = 0; k < NUM_EMOTION; k++) {
						if (out_data[j].tone_name === file_data[k].label) {
							file_data[k].y = Number((100 * out_data[j].score).toFixed(2));
						}
					}
				}
				fs.writeFile("./data.json", JSON.stringify(file_data, null, 4), function (err) {
					if (err) {
						return console.log(err);
					}
					console.log("The file was saved!");
				});
			}
		});
	}
});

http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  //var filename = "." + q.pathname;
  var filename = "./site.html";
  fs.readFile(filename, function(err, data) {
	if (err) {
	  res.writeHead(404, {'Content-Type': 'text/html'});
	  return res.end("404 Not Found");
	}  
	res.writeHead(200, {'Content-Type': 'text/html'});
	for(var i = 0;i < watson_data.length; i++){
		res.write(JSON.stringify(i) + ": ", null, 4);
		res.write(JSON.stringify(watson_data[i].text), null, 4);
		res.write('<br>');
		res.write(JSON.stringify(watson_data[i].tones), null, 4);
		res.write('<br><br>');
	}
	res.write('<br><br>');
	res.write(JSON.stringify(file_data), null, 4);
	res.write('<br><br>');
	res.write(data);
	return res.end();
  });
}).listen(8080);
