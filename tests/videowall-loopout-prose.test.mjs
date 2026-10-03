import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeHotelTvIo} from './hoteltv-w03004-history.mjs';
import {beforeSamsung115ManualSpecs} from './samsung-w03003-history.mjs';
import {beforeSamsungWhiteboard} from './samsung-w03006-history.mjs';
import {beforeAmxW03008,amxW03008Slug} from './amx-w03008-history.mjs';
import {beforeCrownW03009,crownW03009Slug} from './crown-w03009-history.mjs';
import {beforeJblW03010,jblW03010Slug} from './jbl-w03010-history.mjs';
import {beforeBssW03011,bssW03011Slug} from './bss-w03011-history.mjs';
import {beforeCrownW03013} from './crown-w03013-history.mjs';

const root=new URL('../',import.meta.url);
const evidence=JSON.parse(readFileSync(new URL('Work/기록/W-20261003-001-evidence.json',root),'utf8'));
const target=Object.keys(evidence.target);
const sha=x=>createHash('sha256').update(x).digest('hex');
const file=slug=>readFileSync(new URL(`beta/site/detail/data/${slug}.json`,root));
const product=slug=>JSON.parse(file(slug));
// Git stores these JSON blobs with LF, while Windows may check them out with CRLF.
const gitJsonBytes=bytes=>Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));
const sentences=text=>text.replace(/(\d)\.(\d)/g,'$1∶$2').split(/(?<=[.!?])\s+|\n+/).filter(Boolean);

test('only the two approved JSON files can change, and their protected fields stay identical',()=>{
  assert.deepEqual(target.sort(),['lh55vhcrbgbxkr','lh55vmcrbgbxkr']);
  for(const slug of target){
    const {lead,overview,korean,features,issues,...protectedCore}=product(slug);
    assert.equal(sha(JSON.stringify(protectedCore)),evidence.target[slug].protectedCoreSha256,`${slug}: protected product data`);
    const before=evidence.target[slug].before;
    assert.equal(features.length,before.features.length);
    for(const [index,feature] of features.entries())if(index!==3)assert.deepEqual(feature,before.features[index],`${slug}: other features`);
  }
  for(const [slug,expected] of Object.entries(evidence.otherProductSha256)){
    const historical=beforeCrownW03013(beforeBssW03011(beforeJblW03010(beforeCrownW03009(beforeAmxW03008(beforeHotelTvIo(beforeSamsung115ManualSpecs(beforeSamsungWhiteboard(product(slug),slug),slug),slug),slug),slug),slug),slug),slug);
    const bytes=slug.startsWith('hg')||slug==='lh115qhfebgxkr'||['lh55wmfwbgcxkr','lh75wmfwlgcxkr'].includes(slug)||amxW03008Slug(slug)||crownW03009Slug(slug)||jblW03010Slug(slug)||bssW03011Slug(slug) ? Buffer.from(JSON.stringify(historical,null,2)+'\n') : file(slug);
    assert.equal(sha(gitJsonBytes(bytes)),expected,`${slug}: unrelated Git JSON blob bytes`);
  }
});

test('both videowalls describe only DisplayPort loopout in all four prose locations',()=>{
  for(const slug of target){
    const p=product(slug);
    const fields={lead:p.lead,overview:p.overview,korean:p.korean,feature3:p.features[3].text};
    for(const [field,text] of Object.entries(fields)){
      for(const sentence of sentences(text)){
        assert.equal(/HDMI/i.test(sentence)&&/(데이지|루프아웃|loopout)/i.test(sentence),false,`${slug}: ${field}: ${sentence}`);
      }
      assert.match(text,/(DisplayPort|DP)/,`${slug}: ${field} names DP`);
      assert.match(text,/(데이지|루프아웃|loopout)/,`${slug}: ${field} names loopout`);
    }
    assert.equal(sentences(p.lead).length,2,`${slug}: two-sentence lead`);
    assert.equal((p.lead.match(/\*\*/g)||[]).length,2,`${slug}: one emphasis pair`);
    assert.match(p.korean,/최대 5x5/);
    assert.match(p.overview,/최대 5x5/);
    assert.match(p.features[3].text,/최대 5x5/);
    const max=p.specifications.find(x=>x.name==='데이지 체인 최대 구성');
    assert.equal(max?.value,'최대 5x5');
    assert.equal(max?.verification,'FOUND');
    assert.equal(max?.source,'P');
  }
});

test('the official marketing/manual conflict is retained without an inferred HDMI-to-DP path',()=>{
  for(const slug of target){
    const p=product(slug);
    const issue=p.issues.find(x=>x.code==='HDMI-LOOPOUT-CONFLICT');
    assert.ok(issue,`${slug}: conflict issue`);
    assert.equal(issue.status,'CONFLICTED');
    assert.match(issue.detail,/DisplayPort 1\.2 또는 HDMI를 사용하는 데이지 체인/);
    assert.match(issue.detail,/최대 5x5/);
    assert.match(issue.detail,/HDMI IN 1.*HDMI IN 2.*DP OUT \(LOOPOUT\)/);
    assert.match(issue.detail,/2026-10-03.*사용자/);
    for(const text of [p.lead,p.overview,p.korean,p.features[3].text])assert.doesNotMatch(text,/HDMI로.*DP로|HDMI.*입력 신호.*DP/i);
  }
});
