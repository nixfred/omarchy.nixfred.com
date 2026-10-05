// Exercise the rendered site's public UI at desktop and phone widths.
// Usage: node scripts/check-site.mjs [URL] [optional screenshot directory]
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.argv[2] || 'http://127.0.0.1:8899/';
const shots = process.argv[3];
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
  for (const width of [1440,390,320]) {
    const context = await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(url).origin});
    const page = await context.newPage();
    const errors=[];const failed=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(new URL(url).origin) && r.status()>=400)failed.push([r.status(),r.url()]);});
    await page.goto(url,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__appReady===true);
    const data=await page.evaluate(async()=>await (await fetch('data.json')).json());
    assert.equal(await page.locator('#families article.card').count(),data.plugins.length);
    assert.equal(await page.locator('#tool-grid article').count(),data.tools.length);
    assert.ok(data.plugins.some(p=>p.id==='nixfred.doctor'&&p.version==='1.6.0'));
    assert.equal((await page.locator('[id="p-nixfred.doctor"] h3').innerText()).replace(/\s+/g,' '),'Omarchy Doctor v1.6.0');
    assert.ok(await page.locator('[id="p-nixfred.glide"] .credit').count());
    await page.locator('#chips [data-fam="workspace"]').click();
    assert.equal(await page.locator('#families article.card').count(),data.plugins.filter(p=>p.family==='workspace').length);
    await page.locator('#chips [data-fam="all"]').click();
    await page.locator('#q').fill('flea');
    assert.equal(await page.locator('#tool-grid article').count(),1);
    assert.match(await page.locator('#tool-grid h3').innerText(),/Flea/);
    await page.locator('#q').fill('doctor');
    assert.ok(await page.locator('#families article.card').count()>=1);
    const card=page.locator('[id="p-nixfred.doctor"]');
    await card.locator('summary').click();
    const install=card.locator('[data-cmd]').first();
    const command=await install.getAttribute('data-cmd');
    await install.click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),command);
    assert.equal(command,'omarchy plugin add https://github.com/nixfred/omarchy-doctor.git --enable');
    await page.locator('#q').fill('');
    assert.equal(await page.locator('#families article.card').count(),data.plugins.length);
    const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth,width:innerWidth}));
    assert.ok(overflow.body<=width,`horizontal overflow at ${width}: ${JSON.stringify(overflow)}`);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    if(shots)await page.screenshot({path:`${shots}/site-${width}.png`,fullPage:false});
    console.log(JSON.stringify({url,width,plugins:data.plugins.length,tools:data.tools.length,errors,failed,overflow,search:true,familyFilter:true,details:true,clipboard:true}));
    await context.close();
  }
} finally {await browser.close();}
