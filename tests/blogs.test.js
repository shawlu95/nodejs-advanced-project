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

  describe('using invalid blog input', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    it('shows error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');
      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });

  describe('using valid blog input', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'Test Blog Title');
      await page.type('.content input', 'Test Blog Content');
      await page.click('form button');
    });

    it('takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    it.skip('takes user to review screen and submits', async () => {
      await page.click('button.green');

      // need to wait for action to be completed (use any element from the result page)
      // then check the existance of new blog, first one because user is new
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('Test Blog Title');
      expect(content).toEqual('Test Blog Content');
    });
  });
});

describe('when not logged in', async () => {
  it('cannot create blog', async () => {
    const result = await page.evaluate(async () => {
      return fetch('/api/blogs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Fetch', content: 'My content' }),
      }).then((res) => res.json());
    });
    expect(result.error).toEqual('You must log in!');
  });

  it('cannot read blogs', async () => {
    const result = await page.evaluate(async () => {
      return fetch('/api/blogs', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    });
    expect(result.error).toEqual('You must log in!');
  });
});
