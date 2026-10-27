(function(){
 'use strict';
 const names={clay:'Clay',modal:'Modal',decagon:'Decagon',baseten:'Baseten',hearth:'Hearth',watershed:'Watershed',august:'August',siro:'Siro',dualentry:'DualEntry',langchain:'LangChain'};
 const slug=location.pathname.split('/').filter(Boolean)[0];
 if(!Object.hasOwn(names,slug)) return;
 document.body.dataset.company=slug;
 document.title='GTM portfolio for '+names[slug]+' · CJ Wheelock';
 const api=(window.GTM_API_ORIGIN||'').replace(/\/$/,'');
 const gate=document.getElementById('gate'), shell=document.getElementById('shell');
 const form=document.getElementById('login'), error=document.getElementById('error'), password=document.getElementById('password');
 document.getElementById('company-name').textContent=names[slug];
 let token='', data=null, chosen='', reviewed=new Set();
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>'$'+Number(n).toLocaleString('en-US');
 const request=async (route,options={})=>{
   const headers={...(options.headers||{})};
   if(token) headers.Authorization='Bearer '+token;
   return fetch(api+route,{...options,headers,cache:'no-store',referrerPolicy:'no-referrer'});
 };
 async function signIn(event){
   event.preventDefault(); error.textContent='';
   const submit=form.querySelector('button');submit.disabled=true;submit.textContent='Opening…';
   try{
     const response=await request('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:slug,password:password.value})});
     const result=await response.json();
     if(!response.ok) throw new Error(result.error||'Unable to open this page.');
     token=result.token;
     const dashboard=await request('/api/'+slug+'/dashboard');
     if(!dashboard.ok) throw new Error('Unable to load this page.');
     data=await dashboard.json();password.value='';render();
     gate.classList.add('hidden');shell.classList.remove('hidden');
     document.getElementById('heading').focus({preventScroll:true});
   }catch(err){token='';error.textContent=err.message||'Unable to connect. Please try again.'}
   finally{submit.disabled=false;submit.textContent='Open'}
 }
 form.addEventListener('submit',signIn);
 function render(){
   const d=data;
   shell.innerHTML=`
    <aside class="sidebar"><div class="brand"><span class="mark">CJ</span><span><strong>GTM portfolio</strong><small>${escape(d.name)} · CJ Wheelock</small></span></div>
      <nav class="nav-group" aria-label="Page sections"><div class="nav-label">Explore</div><a class="current" href="#overview">Overview</a><a href="#workflow">Workflow</a><a href="#workbench">Interactive lab</a><a href="#roadmap">30 / 60 / 90</a><a href="#about">About CJ</a></nav>
      <div class="side-bottom">Built for ${escape(d.name)}<br><button type="button" id="logout">Sign out</button></div></aside>
    <main class="main"><div class="topbar"><div class="crumb">Portfolio / <b>${escape(d.name)}</b></div><span class="tag"><span class="dot"></span>Synthetic data</span></div>
    <div class="page"><section id="overview" class="hero section"><div><div class="eyebrow">${escape(d.role)}</div><h1 id="heading" tabindex="-1">Here’s what I’d build for ${escape(d.name)}.</h1><p>${escape(d.profile)}</p></div><div class="hero-note"><b>The opportunity</b>${escape(d.opportunity)}</div></section>
    <section class="section" aria-labelledby="metrics-heading"><div class="section-head"><div><h2 id="metrics-heading">A revenue lens</h2><p>Computed from the fictional records in the interactive lab below.</p></div><div class="section-note">No real accounts, results or integrations</div></div><div class="grid metrics" id="metrics"></div><div class="opportunity"><div class="card analysis"><div class="eyebrow">Context</div><h3>${escape(d.opportunity)}</h3><p>${escape(d.product)}</p></div><div class="card hypothesis"><strong>Hypothesis to test</strong><p>${escape(d.hypothesis)}</p></div></div></section>
    <section id="workflow" class="section"><div class="section-head"><div><h2>From signal to action</h2><p>A proposed workflow with review built into the handoff.</p></div></div><div class="steps">${d.stages.map((v,i)=>`<div class="card step"><span class="step-number">0${i+1}</span><b>${escape(v)}</b></div>`).join('')}</div></section>
    <section class="section"><div class="section-head"><div><h2>${escape(d.module)}</h2><p>Explore a company-specific workflow with fictional inputs.</p></div><span class="tag"><span class="dot"></span>Interactive · synthetic</span></div><div class="card scenario" id="scenario"></div></section>
    <section id="workbench" class="section"><div class="section-head"><div><h2>Prioritization workspace</h2><p>Adjust the model, filter the fictional records and select a row.</p></div></div><div class="card workbench"><div class="workbench-top"><div><h3>Fictional records</h3><p>Illustrative scores and values; no live systems are connected.</p></div><span class="fine" id="result-count"></span></div>
      <div class="controls"><div class="control"><label for="segment">${escape(d.dimension)}</label><select id="segment"><option value="all">All segments</option>${d.segments.map(x=>`<option value="${escape(x)}">${escape(x)}</option>`).join('')}</select></div><div class="control"><label for="weight"><span>${escape(d.fit_label)} weight</span><output id="weight-out">50%</output></label><input id="weight" type="range" min="0" max="100" value="50"><small>Remaining weight: ${escape(d.intent_label)}</small></div><div class="control"><label for="threshold"><span>Minimum score</span><output id="threshold-out">70</output></label><input id="threshold" type="range" min="0" max="100" value="70"><small>Only qualifying rows contribute to the totals.</small></div></div>
      <div class="table-wrap"><table><thead><tr><th>Record</th><th>${escape(d.dimension)}</th><th>Observed signal</th><th>Score</th><th>Stage</th><th>Potential / yr</th></tr></thead><tbody id="rows"></tbody></table></div><div class="detail" id="detail"></div></div></section>
    <section class="section split"><div class="card panel"><h3>Illustrative funnel</h3><p class="fine">Cumulative stages among records meeting the current score.</p><div id="funnel"></div></div><div class="card panel"><h3>AI opportunities</h3><ul class="list">${d.automations.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></div></section>
    <section id="roadmap" class="section"><div class="section-head"><div><h2>A 30 / 60 / 90-day approach</h2><p>Start with a baseline, test a focused workflow, then learn from adoption.</p></div></div><div class="grid roadmap">${d.roadmap.map((x,i)=>`<article class="card"><small>Days ${['01–30','31–60','61–90'][i]}</small><h3>${['Understand','Build and test','Measure and improve'][i]}</h3><p>${escape(x)}</p></article>`).join('')}</div></section>
    <section id="about" class="section"><div class="card profile"><div><div class="eyebrow">About CJ</div><h3>Builder. Seller. Systems thinker.</h3><p>${escape(d.fit)}</p><div class="profile-actions"><button class="primary" id="download-pdf" type="button">Download résumé · PDF</button><button class="secondary" id="download-docx" type="button">Word</button><a class="secondary" id="contact" href="mailto:${encodeURIComponent(d.contact.email)}">Contact CJ</a></div><p class="fine" id="download-status" role="status"></p></div><div><h3>Selected experience</h3><ul class="list">${d.proof.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></div></div></section><div class="footer">CJ Wheelock · ${escape(d.contact.location)} · Created for ${escape(d.name)}</div></div></main>`;
   document.getElementById('logout').addEventListener('click',signOut);
   document.getElementById('download-pdf').addEventListener('click',()=>download('pdf'));
   document.getElementById('download-docx').addEventListener('click',()=>download('docx'));
   for(const id of ['segment','weight','threshold'])document.getElementById(id).addEventListener('input',update);
   shell.querySelectorAll('.nav-group a').forEach(a=>a.addEventListener('click',()=>{shell.querySelectorAll('.nav-group a').forEach(x=>x.classList.remove('current'));a.classList.add('current')}));
   renderScenario();update();
 }
 function renderScenario(){
   const choice=(id,label,items)=>`<label for="${id}">${label}<select id="${id}">${items.map(x=>`<option>${escape(x)}</option>`).join('')}</select></label>`;
   const check=(id,label,checked=false)=>`<label class="checkline"><input type="checkbox" id="${id}" ${checked?'checked':''}>${label}</label>`;
   const range=(id,label,value,max)=>`<label for="${id}">${label} <output id="${id}-out">${value}</output><input type="range" id="${id}" min="0" max="${max}" value="${value}"></label>`;
   let heading='',intro='',fields='';
   switch(slug){
    case 'clay': heading='Route a buying signal';intro='Choose a fictional signal and see a proposed handoff.';fields=choice('sc-a','Signal',['Pricing revisit','Champion changed jobs','Event registration'])+choice('sc-b','Current owner',['Unassigned','SDR','Lifecycle marketing']);break;
    case 'modal': heading='Resolve a workspace';intro='Test how evidence changes an identity match.';fields=check('sc-a','Verified company domain',true)+check('sc-b','Workspace name matches')+check('sc-c','Conflicting affiliation');break;
    case 'decagon': heading='Model a forecast';intro='Apply a chosen probability to the fictional open pipeline.';fields=range('sc-a','Probability (%)',50,100);break;
    case 'baseten': heading='Qualify an inference workload';intro='Choose two technical characteristics to guide the next question.';fields=choice('sc-a','Deployment maturity',['Prototype','Growing usage','Production workload'])+choice('sc-b','Response pattern',['Batch','Real-time']);break;
    case 'hearth': heading='Explore response-time sensitivity';intro='For 100 fictional leads, use an illustrative assumption: 24% book at ≤15 minutes, 18% at 16–30, and 10% after 30.';fields=range('sc-a','Minutes to first response',15,120);break;
    case 'watershed': heading='Map the buying committee';intro='Mark the fictional stakeholder roles already verified.';fields=check('sc-a','Sustainability',true)+check('sc-b','Finance')+check('sc-c','Operations or procurement');break;
    case 'august': heading='Shape a firm-specific question';intro='Select a practice and research angle for a human-reviewed opening.';fields=choice('sc-a','Practice',['Corporate','Litigation','Commercial'])+choice('sc-b','Research angle',['Knowledge workflows','Document review','Practice growth']);break;
    case 'siro': heading='Explore field-team coverage';intro='Compare fictional team size with recorded conversations.';fields=range('sc-a','Field representatives',80,200)+range('sc-b','Reps with a recorded conversation',35,200);break;
    case 'dualentry': heading='Recover a stalled lead';intro='Check which handoff pieces exist for a fictional finance lead.';fields=choice('sc-a','Lifecycle stage',['Form submitted','Partial booking','Demo scheduled'])+check('sc-b','Owner assigned')+check('sc-c','Follow-up scheduled');break;
    case 'langchain': heading='Triage an onboarding question';intro='A response stays with a human unless its source and evaluation checks are complete.';fields=choice('sc-a','Question type',['Deployment','Trace interpretation','Evaluation setup'])+check('sc-b','Relevant documentation identified')+check('sc-c','Evaluation passed');break;
   }
   const box=document.getElementById('scenario');
   box.innerHTML=`<div><h3>${escape(heading)}</h3><p>${escape(intro)}</p><div class="scenario-fields">${fields}</div></div><div class="scenario-output" id="scenario-output" aria-live="polite"></div>`;
   const el=id=>document.getElementById(id), value=id=>el(id)?.value, checked=id=>!!el(id)?.checked;
   function refresh(){
    box.querySelectorAll('input[type=range]').forEach(input=>{el(input.id+'-out').textContent=input.value});
    let title='',detail='';
    switch(slug){
     case 'clay': title=value('sc-b')==='Unassigned'?'Assign an owner':'Owner: '+value('sc-b');detail='Review the '+value('sc-a').toLowerCase()+' signal, verify its source, and agree on a follow-up SLA before routing.';break;
     case 'modal': {const n=Number(checked('sc-a'))+Number(checked('sc-b'));title=checked('sc-c')?'Conflict · human review':n===2?'Strong match · review':n===1?'Partial match · review':'Insufficient evidence';detail='Workspace A ↔ Company A. Keep each source and its timestamp attached; do not merge identities automatically.';break}
     case 'decagon': {const open=data.accounts.filter(x=>['Qualified','Discovery'].includes(x.stage)).reduce((n,x)=>n+x.value,0),forecast=Math.round(open*Number(value('sc-a'))/100);title=money(forecast)+' weighted pipeline';detail=money(open)+' fictional open value × '+value('sc-a')+'% assumed probability. This is a scenario, not a forecast of actual revenue.';break}
     case 'baseten': title=value('sc-a')+' · '+value('sc-b').toLowerCase();detail='Ask about throughput, latency, model requirements and deployment constraints; then prepare a technical handoff for review.';break;
     case 'hearth': {const t=Number(value('sc-a')),booked=t<=15?24:t<=30?18:10;title=booked+' illustrative appointments';detail='Out of 100 fictional leads at '+t+' minutes. The booking rates are assumptions for this interaction, not measured results.';break}
     case 'watershed': {const missing=[['Sustainability','sc-a'],['Finance','sc-b'],['Operations or procurement','sc-c']].filter(x=>!checked(x[1])).map(x=>x[0]);title=(3-missing.length)+'/3 roles mapped';detail=missing.length?'Research next: '+missing.join(', ')+'. Verify names and roles before outreach.':'Role coverage is complete for this fictional account; verify the evidence and prepare a brief.';break}
     case 'august': title=value('sc-a')+' · '+value('sc-b');detail='Proposed question: How does your '+value('sc-a').toLowerCase()+' practice handle '+value('sc-b').toLowerCase()+' today, and where does work slow down? Review against public research before use.';break;
     case 'siro': {const total=Number(value('sc-a')),n=Math.min(total,Number(value('sc-b'))),pct=total?Math.round(n/total*100):0;title=pct+'% illustrative coverage';detail=n+' of '+total+' fictional representatives have a recorded conversation. Explore manager follow-up and coaching needs; no recordings are connected.';break}
     case 'dualentry': title=!checked('sc-b')?'Assign an owner':!checked('sc-c')?'Schedule a follow-up':'Handoff complete';detail=value('sc-a')+' · '+(checked('sc-b')?'owner assigned':'owner missing')+' · '+(checked('sc-c')?'follow-up scheduled':'follow-up missing')+'. No message is sent.';break;
     case 'langchain': title=checked('sc-b')&&checked('sc-c')?'Ready for human review':'Escalate to a person';detail=value('sc-a')+' question · '+(checked('sc-b')?'source identified':'source missing')+' · '+(checked('sc-c')?'evaluation passed':'evaluation pending')+'. This interaction does not run a live agent.';break;
    }
    el('scenario-output').innerHTML=`<small>Proposed next step</small><strong>${escape(title)}</strong><p>${escape(detail)}</p>`;
   }
   box.querySelectorAll('input,select').forEach(control=>control.addEventListener('input',refresh));refresh();
 }
 function update(){
   const d=data, segment=document.getElementById('segment').value, weight=Number(document.getElementById('weight').value), threshold=Number(document.getElementById('threshold').value);
   document.getElementById('weight-out').textContent=weight+'%';document.getElementById('threshold-out').textContent=threshold;
   const rows=d.accounts.filter(a=>segment==='all'||a.segment===segment).map(a=>({...a,score:Math.round((a.fit*weight+a.intent*(100-weight))/100)}));
   if(!rows.some(x=>x.name===chosen))chosen=rows[0]?.name||'';
   const eligible=rows.filter(x=>x.score>=threshold), qualified=eligible.filter(x=>x.stage!=='New'), discovery=eligible.filter(x=>['Discovery','Won'].includes(x.stage)), won=eligible.filter(x=>x.stage==='Won');
   const open=eligible.filter(x=>['Qualified','Discovery'].includes(x.stage)).reduce((sum,x)=>sum+x.value,0);
   const closed=won.reduce((sum,x)=>sum+x.value,0);
   document.getElementById('result-count').textContent=rows.length+' fictional '+d.unit;
   document.getElementById('metrics').innerHTML=[['Eligible records',eligible.length,'At or above the selected score'],['Qualified',qualified.length,'Qualified, discovery or won'],['Open potential',money(open),'Qualified + discovery; per year'],['Won value',money(closed),'Illustrative annual value']].map(x=>`<div class="card metric"><div class="metric-label">${escape(x[0])}</div><div class="metric-value">${escape(x[1])}</div><div class="metric-detail">${escape(x[2])}</div></div>`).join('');
   document.getElementById('rows').innerHTML=rows.map(x=>`<tr class="${x.name===chosen?'selected':''}"><td><button class="entity" type="button" data-record="${escape(x.name)}" aria-pressed="${x.name===chosen}">${escape(x.name)}</button></td><td>${escape(x.segment)}</td><td>${escape(x.signal)}</td><td class="score">${x.score}</td><td><span class="stage">${escape(x.stage)}</span></td><td>${money(x.value)}</td></tr>`).join('');
   document.querySelectorAll('[data-record]').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.record;update()}));
   const item=rows.find(x=>x.name===chosen),detail=document.getElementById('detail');
   if(item){detail.innerHTML=`<div><h4>${escape(item.name)} · ${escape(item.signal)}</h4><p>${escape(item.next)} This is a fictional record with an illustrative score of ${item.score}.</p></div><div class="detail-right"><span class="detail-status" role="status">${reviewed.has(item.name)?'Marked for review locally':''}</span><button class="secondary" id="review" type="button">${escape(d.action)}</button></div>`;document.getElementById('review').addEventListener('click',()=>{reviewed.add(item.name);detail.querySelector('.detail-status').textContent='Marked for review locally'})}
   else detail.innerHTML='<p>No records in this segment.</p>';
   const funnel=[['Identified',eligible.length],['Qualified',qualified.length],['Discovery',discovery.length],['Won',won.length]];
   document.getElementById('funnel').innerHTML=funnel.map(([label,n])=>`<div class="funnel-row"><span>${label}</span><div class="bar-track"><div class="bar" data-width="${eligible.length?Math.round(100*n/eligible.length):0}"></div></div><b>${n}</b></div>`).join('');
   document.querySelectorAll('.bar[data-width]').forEach(el=>{el.style.width=el.dataset.width+'%'});
 }
 async function download(kind){
   const status=document.getElementById('download-status');status.textContent='Preparing download…';
   try{const response=await request('/api/'+slug+'/resume?format='+kind);if(!response.ok)throw new Error('The résumé is not available yet.');const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=data.resume[kind];document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=''}catch(err){status.textContent=err.message}
 }
 async function signOut(){try{await request('/api/'+slug+'/logout',{method:'POST'})}catch(_){}token='';data=null;chosen='';reviewed.clear();shell.classList.add('hidden');shell.innerHTML='';gate.classList.remove('hidden');password.focus()}
})();
