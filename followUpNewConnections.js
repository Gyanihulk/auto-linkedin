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

function isConnectedWithin24Hours(connectionTime) {
    const timeRegex = /(\d+)\s(hours?)\sago/;
    const match = connectionTime.match(timeRegex);
    if (match && parseInt(match[1]) <= 24) {
        return true;
    }
    return false;
}

function hasMessageBeenSent(name, savedConnections) {
    const existingConnection = savedConnections.find(conn => conn.name === name);
    return existingConnection ? existingConnection.messageSent : false;
}


async function extractConnections(driver) {
    console.log("Navigating to connections page...");
    await driver.get('https://www.linkedin.com/mynetwork/invite-connect/connections/');

    console.log("Waiting for connection cards to load...");
    await driver.wait(until.elementsLocated(By.className('mn-connection-card')), 10000);

    console.log("Fetching connection cards...");
    const connectionCards = await driver.findElements(By.className('mn-connection-card'));

    console.log(`Found ${connectionCards.length} connection cards`);
    // Read existing connections from the JSON file
    let savedConnections = [];
    if (fs.existsSync('connections.json')) {
        savedConnections = JSON.parse(fs.readFileSync('connections.json', 'utf-8'));
    }

    for (let card of connectionCards) {
        try {
            const nameElement = await card.findElement(By.className('mn-connection-card__name'));
            const name = await nameElement.getText();
            const connectionTime = await card.findElement(By.tagName('time')).getText();
            
            if (isConnectedWithin24Hours(connectionTime) && !hasMessageBeenSent(name, savedConnections)) {
                const messageSent = await sendMessage(driver, card);
                const connection = {
                    name: name.trim(),
                    connectedTime: connectionTime.trim(),
                    messageSent: messageSent
                };
                
                // Update local array and save to JSON after each card is processed
                savedConnections.push(connection);
                fs.writeFileSync('connections.json', JSON.stringify(savedConnections, null, 2));
                console.log(`Connection processed and saved: ${name}. Message sent: ${messageSent}`);
            } else {
                console.log(`Connection skipped: ${name}, ${connectionTime}`);
            }
        } catch (error) {
            console.error("Error extracting connection:", error);
        }
    }
}

async function sendMessage(driver, card) {
    try {
        const messageButton = await card.findElement(By.xpath(".//button[.//span[text()='Message']]"));
        await messageButton.click();

        // Wait for the message input box to be available
        await driver.wait(until.elementLocated(By.css("div.msg-form__contenteditable[contenteditable='true']")), 5000);
        const messageBox = await driver.findElement(By.css("div.msg-form__contenteditable[contenteditable='true']"));

        // Get the name of the person from the card
        const nameElement = await card.findElement(By.className('mn-connection-card__name'));
        const name = await nameElement.getText();

        // Send a customized message
        const customMessage = `Hey ${name.trim()}, great to connect with you!`;
        await messageBox.sendKeys(customMessage);

        await randomDelay();

        // // Find the send button and click it
        const sendButton = await driver.findElement(By.css("button.msg-form__send-button"));
        await sendButton.click();

        await randomDelay();

        // Try locating the close button in multiple ways
        // Find the close button using a CSS selector and click it
        const closeButtons = await driver.findElements(By.css("button.msg-overlay-bubble-header__control"));
        for (let button of closeButtons) {
            const innerText = await button.getText();
            if (innerText.includes("Close your")) {
                await button.click();

                // Wait briefly for the modal to possibly appear
                await driver.sleep(1000);

                // Check for the modal and click "Leave" if it appears
                try {
                    await driver.wait(until.elementLocated(By.css("button.artdeco-modal__confirm-dialog-btn")), 5000);
                    const leaveButton = await driver.findElement(By.xpath("//button/span[text()='Leave']/parent::button"));
                    await leaveButton.click();
                } catch (modalNotFoundError) {
                    // Modal not found, continue without error
                }
                
                break;
            }
        }

        return true;

    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
}
async function saveConnections(connections) {
    fs.writeFileSync('connections.json', JSON.stringify(connections, null, 2));
    console.log('Connections saved to connections.json');
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

        const connections = await extractConnections(driver);
        await saveConnections(connections);

    } catch (error) {
        console.error("Error during processing:", error);
    } finally {
        // Uncomment the line below when you're ready to quit the driver
        // await driver.quit();
    }
}

performTask();