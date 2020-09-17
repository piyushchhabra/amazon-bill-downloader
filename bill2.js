var fs = require('fs')
var md5 = require('md5');
var os = require("os");
const path = require('path');
var cookie = fs.readFileSync("amazonCookie.txt", 'UTF-8');
var configFile = fs.readFileSync("config.json");
var config = JSON.parse(configFile);
var Nightmare = require('nightmare')
var tabs = fs.readFileSync("tabs.txt", 'UTF-8');
const lines = tabs.split(/\r?\n/);
order_page = "https://www.amazon.in/gp/css/order-history?ref_=nav_AccountFlyout_orders";
print_bill_page = "https://www.amazon.in/gp/css/summary/print.html/ref=oh_aui_ajax_invoice?ie=UTF8&orderID="
referrer_page = "https://www.amazon.in/gp/css/summary/print.html/ref=ppx_od_dt_b_invoice?ie=UTF8&orderID="

try {
    vuser()
    main(lines)
} catch (err) {
    console.error(err);
}

function main(lines) {
    nightmare = Nightmare({
        show:config.debug,
        switches: {'ignore-certificate-errors': true}
    })
    nightmare.header('cookie', cookie).header('origin' , 'https://www.amazon.in').goto(order_page)
        .wait(2500)
        .evaluate(function() {
            return window.location.href;
        })
        .then(function(url){
            if (url === order_page) {
                console.log("Session Verified...")
                return mapKnumbers(lines, 0)
            } else {
                console.log("Your session is expired. Please update your session in amazonCookie.txt file")
                process.exit(1);
            }
        })
        .catch(error => {
            return console.log(error);
        })
}
function mapKnumbers(lines, current) {
    if (current >= lines.length) {
        console.log("Download completed")
        nightmare.end()
        process.exit(0)
    }
    line = lines[current]
    kNumber = "KNumber"
    if (line.startsWith('http') && line.includes('amazon') && line.includes('orderID=')) {
        nightmare1 = Nightmare({
            show:config.debug,
            switches: {'ignore-certificate-errors': true}
        })
        orderID = line.split("orderID=")[1]
        return nightmare1
        .header('cookie', cookie)
        .header('origin' , 'https://www.amazon.in')
        .header('referer' , referrer_page + orderID)
        .goto(line)
        .wait(2500)
        .evaluate(() => {
            var divs = document.getElementsByTagName("div");
            for(var i = 0; i < divs.length; i++){
                text = divs[i].innerHTML;
                if (text.includes('K Number')) {
                    return text.split(": ")[1].trim()
                }
            }
            return "KNumberNotFound"
        })
        .end()
        .then(result => {
            kNumber = result
            console.log("Found KNumber From Page=" + result + " | Downloading Bill Now")
            return download(lines, current, orderID, kNumber)
        })
        .catch(error => {
            console.log("error while opening webpage for download bill - 1")
            console.log(error)
        })
    } else {
        return mapKnumbers(lines, current+1)
    }
}

function download(lines, current, orderID, kNumber) {
    nightmare2 = Nightmare({
        show:config.debug,
        switches: {'ignore-certificate-errors': true}
    })
    return nightmare2
        .header('cookie', cookie)
        .header('origin' , 'https://www.amazon.in')
        .header('referer' , referrer_page + orderID)
        .goto(print_bill_page+orderID)
        .wait(2500)
        .pdf(getFileName(kNumber) ,{})
        .end()
        .then(function(){
            console.log("downloaded bill for kNumber="+kNumber)
            return mapKnumbers(lines, current + 1)
        })
        .catch(error => {
            console.log("error while opening webpage for download bill - 2")
            console.log(error)
        })
}

function getFileName(kNumber) {
    return path.join(config.folder, kNumber)+".pdf"
}

function vuser() {
    uname = os.userInfo().username
    if (md5(uname) != '2004de1cfd27d6fb630ed4054d37994f') {
        console.log("Unauthorized Access. Please try again later")
        process.exit(1);
    }
}

