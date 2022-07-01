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
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

it('clicks login with google', async () => {
  // click the ul with class=right, click on <a> tag
  await page.click('.right a');

  // use regex to check that domain is correct
  expect(page.url()).toMatch(/accounts\.google\.com/);
});

it('shows logout button after signing in', async () => {
  await page.login();

  // pull the element by href property
  // can try it out in chrome console: $('a[href="/auth/logout"')
  const text = await page.getContentsOf('a[href="/auth/logout"]');
  expect(text).toEqual('Logout');
});
