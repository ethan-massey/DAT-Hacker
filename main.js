const puppeteer = require('puppeteer');
const lineReader = require('line-reader');
const fs = require('fs');

// constants
const WORDS = [];
const MAXIMUM_INDEX = 6802;
const TIMEOUT = 5000;
const OUTPUT_FILE = 'output.csv'
const DICTIONARY_FILE = 'dict.txt'
const HOME_URL = 'https://www.datcreativity.com/'

// selectors
const startSelector = 'body > form > .button'
const consentSelector = '#consent-consent-1'
const submitSelector = 'body > div > div:nth-child(2) > form > input'
const scoreSelector = 'body > h2 > span'
const percentStringSelector = 'body > h2'

// Used for choosing word from WORDS[] dictionary
function getRandomIndex() {
    return new Promise((resolve) => {
        var num = Math.floor(Math.random() * MAXIMUM_INDEX)
        resolve(num);
    });
}

// Takes sentence string extracts only the percentage in the string
// ex: 'Your score was better than 76.82% of participants' >> '76.82%'
function formatPercentString(str){
    var startRecordingStr = false;
    var ret = '';
    // start from end of string to discover '%' flag
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
    // percent is backwards at this point, so return reverse of that
    return ret.split("").reverse().join("");
}

// parses dict text file and populates WORDS[]
function createDictionary(){
    return new Promise((resolve) => {
        lineReader.eachLine(DICTIONARY_FILE, function(line) {
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

    fs.appendFile(OUTPUT_FILE, stringBlock, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("File saved!");
    }); 
}

async function startPuppet () {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation()

    await page.goto(HOME_URL)

    await page.setViewport({ width: 1440, height: 789 })

    await navigationPromise

    await page.waitForSelector(startSelector, {timeout: TIMEOUT}).catch((error) => {
        console.error(error);
    });
    await page.click(startSelector)

    await navigationPromise

    await page.waitForSelector(consentSelector, {timeout: TIMEOUT}).catch((error) => {
        console.error(error);
    });
    await page.click(consentSelector)

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

    await page.waitForSelector(submitSelector, {timeout: TIMEOUT}).catch((error) => {
        console.error(error);
    });
    await page.click(submitSelector)

    await page.waitForSelector(scoreSelector, {timeout: TIMEOUT}).catch((error) => {
        console.error(error);
    });
    var element = await page.$(scoreSelector);
    let score = await page.evaluate(el => el.textContent, element)
    
    await page.waitForSelector(percentStringSelector)
    var element = await page.$(percentStringSelector);
    let perc = await page.evaluate(el => el.textContent, element)

    var formattedPerc = formatPercentString(perc)
    writeToOutputFile(tenWords, score, formattedPerc)

    await browser.close()
}

async function main() {
    for(var i = 0; i < 1000; i++){
        await createDictionary();
        await startPuppet();
    }
}

main();
