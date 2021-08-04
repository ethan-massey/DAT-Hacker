const puppeteer = require('puppeteer');
const lineReader = require('line-reader');
const fs = require('fs');

const WORDS = [];
const MAXIMUM_INDEX = 6802;
const outputFile = 'output.csv'
const dictionaryFile = 'dict.txt'
const homeUrl = 'https://www.datcreativity.com/'
const ERROR_SELECTOR_NOT_FOUND = 'Selector was not found:'

// selectors
const startSelector = 'body > form > .button'
const consentSelector = '#consent-consent-1'
const submitSelector = 'body > div > div:nth-child(2) > form > input'
const scoreSelector = 'body > h2 > span'
const percentStringSelector = 'body > h2'

// Used for choosing word from WORDS[] dictionary
// to get result, call var index = await getRandomIndex()
function getRandomIndex() {
    return new Promise((resolve) => {
        var num = Math.floor(Math.random() * MAXIMUM_INDEX)
        resolve(num);
    });
}

// Error message
function errorMessage(error, context = '') {
    console.log(`Error: ${error} ${context}`)
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
        lineReader.eachLine(dictionaryFile, function(line) {
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

    fs.appendFile(outputFile, stringBlock, function(err) {
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

    await page.goto(homeUrl)

    await page.setViewport({ width: 1440, height: 789 })

    await navigationPromise

    await page.waitForSelector(startSelector)
    await page.click(startSelector)

    await navigationPromise

    await page.waitForSelector(consentSelector)
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

    await page.waitForSelector(submitSelector)
    await page.click(submitSelector)

    await page.waitForSelector(scoreSelector); //, {timeout: 5000}).catch(errorMessage(ERROR_SELECTOR_NOT_FOUND, scoreSelector))
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
