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
        await driver.get("https://www.linkedin.com/mynetwork/catch-up/all/");

        // Wait for a specific element in My Network to ensure the page is loaded
        await driver.wait(until.elementLocated(By.css("div[data-view-name='nurture-card']")), 10000);
    } catch (error) {
        console.error("Error navigating to My Network:", error);
    }
}

async function catchUpWithFirst15People(driver) {
    try {
        let nurtureCards = await driver.findElements(By.css("div[data-view-name='nurture-card']"));
        console.log(`Currently found ${nurtureCards.length} cohort cards.`);

        // Iterate over the first 15 nurture cards
        for (let i = 0; i < Math.min(15, nurtureCards.length); i++) {
            let button;

            // Use WebDriverWait to ensure the button is clickable
            await driver.wait(until.elementLocated(By.css("button[data-view-name='nurture-card-primary-button']")), 10000).then(async () => {
                button = await nurtureCards[i].findElement(By.css("button[data-view-name='nurture-card-primary-button']"));
                
            });
            if (button) {
                await button.click(); // Click the button

                await randomDelay(); // Wait for the dialog to appear

                const dialog = await driver.findElement(By.css("dialog[aria-label='Send Message']"));
                const sendButton = await dialog.findElement(By.css("button[data-view-name='messaging-modal-send-button']"));
                
                await sendButton.click(); // Click the send button

                console.log(`Message sent to person ${i + 1}`);
            }
        }
    } catch (error) {
        console.error("Error while connecting with people:", error);
    }
}

async function randomDelay() {
    const delay = Math.floor(Math.random() * 5000) + 1000;  // Random delay between 1000ms (1s) and 5000ms (5s)
    return new Promise(resolve => setTimeout(resolve, delay));
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
        await catchUpWithFirst15People(driver) ;

    } catch (error) {
        console.error("Error during processing:", error);
    } finally {
        // Uncomment the line below when you're ready to quit the driver
        // await driver.quit();
    }
}

performTask();