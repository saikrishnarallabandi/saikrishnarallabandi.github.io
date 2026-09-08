"use strict";
(() => {
  const $=id=>document.getElementById(id),n=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
  const snapshotURL=new URL('overview-snapshot.json',document.currentScript.src);
  let lastExample='';
  function example(data) {
    const key=JSON.stringify(data);if(key===lastExample)return;lastExample=key;
    const host=$('home-example');host.replaceChildren();
    if(!data){host.append(n('p','No active written narrative with linked stories is currently available.','subtitle'));return;}
    host.append(n('h3','1. What the articles report','example-stage-title'),n('p','These are publisher headlines, retained with links to their sources.','subtitle'));
    const reporting=n('div','','home-example-grid example-three'),events=n('div','','home-example-grid example-three');
    for(const story of data.stories) {
      const group=n('div','','example-report-group'),account=n('div','','home-example-story');
      group.append(n('h4',story.label));
      for(const source of story.sources) {
        const record=n('div','','home-example-source'),title=n('p',source.title);
        record.append(n('p',source.source,'eyebrow'));
        try {const u=new URL(source.url);if(['https:','http:'].includes(u.protocol)){const link=n('a',source.title);link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';title.replaceChildren(link);}} catch {}
        record.append(title);group.append(record);
      }
      account.append(n('p',story.label,'eyebrow'),n('h4',story.title));
      const detail=n('details','','example-account');detail.append(n('summary','Read the generated account'),n('p',story.hypothesis||'No account written yet.'));account.append(detail);
      reporting.append(group);events.append(account);
    }
    host.append(reporting,n('p','↓ Group reports about each event','example-connector'));
    host.append(n('h3','2. The stories those reports belong to','example-stage-title'),n('p','Each story follows an event. More articles about that event add coverage, rather than creating a new event.','subtitle'),events);
    host.append(n('p','↓ Relate distinct developments','example-connector'),n('h3','3. The connection Sangraha proposes','example-stage-title'));
    const plain=n('div','','example-plain');plain.append(n('p','THE CONNECTION, IN PLAIN LANGUAGE','eyebrow'),n('p',data.explanation));host.append(plain);
    const interpretation=n('div','','home-example-claim');
    interpretation.append(n('p','NARRATIVE','eyebrow'),n('h3',data.narrative.title),n('p',data.narrative.thesis));
    host.append(interpretation,n('p','This is a proposed interpretation, not an established fact. The source links above let a reader inspect the reporting behind this example.','subtitle'));
    const challenge=n('details','','home-explainer');challenge.append(n('summary','What would challenge this claim?'),n('p',data.narrative.falsifier||'No falsifier was recorded.','subtitle'));host.append(challenge);
    host.append(n('p',`All ${data.stories.length} member stories are illustrated, with two selected source reports per story. Multiple reports of the same event do not count as independent developments. This is a saved example, not a live feed.`,'subtitle'));

  }
  async function loadSnapshot() {
    try {
      const r=await fetch(snapshotURL);if(!r.ok)throw new Error();const d=await r.json();
      for(const [id,value] of [['records',d.records],['stories',d.stories],['active',d.narrative_activity.active||0],['narratives',d.written_narratives]])$('home-'+id).textContent=value.toLocaleString();
      const at=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',dateStyle:'medium',timeStyle:'short'}).format(new Date(d.checked_at));
      $('home-status').textContent=`Snapshot captured ${at} CT · These are recorded counts, not live totals`;
      $('home-candidates').textContent=`${d.news_records.toLocaleString()} news records · ${d.candidates.toLocaleString()} groups awaiting a written thesis (${(d.candidate_activity.active||0).toLocaleString()} active candidates at capture). Counts include retained history.`;
      example(d.example);
      const v=d.revision,revision=$('home-revision');
      if(v&&revision){
        const when=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',dateStyle:'medium',timeStyle:'short'}).format(new Date(v.at));
        revision.append(n('p',`Recorded assessment · ${when} CT`,'subtitle'));
        const grid=n('div','','revision-grid');
        for(const [label,text] of [['Earlier wording',v.before],['Revised wording',v.after]]) {const a=n('article');a.append(n('p',label,'eyebrow'),n('p',text));grid.append(a);}
        revision.append(grid,n('p',v.explanation,'subtitle'));
        const why=n('details','','home-explainer');why.append(n('summary','Read the recorded assessment reason'),n('p',v.reason,'subtitle'));revision.append(why);
        revision.append(n('p','This is a saved model revision, shown to illustrate how a claim is maintained. It does not independently establish the underlying news.','subtitle'));
      }
    } catch {$('home-status').textContent='The saved example and counts could not be loaded. Please reload the page.';}
  }
  loadSnapshot();
})();
