# DAT-Hacker - A vain attempt to beat the [Divergent Association Task](https://www.datcreativity.com/)
# Objective and Introduction
The [Divergent Association Task](https://www.datcreativity.com/) is a simple word-based task to rate creativity on a scale from 0-200. You choose 10 nouns within 90 seconds that are as different from each other as possible. Only common nouns are allowed. The DAT compares the words against each other, and gives a score based on the similarities of the words. The less similiar in subject, the higher the score. Read about the study [here](https://www.datcreativity.com/)

# Setup
- Clone this repo
- Rename `output_EMPTY.csv` to `output.csv`
- run `npm i`
- run `node main`

### Setup Problems?
- Make sure to install [Node](https://nodejs.org/en/download/)
- Make sure you're connected to the internet.
- If you have trouble with a repeating popup on Safari upon opening Chromium, try using this command:
`sudo codesign --force --deep --sign - ./node_modules/puppeteer/.local-chromium/mac-722234/chrome-mac/Chromium.app`

# FYI
Error checking was not on my mind when scribbling this spaghetti code. You will probably get a timeout exception on the ~126th iteration. I'll get to it at some point...
