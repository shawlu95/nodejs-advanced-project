const puppeteer = require('puppeteer');

it('ok', () => {
  const two = 1 + 1;
  expect(two).toEqual(2);
});

it('launches a new browser instance', async () => {
  jest.useFakeTimers();
  // don't forget the empty object, we can add options to it
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // puppeteer serialize the code into str and communicate it to browser
  // const func = (el) => el.innerHTML
  // func.toString() returns "(el) => el.innerHTML"
  const text = await page.$eval('a.brand-logo', (el) => el.innerHTML); // dollar sign is part of func name

  // returned is also a str
  expect(text).toEqual('Blogster');
});
