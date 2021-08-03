const puppeteer = require('puppeteer');
const lineReader = require('line-reader');
const fs = require('fs');

const WORDS = [];
const MAXIMUM_INDEX = 6802;
var bestScore = 0;

// Used for choosing word from WORDS[] dictionary
// to get result, call var index = await getRandomIndex()
function getRandomIndex() {
    return new Promise((resolve) => {
        var num = Math.floor(Math.random() * MAXIMUM_INDEX)
        resolve(num);
    });
}

function formatPercentString(str){
    var startRecordingStr = false;
    var ret = '';
    for(var i = str.length-1; i >= 0; i--){
        if(str[i] == '%'){
            startRecordingStr = true;
        }
        if(startRecordingStr){
            if(str[i] == ' '){
                break;
            }else{
                ret += str[i];
            }
        }
    }
    return ret.split("").reverse().join("");
}

// parses dict text file and populates WORDS[]
function createDictionary(){
    return new Promise((resolve) => {
        lineReader.eachLine('dict.txt', function(line) {
            WORDS.push(line);
        });
        
        resolve(true);
    });
}

// Takes in words[10] and score, and writes them to output file 
function writeToOutputFile(words, score, percentBetterThan){
    var stringBlock = '';
    words.forEach(word => stringBlock += word + ',');
    stringBlock += ',,' + score + ',' + percentBetterThan + '\n';

    fs.appendFile("output.csv", stringBlock, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
}

async function startPuppet () {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation()

    await page.goto('https://www.datcreativity.com/')

    await page.setViewport({ width: 1440, height: 789 })

    await navigationPromise

    await page.waitForSelector('body > form > .button')
    await page.click('body > form > .button')

    await navigationPromise

    await page.waitForSelector('#consent-consent-1')
    await page.click('#consent-consent-1')

    var tenWords = [];
    var selectorAccum = '#words-word';
    for(var i = 1; i <= 10; i++){

        let ind = await getRandomIndex();
        var word = WORDS[ind];
        tenWords.push(word);
        var selector = selectorAccum + i.toString();

        await page.waitForSelector(selector)
        await page.click(selector)
        await page.type(selector, word)
    }

    await navigationPromise

    await page.waitForSelector('body > div > div:nth-child(2) > form > input')
    await page.click('body > div > div:nth-child(2) > form > input')

    await page.waitForSelector('body > h2 > span')
    var element = await page.$( 'body > h2 > span' );
    let score = await page.evaluate(el => el.textContent, element)
    bestScore = score > bestScore ? score : bestScore;
    
    await page.waitForSelector('body > h2')
    var element = await page.$( 'body > h2' );
    let perc = await page.evaluate(el => el.textContent, element)

    var formattedPerc = formatPercentString(perc)
    writeToOutputFile(tenWords, score, formattedPerc)

    await browser.close()
}

async function main() {
    for(var i = 0; i < 50; i++){
        await createDictionary();
        await startPuppet();
    }
    console.log(bestScore)
}

main();
