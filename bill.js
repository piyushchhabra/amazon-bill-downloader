const path = require('path');
var os = require("os");
uname = os.userInfo().username
var Nightmare = require('nightmare'),

order_page = "https://www.amazon.in/gp/css/order-history?ref_=nav_AccountFlyout_orders";
print_bill_page = "https://www.amazon.in/gp/css/summary/print.html/ref=oh_aui_ajax_invoice?ie=UTF8&orderID="
referrer_page = "https://www.amazon.in/gp/css/summary/print.html/ref=ppx_od_dt_b_invoice?ie=UTF8&orderID="
if (process.argv.length < 3 || !process.argv[2].endsWith(".csv")) {
    console.log('Usage: node bill.js' + ' <csv_file>');
    process.exit(1);
}
if (uname != 'piyush.chhabra') {
    console.log("Unauthorized Access. Please try again later")
    process.exit(1);
}
var fs = require('fs') , filename = process.argv[2];
var configFile = fs.readFileSync("config.json");
var config = JSON.parse(configFile);
var cookie = fs.readFileSync("amazonCookie.txt", 'UTF-8');
// main()

function main() {
    try {
        const data = fs.readFileSync(filename, 'UTF-8');
        const lines = data.split(/\r?\n/);

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
                    validateLines(lines)
                    return download_bill_new(lines, 0)
                } else {
                    console.log("Your session is expired. Please update your session in amazonCookie.txt file")
                    process.exit(1);
                }
            })
            .catch(error => {
                return console.log(error);
            })
    } catch (err) {
        console.error(err);
    }
}

function validateLines (lines) {
    lines.forEach((line) => {
        fields = line.split(",")
        if (fields.length != 2) {
            console.log("Invalid line: " + line)
            process.exit(1);
        }
    });
    console.log("File Validated")
}

function download_bill_new(lines, current) {
    if (current >= lines.length) {
        console.log("Download completed")
        nightmare.end()
        process.exit(0)
    }

    line = lines[current]
    fields = line.split(",")
    if (fields.length != 2) {
        console.log("Invalid line: " + line)
        process.exit(1);
    }
    kNumber = fields[0].trim()
    orderID = fields[1].trim()
    if (kNumber.startsWith("k")) {
        return download_bill_new(lines, current+1)
    }

    nightmare1 = Nightmare({
        show:config.debug,
        switches: {'ignore-certificate-errors': true}
    })
    return nightmare1
        .header('cookie', cookie)
        .header('origin' , 'https://www.amazon.in')
        .header('referer' , referrer_page + orderID)
        .goto(print_bill_page+orderID)
        .wait(2500)
        .pdf(getFileName(kNumber) ,{})
        .end()
        .then(function(){
            console.log("downloaded bill for kNumber="+kNumber)
            return download_bill_new(lines, current + 1)
        })
        .catch(error => {
            console.log("error while opening webpage for download bill")
            console.log(error)
        })
}

function getFileName(kNumber) {
    return path.join(config.folder, kNumber)+".pdf"
}
