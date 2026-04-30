const { chromium } = require('playwright');

async function testWebsite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = {
    pages: {},
    consoleErrors: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) {
      results.consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('=== Comprehensive Website Test ===\n');

    // Test all pages
    const pagesToTest = [
      { name: 'Entry', url: 'https://lyang0613.github.io/lottery-system/' },
      { name: 'Lottery', url: 'https://lyang0613.github.io/lottery-system/lottery' },
      { name: 'Admin', url: 'https://lyang0613.github.io/lottery-system/admin' },
      { name: 'Winners', url: 'https://lyang0613.github.io/lottery-system/winners' }
    ];

    for (const p of pagesToTest) {
      console.log(`${p.name} Page:`);
      console.log(`  URL: ${p.url}`);

      await page.goto(p.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const buttons = await page.locator('button').count();
      const inputs = await page.locator('input').count();
      const appContent = await page.evaluate(() => {
        const app = document.querySelector('#app');
        return app ? app.innerHTML.length : 0;
      });

      // Check page title
      const title = await page.title();

      results.pages[p.name] = { buttons, inputs, appContent };

      console.log(`  Title: "${title}"`);
      console.log(`  Buttons: ${buttons}, Inputs: ${inputs}`);
      console.log(`  Vue Content: ${appContent} chars`);
      console.log(`  Status: ${appContent > 100 ? 'PASS' : 'FAIL'}`);
      console.log('');

      // Screenshot
      await page.screenshot({
        path: `/Users/liuyang/ITProject/抽奖系统/test-${p.name.toLowerCase()}.png`,
        fullPage: true
      });
    }

    // Summary
    console.log('=== Summary ===');
    let allPassed = true;
    for (const [name, data] of Object.entries(results.pages)) {
      const passed = data.appContent > 100;
      if (!passed) allPassed = false;
      console.log(`${name}: ${passed ? 'PASS' : 'FAIL'} (${data.buttons} buttons, ${data.inputs} inputs)`);
    }

    if (results.consoleErrors.length > 0) {
      console.log('\n=== JavaScript Errors ===');
      results.consoleErrors.forEach(e => console.log(`  - ${e}`));
    } else {
      console.log('\n=== No JavaScript Errors ===');
    }

    console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testWebsite();
