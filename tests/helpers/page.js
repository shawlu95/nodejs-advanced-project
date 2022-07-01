const puppeteer = require('puppeteer');

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
}

module.exports = TestPage;
