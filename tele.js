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
    await driver.get("https://telegram.org/");

}

async function performTask() {
    const driver = await initializeDriver();
    try {
        await openLinkedIn(driver);
    
    } catch (error) {
        console.error("Error during monitoring process:", error);

    }
}

performTask();