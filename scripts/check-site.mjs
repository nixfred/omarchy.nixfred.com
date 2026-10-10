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
    const doctor=data.plugins.find(p=>p.id==='nixfred.doctor');
    assert.ok(doctor&&doctor.version,'Omarchy Doctor missing from data.json');
    assert.equal((await page.locator('[id="p-nixfred.doctor"] h3').innerText()).replace(/\s+/g,' '),`Omarchy Doctor v${doctor.version}`);
    const alpha=data.plugins.filter(p=>p.status==='alpha');
    for(const p of alpha){
      const c=page.locator(`[id="p-${p.id}"]`);
      assert.equal(await c.locator('.tag.alpha').count(),1,`${p.name}: ALPHA tag`);
      assert.equal(await c.locator('.ver.alpha').count(),1,`${p.name}: ALPHA badge`);
      assert.ok(!(await c.getAttribute('class')).includes('is-quiet'),`${p.name}: alpha card is dimmed`);
    }
    assert.equal(await page.locator('#families .tag.alpha').count(),alpha.length);
    const bigs=[...data.plugins,...data.tools].filter(x=>x.alpha_big);
    assert.ok(bigs.length>=2,'Ringer and MOBS should be flagged alpha_big');
    assert.equal(await page.locator('.alpha-banner').count(),bigs.length,'one BIG ALPHA banner per alpha_big project');
    assert.equal(await page.locator('#tool-grid .tag.alpha').count(),data.tools.filter(t=>t.status==='alpha').length,'alpha tag on every alpha tool');
    assert.ok(!JSON.stringify(data).toLowerCase().includes('clarity'),'Clarity must never appear on the site');
    const forks=[...data.plugins,...data.tools].filter(x=>x.fork_of);
    assert.ok(forks.length>=30,'expected the fork entries');
    assert.equal(await page.locator('.fork-banner').count(),forks.length,'one FORK banner per fork, none on originals');
    for(const f of forks){
      const c=f.id?page.locator(`[id="p-${f.id}"]`):page.locator(`[id="t-${f.slug}"]`);
      assert.equal(await c.locator('.fork-banner').count(),1,`${f.name}: FORK banner`);
      assert.equal(await c.locator('.fork-banner a').first().getAttribute('href'),f.credit_url||`https://github.com/${f.fork_of}`,`${f.name}: banner links the original`);
      assert.match(await c.locator('.fork-banner').innerText(),new RegExp(f.fork_of.split('/')[0],'i'),`${f.name}: banner names the original author`);
    }
    assert.ok(await page.locator('[id="p-nixfred.glide"] .credit').count());
    // WHERE the results land matters as much as how many there are. The controls sit above the Featured block, and
    // the catalogue used to start ~6,000px below them, so a working filter looked broken. Measure the distance from
    // the search box to the first VISIBLE result card, and require Featured to step aside while filtering.
    const gap=()=>page.evaluate(()=>{const q=document.querySelector('#q').getBoundingClientRect();
      const r=[...document.querySelectorAll('#tool-grid article, #families article.card, #families .slot')].find(e=>e.offsetParent!==null);
      return r?r.getBoundingClientRect().top-q.bottom:null;});
    const featuredShown=()=>page.locator('#featured').isVisible();
    assert.equal(await featuredShown(),true,'Featured is shown when nothing is filtered');
    await page.locator('#chips [data-fam="alpha"]').click();
    assert.equal(await page.locator('#families article.card').count(),alpha.length,'the ALPHA chip lists exactly the alpha plugins');
    assert.equal(await page.locator('#tool-grid article').count(),data.tools.filter(t=>t.status==='alpha').length,'the ALPHA chip lists the alpha tools too');
    assert.equal(await featuredShown(),false,'Featured steps aside while a chip is active');
    assert.ok((await gap())<700,`ALPHA chip: first result is ${await gap()}px below the search box`);
    await page.locator('#chips [data-fam="workspace"]').click();
    assert.equal(await page.locator('#families article.card').count(),data.plugins.filter(p=>p.family==='workspace').length);
    assert.equal(await page.locator('#tools').isVisible(),false,'a family chip hides tools, which have no family');
    assert.ok((await gap())<700,`family chip: first result is ${await gap()}px below the search box`);
    await page.locator('#chips [data-fam="all"]').click();
    assert.equal(await featuredShown(),true,'Featured returns on All');
    assert.equal(await page.locator('#tools').isVisible(),true,'Tools return on All');
    await page.locator('#q').fill('flea');
    assert.equal(await page.locator('#tool-grid article').count(),1);
    assert.match(await page.locator('#tool-grid h3').innerText(),/Flea/);
    assert.equal(await featuredShown(),false,'Featured steps aside while searching');
    assert.ok((await gap())<700,`search: first result is ${await gap()}px below the search box`);
    await page.locator('#q').fill('zzzqqq');
    assert.match(await page.locator('#families').innerText(),/Nothing matches/,'a query with no hits says so');
    assert.equal(await page.locator('#tools').isVisible(),false,'Tools hide when nothing matches');
    await page.locator('#q').fill('doctor');
    assert.ok(await page.locator('#families article.card').count()>=1);
    const card=page.locator('[id="p-nixfred.doctor"]');
    await card.locator('summary').click();
    const install=card.locator('[data-cmd]').first();
    const command=await install.getAttribute('data-cmd');
    await install.click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),command);
    assert.equal(command,'omarchy plugin add https://github.com/nixfred/omarchy-doctor.git --enable');
    await page.locator('#q').fill('alpha');
    assert.equal(await page.locator('#families article.card').count(),alpha.length,'search "alpha" should list exactly the alpha cards');
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
