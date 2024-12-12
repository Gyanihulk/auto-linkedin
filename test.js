require("dotenv").config();

const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const email = process.env.EMAIL;
const password = process.env.PASSWORD;




async function initializeDriver() {
    let options = new chrome.Options();
    // Add Chrome options as needed
    // options.addArguments("--headless"); // Running in headless mode
    // options.addArguments("--disable-gpu"); // Disabling GPU hardware acceleration
    // options.addArguments("--no-sandbox"); // Disabling the sandbox for running untrusted code
    // options.addArguments("--disable-dev-shm-usage"); // Overcome limited resource problems
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
        // Locate the email and password input fields
        const emailField = await driver.findElement(By.id('username'));
        const passwordField = await driver.findElement(By.id('password'));

        // Enter the email and password retrieved from environment variables
        await emailField.sendKeys(email);
        await passwordField.sendKeys(password);

        // Locate the submit button and click it
        const loginButton = await driver.findElement(By.xpath("//button[@type='submit']"));
        await loginButton.click();

        // Optionally, wait for a certain element to ensure login success
        await driver.wait(until.urlContains('feed'), 10000); // waits until URL changes to LinkedIn feed
    } catch (error) {
        console.error("Error during login process:", error);
    }
}
async function searchAndSelectPeopleCategory(driver) {
    try {
        // Locate the search bar and enter the search term
        const searchBar = await driver.findElement(By.xpath("//input[@placeholder='Search']"));
        await searchBar.sendKeys('software engineers');
        await searchBar.sendKeys(Key.RETURN);

        // Wait for the search results to load and the filter options to be available
        await driver.wait(until.elementLocated(By.xpath("//button[text()='People']")), 10000);

        // Click the People category filter
        const peopleButton = await driver.findElement(By.xpath("//button[text()='People']"));
        await peopleButton.click();

        // Wait for the page to load or perform further actions if needed
        await driver.wait(until.urlContains('search/results/people'), 10000);
    } catch (error) {
        console.error("Error during search and selection process:", error);
    }
}
let peopleConnected=0
async function connectWithFirst10People(driver) {
    try {
        // Wait for the cards to load
        await driver.wait(until.elementsLocated(By.css('ul.list-style-none li')), 10000);

        const peopleCards = await driver.findElements(By.css('ul.list-style-none li'));
        console.log(`Found ${peopleCards.length} people cards.`);

        let peopleConnected = 0;

        for (let i = 0; i < peopleCards.length && peopleConnected < 10; i++) {
            console.log(`Processing card ${i + 1}`);
            let attempts = 0;
            let connected = false;

            while (attempts < 3 && !connected) {
                try {
                    const card = peopleCards[i];
                    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", card);

                    const connectButton = await card.findElement(By.xpath(".//button[.//span[text()='Connect']]"));
                    console.log(`Connect button found for card ${i + 1}`);

                    await driver.executeScript("arguments[0].click();", connectButton);
                    console.log(`Clicked connect button on card ${i + 1}`);

                    const sendButton = await driver.wait(until.elementLocated(By.xpath("//button[.//span[text()='Send']]")), 10000);
                    await driver.wait(until.elementIsVisible(sendButton), 5000);
                    await driver.wait(until.elementIsEnabled(sendButton), 5000);

                    await sendButton.click();
                    console.log(`Clicked send button for card ${i + 1}`);

                    connected = true;
                    peopleConnected++;
                    console.log(`Successfully connected with card ${i + 1} (${peopleConnected}/10)`);
                    await driver.sleep(2000);
                } catch (error) {
                    if (error.name === 'ElementClickInterceptedError') {
                        console.warn(`ElementClickInterceptedError: Retrying card ${i + 1}`);
                    } else if (error.name === 'StaleElementReferenceError') {
                        console.warn(`StaleElementReferenceError: Retrying card ${i + 1}`);
                    } else {
                        console.error(`Error sending connection invitation for card ${i + 1}:`, error);
                        break;  // Exit attempts for this card.
                    }
                    attempts++;
                }
                await driver.sleep(1000);  // Wait between retries
            }
            await driver.sleep(3000);  // Pause between user interactions
        }
    } catch (error) {
        console.error("Error while connecting with people:", error);
    }
}
async function performTask() {
    const driver = await initializeDriver();
    try {
        await openLinkedIn(driver);
        await performLogin(driver);
        await searchAndSelectPeopleCategory(driver);
        await connectWithFirst10People(driver);
    } catch (error) {
        console.error("Error during monitoring process:", error);

    }
}

performTask();