var fs = require('fs')
var md5 = require('md5');
var os = require("os");
const path = require('path');
var cookie = fs.readFileSync("amazonCookie.txt", 'UTF-8');
order_page = "https://www.amazon.in/gp/css/order-history?ref_=nav_AccountFlyout_orders";
url = "https://www.amazon.in/gp/buy/payselect/handlers/display.html?hasWorkingJavascript=1"

//page.click('.a-row > .a-section > #pp-Mcryk7-601 > .a-button-inner > .a-button-input')
//Gift card cannot be used for purchasing another Amazon.in Gift card.
var Nightmare = require('nightmare')
Nightmare.action("clickIfExists", function(selector,done) {
    this.evaluate_now(function(selector) {
        document.activeElement.blur()
        var element = document.querySelector(selector)
        if (!element) {
        throw new Error('Unable to find element by selector: ' + selector)
        }
        var event = document.createEvent('MouseEvent')
        event.initEvent('click', true, true)
        element.dispatchEvent(event)
    }, done, selector)
}) 

try {
    var allCards = getCards()
    vuser()
    // gift(allCards, 0)
    gift_new(allCards)
} catch (err) {
    if (err['details'] && err['details'] == 'ERR_CONNECTION_RESET') {
        console.log("Invalid session id")
    } else {
        for (let card in err) {
            console.log(card)
        }
        console.error(err);
    }
}

function main(giftcards) {
    nightmare = Nightmare({
        show:false,
        switches: {'ignore-certificate-errors': true}
    })
    nightmare.header('cookie', cookie).header('origin' , 'https://www.amazon.in').goto(order_page)
        .wait(1500)
        .evaluate(function() {
            return window.location.href;
        })
        .then(function(url){
            if (url === order_page) {
                console.log("Session Verified...")
                return gift(giftcards, 0)
                // return gift_new(giftcards)
            } else {
                console.log("Your session is expired. Please update your session in amazonCookie.txt file")
                process.exit(1);
            }
        })
        .catch(error => {
            return console.log(error);
        })
}

function gift(giftcards, current) {
    if (current >= giftcards.length) {
        console.log("---------------**Giftcard verification completed**---------------")
        nightmare.end()
        process.exit(0)
    }

    gCard  = giftcards[current].trim()
    nightmare1 = Nightmare({
        show:false,
        switches: {'ignore-certificate-errors': true}
    })

    return nightmare1
    .header('cookie', cookie)
    .header('origin' , 'https://www.amazon.in')
    .goto(url)
    .wait(".a-expander-header")
    .clickIfExists(".a-expander-header")
    .evaluate((gCard) => {
        var allInputs = document.getElementsByTagName("input")
        var i = 0
        for(var i = 0; i < allInputs.length; i++){
             if (allInputs[i].placeholder == "Enter Code") {
                allInputs[i].value = gCard
                break;
             }
        }
        allInputs[i+1].click()
        return document.querySelector('body').innerHTML
    }, gCard)
    .end()
    .then(html => {
        if (html.includes('Gift card cannot be used')) {
            console.log(gCard + " is INVALID")
        } else {
            console.log(gCard + " is VALID")
        }
        return gift(giftcards, current + 1)
    })
    .catch(error => {
        console.log("error while opening gift card page. your session might be expired. Please update cookie file")
        if (error['code']) {
            console.log("errorCode="+ error['code'])
            if (error['code'] == -1) {
                console.log("Invalid session id")
                process.exit(0)
            }
        } else if (error['details'] && error['details'] == 'ERR_CONNECTION_RESET') {
            console.log("Invalid session id")
            process.exit(0)
        } else {
            for (let card in error) {
                console.log(card)
            }
            console.error(error);
        }
    })
}
function gift_new(giftcards) {
    nightmare1 = Nightmare({
        show:false,
        switches: {'ignore-certificate-errors': true}
    })

    return nightmare1
    .header('cookie', cookie)
    .header('origin' , 'https://www.amazon.in')
    .goto(url)
    .wait(2000)
    .clickIfExists(".a-expander-header")
    .evaluate((giftcards, idealPage) => {
        var results  = {}
        
        for(var k = 0; k < giftcards.length; k++) {
            currentPage = window.location.href
            if (currentPage != idealPage) {
                results['err'] = "Session has expired. Please update the session"
                break;
            }
            gCard  = giftcards[k].trim()
            var allInputs = document.getElementsByTagName("input")
            var i = 0
            for(var i = 0; i < allInputs.length; i++){
                 if (allInputs[i].placeholder == "Enter Code") {
                    allInputs[i].value = gCard
                    break;
                 }
            }
            allInputs[i+1].click()
            results[gCard] = document.querySelector('body').innerHTML
        }
        return results
    }, giftcards, url)
    .end()
    .then(results => {
        if(results['err']) {
            console.log(results['err'])
        } else {
            for (let card in results) {
                print_results(card,results[card])
            }
            console.log("---------------**Giftcard verification completed**---------------")
        }
    })
    .catch(error => {
        console.log("error while opening gift card page. your session might be expired. Please update cookie file")
        if (error['code']) {
            console.log("errorCode="+ error['code'])
            if (error['code'] == -1) {
                console.log("Invalid session id")
                process.exit(0)
            }
        } else if (error['details'] && error['details'] == 'ERR_CONNECTION_RESET') {
            console.log("Invalid session id")
            process.exit(0)
        } else {
            for (let card in error) {
                console.log(card)
            }
            console.error(error);
        }
    })
}

function getCards() {
    var tabs = fs.readFileSync("giftcards.txt", 'UTF-8');
    const lines = tabs.split(/\r?\n/);
    return lines
}

function print_results(gCard, html) {
    if (html.includes('Gift card cannot be used')) {
        console.log(gCard + " is INVALID/Already Used")
    } else {
        console.log(gCard + " is VALID")
    }
}

function vuser() {
    uname = os.userInfo().username
    if (md5(uname) != '2004de1cfd27d6fb630ed4054d37994f') {
        console.log("Unauthorized Access. Please try again later")
        process.exit(1);
    }
}