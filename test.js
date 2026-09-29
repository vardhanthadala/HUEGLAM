
const fs = require("fs");
const path = require("path");

const baseUrl = "https://cdn.shopify.com/shopifycloud/shopify/assets/payment_icons/";
const files = [
  "netbanking.svg", "rupay.svg", "paytm.svg", "american_express.svg",
  "maestro.svg", "airtel_money.svg", "amazon.svg", "amazon_pay.svg",
  "mobikwik.svg", "hdfc.svg", "freecharge.svg", "ola_money.svg",
  "hsbc.svg", "visa.svg", "master.svg"
];

const checkAndDownload = async (file) => {
  try {
    const res = await fetch(baseUrl + file);
    if (res.status === 200) {
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(path.join("public", "payment-logos", "shopify_" + file), Buffer.from(buffer));
      console.log("Downloaded", file);
    } else {
      console.log("Failed", file, res.status);
    }
  } catch(e) { console.error(e.message) }
};

Promise.all(files.map(checkAndDownload)).then(() => console.log("Done"));

