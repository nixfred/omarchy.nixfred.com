import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function runBuild(mode: string) {
  const root=mkdtempSync(join(tmpdir(),'omarchy-catalog-test-'));
  try {
    for (const p of ['scripts','data','site/assets/css','site/assets/js','site/assets/img/family','bin']) mkdirSync(join(root,p),{recursive:true});
    copyFileSync(new URL('build.ts',import.meta.url),join(root,'scripts/build.ts'));
    writeFileSync(join(root,'data/plugins.json'),JSON.stringify({owner:'example',families:[{id:'system',name:'System',blurb:''}],plugins:[{id:'example.widget',name:'Widget',repo:'example/widget',family:'system',status:'live',version:'0.1.0',install:null}],tools:[],themes:[],retired:[]}));
    writeFileSync(join(root,'site/data.json'),'previous public build');
    writeFileSync(join(root,'site/index.html'),'<link href="assets/css/style.css"><script src="assets/js/app.js"></script>');
    writeFileSync(join(root,'site/assets/css/style.css'),'body{}');
    writeFileSync(join(root,'site/assets/js/app.js'),'void 0;');
    writeFileSync(join(root,'site/assets/img/family/system.svg'),'<svg/>');
    writeFileSync(join(root,'scripts/mock-fetch.ts'),'globalThis.fetch = async () => {throw new Error("registry unavailable")};');
    writeFileSync(join(root,'bin/gh'),`#!/usr/bin/env python3
import json,sys,os,base64
path=sys.argv[2]
mode=os.environ['CATALOG_TEST_MODE']
if path=='graphql':
 print(json.dumps({'data':{'user':{'contributionsCollection':{'contributionCalendar':{'totalContributions':0,'weeks':[]}}}}}))
elif path.endswith('example/widget'):
 if mode=='missing':sys.exit(1)
 print(json.dumps({'visibility':'private' if mode=='private' else 'public','private':mode=='private','default_branch':'main'}))
elif '/contents/' in path:
 m={'id':'wrong.widget' if mode=='bad-manifest' else 'example.widget','version':'1.2.0'}
 print(json.dumps({'content':base64.b64encode(json.dumps(m).encode()).decode()}))
else:print('[]')
`,{mode:0o755});
    const result=spawnSync(process.execPath,['--preload',join(root,'scripts/mock-fetch.ts'),join(root,'scripts/build.ts')],{env:{...process.env,PATH:join(root,'bin')+':'+process.env.PATH,CATALOG_TEST_MODE:mode},encoding:'utf8',timeout:30000});
    return {status:result.status,output:readFileSync(join(root,'site/data.json'),'utf8'),stderr:result.stderr};
  } finally {rmSync(root,{recursive:true,force:true});}
}
for (const mode of ['private','missing','bad-manifest']) test(`build refuses ${mode} source without replacing previous output`,()=>{
  const r=runBuild(mode);expect(r.status).not.toBe(0);expect(r.output).toBe('previous public build');
});
test('public build uses committed version, keeps null install, and reports unknown listing on registry failure',()=>{
  const r=runBuild('public');expect(r.status).toBe(0);
  const d=JSON.parse(r.output);expect(d.plugins[0].version).toBe('1.2.0');expect(d.plugins[0].install).toBeNull();expect(d.plugins[0].listed).toBeNull();expect(d.registry_checked).toBe(false);expect(d.plugins[0].glyph).toBe('assets/img/family/system.svg');
});
