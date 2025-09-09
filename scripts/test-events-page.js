// Test if events page loads
const puppeteer = require('puppeteer')

async function testEventsPage() {
  let browser
  try {
    console.log('Starting browser...')
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    
    console.log('Navigating to events page...')
    await page.goto('http://localhost:3000/admin/events', { waitUntil: 'networkidle2' })
    
    // Check if page loads
    const title = await page.title()
    console.log('Page title:', title)
    
    // Check for any error messages
    const errorElements = await page.$$('[data-testid="error"], .error, [class*="error"]')
    if (errorElements.length > 0) {
      console.log('Found error elements:', errorElements.length)
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].evaluate(el => el.textContent)
        console.log('Error text:', text)
      }
    }
    
    // Check if events are loading
    const loadingElements = await page.$$('[class*="skeleton"], [class*="loading"]')
    console.log('Loading elements found:', loadingElements.length)
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000)
    
    // Check for events
    const eventCards = await page.$$('[class*="card"]')
    console.log('Event cards found:', eventCards.length)
    
  } catch (error) {
    console.error('Error testing events page:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

testEventsPage()
