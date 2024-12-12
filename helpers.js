async function randomDelay() {
    const delay = Math.floor(Math.random() * 5000) + 1000;  // Random delay between 1000ms (1s) and 5000ms (5s)
    return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports={randomDelay}