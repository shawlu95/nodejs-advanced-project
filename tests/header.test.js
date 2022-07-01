const puppeteer = require('puppeteer');

let browser, page;

beforeEach(async () => {
  // don't forget the empty object, we can add options to it
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

it('launches a new browser instance', async () => {
  // puppeteer serialize the code into str and communicate it to browser
  // const func = (el) => el.innerHTML
  // func.toString() returns "(el) => el.innerHTML"
  // dollar sign is part of func name, nothing special about it
  const text = await page.$eval('a.brand-logo', (el) => el.innerHTML);

  // returned is also a str
  expect(text).toEqual('Blogster');
});

it('clicks login with google', async () => {
  // click the ul with class=right, click on <a> tag
  await page.click('.right a');

  // use regex to check that domain is correct
  expect(page.url()).toMatch(/accounts\.google\.com/);
});
