require("dotenv").config();
const fs = require('fs');
const { Builder, By, until ,Key} = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require('path');
const email = process.env.EMAIL;
const password = process.env.PASSWORD;

async function initializeDriver() {
    let options = new chrome.Options();
    // Uncomment the lines below if you want to run Chrome in headless mode
    // options.addArguments("--headless");
    // options.addArguments("--disable-gpu");
    // options.addArguments("--no-sandbox");
    // options.addArguments("--disable-dev-shm-usage");
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

        await driver.wait(until.urlContains('feed'), 10000);

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
async function clickAddMediaButtonAndUploadImage(driver, imagePath) {
    try {
        // Click the 'Add media' button
        await driver.wait(until.elementLocated(By.css("button[aria-label='Add media']")), 10000);
        // const addMediaButton = await driver.findElement(By.css("button[aria-label='Add media']"));
        // await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", addMediaButton);
        // await addMediaButton.click();

        // console.log("Successfully clicked the 'Add media' button.");

        // Wait for the file input to be visible and upload the image
        await driver.wait(until.elementLocated(By.css("input[type='file']")), 10000);
        const fileInput = await driver.findElement(By.css("input[type='file']"));
        console.log(fileInput,"found")
        // await fileInput.sendKeys(imagePath);

        console.log("Image uploaded successfully.");
        await driver.actions().keyDown(Key.ALT).sendKeys(Key.F4).keyUp(Key.ALT).perform();

        console.log("Dialog closed with Alt + F4.");
        // Wait for any subsequent button you need to click
        await driver.wait(until.elementLocated(By.css("button[data-control-name='primary-action']")), 10000);
        const nextButton = await driver.findElement(By.css("button[data-control-name='primary-action']"));
        await nextButton.click();

        console.log("Successfully clicked the 'Next' button.");
        
    } catch (error) {
        console.error("Error during image upload and navigation:", error);
    }
}
async function performTask() {
    const driver = await initializeDriver();
    const imagePath = path.resolve('./1.jpg'); // Assuming 'example.jpg' is in the root directory

    try {
        if (fs.existsSync('cookies.json')) {
            await loadCookies(driver);
            await driver.get('https://www.linkedin.com/feed');
        } else {
            await performLogin(driver);
        }

        await clickAddMediaButtonAndUploadImage(driver, imagePath);
    } catch (error) {
        console.error("Error during processing:", error);
    } finally {
        // await driver.quit();
    }
}


performTask();