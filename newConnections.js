require("dotenv").config();
const fs = require('fs');
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require('path');
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
async function randomDelay() {
    const delay = Math.floor(Math.random() * 5000) + 1000;  // Random delay between 1000ms (1s) and 5000ms (5s)
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function initializeDriver() {
    let options = new chrome.Options();
    let driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();
    return driver;
}

async function openLinkedIn(driver) {
    await driver.get("https://www.linkedin.com/login");
}

async function performLogin(driver) {
    try {
        await openLinkedIn(driver);
        const emailField = await driver.findElement(By.id('username'));
        const passwordField = await driver.findElement(By.id('password'));

        await emailField.sendKeys(email);
        await passwordField.sendKeys(password);

        const loginButton = await driver.findElement(By.xpath("//button[@type='submit']"));
        await loginButton.click();

        await driver.wait(until.urlContains('feed'), 100000);

        // Save cookies after successful login
        await saveCookies(driver);

    } catch (error) {
        console.error("Error during login process:", error);
    }
}

async function saveCookies(driver) {
    const cookies = await driver.manage().getCookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));
    console.log('Cookies saved.');
}

async function loadCookies(driver) {
    if (fs.existsSync('cookies.json')) {
        console.log('Loading cookies...');
        const cookies = JSON.parse(fs.readFileSync('cookies.json'));

        await driver.get('https://www.linkedin.com'); // Load LinkedIn to establish domain context
        for (let cookie of cookies) {
            await driver.manage().addCookie(cookie);
        }
        console.log('Cookies loaded.');
    }
}


async function navigateToMyNetwork(driver) {
    try {
        // Navigate to the My Network page
        await driver.get("https://www.linkedin.com/mynetwork/");

        // Wait for a specific element in My Network to ensure the page is loaded
        await driver.wait(until.elementLocated(By.css("div[data-view-name='cohort-card']")), 10000);
    } catch (error) {
        console.error("Error navigating to My Network:", error);
    }
}
async function connectWithFirst15People(driver) {
    try {
        let peopleConnected = 0;
        let cardsProcessed = 0;
        
        while (peopleConnected < 15) {
            // Continuously find cards
            let cohortCards = await driver.findElements(By.css("div[data-view-name='cohort-card']"));
            console.log(`Currently found ${cohortCards.length} cohort cards.`);

            for (let i = cardsProcessed; i < cohortCards.length && peopleConnected < 15; i++) {
                console.log(`Processing card ${i + 1}`);
                let attempts = 0;
                let connected = false;

                while (attempts < 3 && !connected) {
                    try {
                        const card = cohortCards[i];
                        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", card);

                        const connectSpan = await card.findElement(By.xpath(".//span[contains(text(), 'Connect')]"));
                        const connectButton = await connectSpan.findElement(By.xpath("ancestor::button"));
                        console.log(`Connect button found for card ${i + 1}`);

                        await driver.executeScript("arguments[0].click();", connectButton);
                        console.log(`Clicked connect button on card ${i + 1}`);

                        connected = true;
                        peopleConnected++;
                        console.log(`Successfully connected with card ${i + 1} (${peopleConnected}/15)`);
                        await driver.sleep(2000);
                    } catch (error) {
                        if (error.name === 'ElementClickInterceptedError') {
                            console.warn(`ElementClickInterceptedError: Retrying card ${i + 1}`);
                        } else if (error.name === 'StaleElementReferenceError') {
                            console.warn(`StaleElementReferenceError: Retrying card ${i + 1}`);
                        } else {
                            console.error(`Error sending connection invitation for card ${i + 1}:`, error);
                            break;
                        }
                        attempts++;
                    }
                    await driver.sleep(1000);
                }
                await driver.sleep(3000);
            }
            
            cardsProcessed = cohortCards.length;

            if (peopleConnected < 15) {
                console.log("scrolling to bottom")
                // Scroll to the bottom to load more cards
                await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
                randomDelay(); // Wait for new cards to load
            }
        }
    } catch (error) {
        console.error("Error while connecting with people:", error);
    }
}
async function performTask() {
    const driver = await initializeDriver();

    try {
        if (fs.existsSync('cookies.json')) {
            await loadCookies(driver);
            await driver.get('https://www.linkedin.com/feed');
        } else {
            await performLogin(driver);
        }

        await navigateToMyNetwork(driver);
        await connectWithFirst15People(driver);

    } catch (error) {
        console.error("Error during processing:", error);
    } finally {
        // Uncomment the line below when you're ready to quit the driver
        // await driver.quit();
    }
}

performTask();