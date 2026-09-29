
const fs = require("fs");
const baseUrl = "https://hueglam.com/cdn/shopifycloud/checkout-web/assets/c1/assets/";
const files = [
  "upi.svg", "visa.svg", "mastercard.svg", "netbanking.svg", "rupay.svg",
  "paytm.svg", "amex.svg", "american_express.svg", "maestro.svg"
];
const check = async (file) => {
  const res = await fetch(baseUrl + file);
  console.log(file, res.status);
};
Promise.all(files.map(check)).then(() => console.log("Done"));

