const puppeteer = require('puppeteer');
const getSession = require('./factories/session');
const getUser = require('./factories/user');
const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
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

it('shows logout button after signing in', async () => {
  // my mongo id (google OAuth authenticated)
  const _id = '62bbe449c5889fd87cda9b2f';
  const user = await getUser({ _id });
  const { session, sig } = getSession(user);

  // check Chrome, inspect Application => Cookies to see the expected names
  await page.setCookie({ name: 'session', value: session });
  await page.setCookie({ name: 'session.sig', value: sig });

  // check cookie if curious
  // console.log(await page.cookies());

  // refresh page, simulate logging into application
  await page.goto('http://localhost:3000');

  // cannot assert immedaitely, must wait for browser to finish loading
  // test would fail at this line if not found
  await page.waitFor('a[href="/auth/logout"]');

  // pull the element by href property
  // can try it out in chrome console: $('a[href="/auth/logout"')
  const text = await page.$eval('a[href="/auth/logout"]', (el) => el.innerHTML);
});
