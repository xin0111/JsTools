
let fs = require('fs');
let http = require("http");
let https = require("https");
var querystring=require("querystring");
var ProgressBar = require('progress');
var async = require('async'); 

var tasks = [];
var count = 1;

function downloadVideo(url, filepath) {

	tasks.push(function (callback) {
		http.get(url, function (res) {
	
			let videoData = "";
			//总长度
			let contentLength = parseInt(res.headers['content-length']);

			var bar = new ProgressBar(filepath + ' [:bar] :percent ', {
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
				// 必须要写,否则无法执行下一个task
				callback(null);
			});
		});
	});
}

function getVideoUrl(video_url,video_num) {

	https.get(video_url, function (res) {
		var html = '';	
		res.on('data', function (chunk) {
			html += chunk;
		});
		res.on('end', function () {
			let data = JSON.parse(html);		
			let urlInfos = data['url_info'];
			if(urlInfos.length>0)		 
			{
				downloadVideo(data['url_info'][0]['url'],data['title']+".mp4");		
			}		
			if(video_num == count)
			{
				//开始执行task
				async.waterfall(tasks,function(){
					console.log("下载完成!");
				});
			}
			count ++;
		});
		
	});
}

function getUrl(x) {
	https.get(x, function (res) {
		var html = '';
		//res.setEncoding('binary');
		res.on('data', function (chunk) {
			html += chunk;
		});
		res.on('end', function () {
			//计数
			count = 1;

			const cheerio = require('cheerio');
			const $ = cheerio.load(html);
			
			//获取biz
			let ogurl = $('meta').filter(
				function( index ) {
					return $('meta')[index].attribs['property'] == 'og:url';
				  }
			)[0].attribs['content'];
			var biz=querystring.parse(ogurl)['http://mp.weixin.qq.com/s?__biz'];
			//__biz可以认为是微信公众平台对外公布的公众帐号的唯一id	
				//mid 图文ID
			var video_url = "https://mp.weixin.qq.com/mp/videoplayer?action=get_mp_video_play_url&preview=0&__biz="+biz+"&mid=&idx=4&vid="+ '{vid}' + "&uin=&key=&pass_ticket=&wxtoken=777&appmsg_token=&x5=0&f=json";
			//查找视频
			var reg = /wxv_\d+/g;//g:匹配所有满足项
			var vid_array = [...new Set(html.match(reg))];
	
			if(vid_array.length == 0)
			{
				console.log("未找到视频资源!");	
			}			
			vid_array.forEach((vid) => {

				getVideoUrl(video_url.replace('{vid}',vid),vid_array.length);
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
  if (input.indexOf("http://mp.weixin.qq.com/") > -1 || input.indexOf("https://mp.weixin.qq.com/") > -1) 
  {
	getUrl(input);
  }
  else
  {
	console.log('请填写 “ http://mp.weixin.qq.com/ ” 开头的网址\n输入视频网址:');
  }
})

