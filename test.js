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
async function connectWithFirst15People(driver) {
    try {
        // Wait for the list containing people cards to load
        await driver.wait(until.elementsLocated(By.css('ul.list-style-none li')), 10000);

        const peopleCards = await driver.findElements(By.css('ul.list-style-none li'));
        console.log(peopleCards, "cards");

        // Loop through the first 15 results
        for (let i = 0; i < Math.min(15, peopleCards.length); i++) {
            let attempts = 0;
            let connected = false;

            while (attempts < 3 && !connected) {
                try {
                    const card = peopleCards[i]; // Use the already fetched list

                    const connectButton = await card.findElement(By.xpath(".//button[contains(@aria-label, 'connect')]"));
                    await driver.wait(until.elementIsVisible(connectButton), 5000);
                    await driver.wait(until.elementIsEnabled(connectButton), 5000);

                    await connectButton.click();

                    const sendNowButton = await driver.wait(until.elementLocated(By.xpath("//button[@aria-label='Send now']")), 10000);
                    await driver.wait(until.elementIsVisible(sendNowButton), 5000);
                    await driver.wait(until.elementIsEnabled(sendNowButton), 5000);

                    await sendNowButton.click();

                    connected = true; // Mark as connected successfully

                    // Optional: wait for dialog to close before the next iteration
                    await driver.sleep(2000);

                } catch (error) {
                    if (error.name === 'StaleElementReferenceError') {
                        console.warn("StaleElementReferenceError: Retrying...");
                    } else {
                        console.error("Error sending connection invitation:", error);
                        break; // Break if error is not resolvable by retrying
                    }
                    attempts++;
                }

                // Wait between retries
                await driver.sleep(1000);
            }

            // Wait between actions to simulate human behavior
            await driver.sleep(3000);
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
        await connectWithFirst15People(driver);
    } catch (error) {
        console.error("Error during monitoring process:", error);

    }
}

performTask();