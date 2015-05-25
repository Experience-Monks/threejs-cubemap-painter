//runs beefy AND the file-io-server on 2 ports
//file-io-server supports CORS

var fileIOServer = require('file-io-server'),
	chalk = require('chalk'),
	shelljs = require('shelljs/global');

//make sure the file-io Client uses the same port
var fileIOPort = 3000
new fileIOServer({
		port: fileIOPort,
		servePath: "./",
		debugLevel: 1
	});

//beefy for quickly testing test client.
var child = exec('beefy testClient.js --open', {async:true});
child.stdout.on('data', function(data) {
	console.log(chalk.cyan(data));
});