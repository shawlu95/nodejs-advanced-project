const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('when logged in', async () => {
  beforeEach(async () => {
    await page.login('http://localhost:3000/blogs');
    await page.click('a.btn-large');
  });

  it('displays blog-create form after logging in', async () => {
    const label = await page.getContentsOf('form label');
    expect(label).toEqual('Blog Title');
  });
});
