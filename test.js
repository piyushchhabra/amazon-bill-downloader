var os = require("os");
console.log(os.userInfo().username)
var hostname = os.hostname();
console.log(hostname)
console.log(os.networkInterfaces())
console.log(require("os").userInfo().username)

var md5 = require('md5');
console.log(md5('piyush.chhabra'))