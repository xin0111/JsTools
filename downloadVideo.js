
let fs = require('fs');
let http = require("http");
let https = require("https");
var querystring=require("querystring");
var ProgressBar = require('progress');
var async = require('async'); 

function downloadVideo(url,filepath) {

	http.get(url, function (res) {
		let videoData = "";
		//总长度	
		let contentLength = parseInt(res.headers['content-length']);

		var bar = new ProgressBar(filepath +' [:bar] :percent ', {
			complete: '=',
			incomplete: '-',
			width: 20,
			total: contentLength
		  });

		res.setEncoding("binary");
		res.on("data", function (chunk) {
			videoData += chunk;
			//进度条		
			bar.tick(chunk.length);
		});
		res.on("end", function () {
			fs.writeFile(filepath, videoData, "binary", function (err) {
				if (err) {
					console.log(filepath + "下载失败！");
				} 
			});
		});
	});
}

function getVideoUrl(base) {

	var res=querystring.parse(base);
	//__biz可以认为是微信公众平台对外公布的公众帐号的唯一id	
	//mid 图文ID
	var video = "https://mp.weixin.qq.com/mp/videoplayer?action=get_mp_video_play_url&preview=0&__biz=MzIzMzE5ODI3MA==&mid=&idx=4&vid="+ res['vid']+ "&uin=&key=&pass_ticket=&wxtoken=777&appmsg_token=&x5=0&f=json";
	
	https.get(video, function (res) {
		var html = '';		
		res.on('data', function (chunk) {
			html += chunk;
		});
		res.on('end', function () {
			let data = JSON.parse(html);				 
			downloadVideo(data['url_info'][0]['url'],data['title']+".mp4");
		});
	});
}

function getUrl(x) {
	https.get(x, function (res) {
		var html = '';
		res.setEncoding('binary');
		res.on('data', function (chunk) {
			html += chunk;
		});
		res.on('end', function () {

			const cheerio = require('cheerio');
			const $ = cheerio.load(html);
			
			let videos = $("iframe.video_iframe");
			videos = videos.toArray();
		
			videos.forEach((video) => {
				let video_src = video.attribs["data-src"];		
				//延时	
				setTimeout(function(){getVideoUrl(video_src)},2000);	
			});
		})

	}).on('error', function (err) {
		console.log(err);
	});
}

//getUrl("https://mp.weixin.qq.com/s/wGu-CCcYePwd23cLZi-4fg");

// 控制台输入
process.on('exit', function(code) { console.log(code) });
process.stdin.setEncoding('utf8');
 
process.stdout.write("输入视频网址:\n");
process.stdin.on('data',(input)=>{
  input = input.toString().trim();
  getUrl(input);
})

