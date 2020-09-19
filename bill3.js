var fs = require('fs');
// var pdf = require('html-pdf');
// var options = { format: 'A4' };
var md5 = require('md5');
var os = require("os");
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
var Nightmare = require('nightmare')

// const Puppeteer = require('puppeteer')  
// const browser = await Puppeteer.launch()

const htmlfolder = './html/';
const pdffolder = './pdf/'
let random = "random-"
let count = 1

vuser()

fs.readdirSync(htmlfolder).forEach(file => {
    if (file.endsWith("html")) {
        var html = fs.readFileSync(htmlfolder+file, 'utf8');
        if (html.includes('Amazon.in order number:')) {
            const dom = new JSDOM(html);
            var divs = dom.window.document.getElementsByTagName('div')
            var kNumber=undefined
            for(var i = 0; i < divs.length; i++){
                text = divs[i].innerHTML;
                if (text.includes('K Number')) {
                    console.log(text.split(": ")[1].trim())
                    kNumber = text.split(": ")[1].trim()
                    break;
                } else if (text.includes('Account Number')) {
                    console.log(text.split(": ")[1].trim())
                    kNumber = text.split(": ")[1].trim()
                    break;
                }
            }

            if (kNumber == undefined) {
                kNumber = getRandomName()
                console.log(file + " - KNumber/AccountNumber Not Found, Downloading file with random name")
            }

            nightmare = Nightmare({
                show:false,
                switches: {'ignore-certificate-errors': true}
            })
            const url = 'data:text/html;base64,' + Buffer.from(html).toString('base64');
            nightmare.goto(url).pdf(pdffolder+kNumber+".pdf", {})
            .end()
            .then(function(){
                console.log("downloaded bill for kNumber="+kNumber)
            })
            
            // pdf.create(html, options).toFile(pdffolder+kNumber+".pdf", function(err, res) {
            // if (err) return console.log(err);
            //     console.log("downloaded - ")
            //     console.log(res); 
            // });
        } else {
            console.log(file + " is not a amazon invoice")
        }
        
    }
});

function getRandomName() {
    var name  =  random + count
    count = count + 1
    return name
}

function vuser() {
    uname = os.userInfo().username
    if (md5(uname) != '2004de1cfd27d6fb630ed4054d37994f') {
        console.log("Unauthorized Access. Please try again later")
        process.exit(1);
    }
}
