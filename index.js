const puppeteer = require("puppeteer");
const fs = require("fs");
const papaparse = require("papaparse");

(async () => {
    const browser = await puppeteer.launch({ headless: true }); // Use headless mode
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // Set a viewport size

    try {
        await page.goto("https://www.yellowpages.com/milwaukee-wi/restaurants", {
            waitUntil: "domcontentloaded",
        });

        let data = [];

        while (true) {
            const entries = await page.evaluate(() => {
                const entryElements = document.querySelectorAll(".v-card");
                const entriesData = [];

                entryElements.forEach((entry) => {
                    const titleElement = entry.querySelector(".business-name");
                    const phoneElement = entry.querySelector(".phones.phone.primary");
                    const addressElement = entry.querySelector(".adr");

                    const title = titleElement ? titleElement.textContent : "N/A";
                    const phone = phoneElement ? phoneElement.textContent : "N/A";
                    const address = addressElement ? addressElement.textContent : "N/A";

                    entriesData.push({
                        title,
                        phone,
                        address,
                    });
                });

                return entriesData;
            });

            data = data.concat(entries);

            const nextPageButton = await page.$(".next.ajax-page");
            if (nextPageButton) {
                await nextPageButton.click();
                await page.waitForNavigation({ waitUntil: "domcontentloaded" });
            } else {
                break; // Exit the loop if there's no "Next Page" button
            }
        }

        // Save the data to a CSV file
        const csvData = papaparse.unparse(data);
        fs.writeFileSync("yellowpages_data.csv", csvData);

        data.forEach((item, index) => {
            console.log(`Entry ${index + 1}:`);
            console.log(`Title: ${item.title}`);
            console.log(`Phone: ${item.phone}`);
            console.log(`Address: ${item.address}`);
            console.log("-------------------");
        });
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    }
})();
