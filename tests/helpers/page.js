const puppeteer = require('puppeteer');
const getSession = require('../factories/session');
const getUser = require('../factories/user');

class TestPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Create a Page, a TestPage, combine them
   * usign a proxy */
  static async build() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const testPage = new TestPage(page);
    const proxy = new Proxy(testPage, {
      // target is same as testPage (first arg in proxy constructor)
      // we can also close browser by issuing command to proxy
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
    return proxy;
  }

  async login() {
    // my mongo id (google OAuth authenticated)
    const _id = '62bbe449c5889fd87cda9b2f';
    const user = await getUser({ _id });
    const { session, sig } = getSession(user);

    // check Chrome, inspect Application => Cookies to see the expected names
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });

    // check cookie if curious
    // console.log(await this.page.cookies());

    // refresh page, simulate logging into application
    await this.page.goto('http://localhost:3000');

    // cannot assert immedaitely, must wait for browser to finish loading
    // test would fail at this line if not found
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    // puppeteer serialize the code into str and communicate it to browser
    // const func = (el) => el.innerHTML
    // func.toString() returns "(el) => el.innerHTML"
    // dollar sign is part of func name, nothing special about it
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
}

module.exports = TestPage;
