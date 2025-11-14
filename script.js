/* Office: Career Simulator
   - 7 days to get promoted
   - Stats: Performance, Reputation, Energy
   - Achievements are tracked during play
*/

const MAX_DAYS = 7;
let state = {
  day: 1,
  daysLeft: MAX_DAYS,
  perf: 50, // performance
  rep: 50,  // reputation
  eng: 50,  // energy
  log: [],
  achievements: {},
  history: []
};

/* ---------- Utilities ---------- */
const $ = id => document.getElementById(id);
const clamp = (v, a=0, b=100) => Math.max(a, Math.min(b, v));
const pct = v => Math.round(clamp(v));
const pushLog = (text) => {
  state.log.unshift({t: text, day: state.day});
  renderLog();
};

/* ---------- Render helpers ---------- */
function renderStats(){
  $('perfVal').textContent = pct(state.perf);
  $('repVal').textContent = pct(state.rep);
  $('engVal').textContent = pct(state.eng);
  $('perfBar').style.width = pct(state.perf) + '%';
  $('repBar').style.width = pct(state.rep) + '%';
  $('engBar').style.width = pct(state.eng) + '%';
  $('daysLeft').textContent = state.daysLeft;
  $('dayNum').textContent = state.day;
}

function renderLog(){
  const ul = $('logList');
  ul.innerHTML = '';
  for (let i=0;i<state.log.length;i++){
    const li = document.createElement('li');
    li.textContent = `Day ${state.log[i].day}: ${state.log[i].t}`;
    ul.appendChild(li);
  }
}

function renderAchievements(){
  const map = {
    'Balanced Worker': 'achBalanced',
    'Workaholic': 'achWorkaholic',
    'Team Player': 'achTeam',
    'Ethical': 'achEthic',
    'Fired': 'achFired'
  };
  for (const [name,id] of Object.entries(map)){
    const el = $(id);
    if (!el) continue;
    if (state.achievements[name]) el.classList.add('unlocked'), el.classList.remove('locked');
    else el.classList.remove('unlocked'), el.classList.add('locked');
  }
}

/* ---------- Achievements checks ---------- */
function checkAchievements(){
  // Balanced Worker: keep all stats between 40 and 70 at end
  if (state.day === MAX_DAYS) {
    if (state.perf>=40 && state.perf<=70 && state.rep>=40 && state.rep<=70 && state.eng>=40 && state.eng<=70){
      state.achievements['Balanced Worker'] = true;
    }
  }
  // Workaholic: +20 perf in a single day recorded in history
  for (const h of state.history){
    if (h.perfDelta >= 20) state.achievements['Workaholic'] = true;
  }
  // Team Player: total rep increase >=30 across game
  const repDelta = state.rep - 50;
  if (repDelta >= 30) state.achievements['Team Player'] = true;
  // Ethical: if a certain choice recorded
  for (const h of state.history){
    if (h.flag && h.flag === 'ethical_choice') state.achievements['Ethical'] = true;
  }
  // Fired: if rep or eng reached 0 anytime
  if (state.rep <= 0 || state.eng <= 0) state.achievements['Fired'] = true;
}

/* ---------- Game events and choices ---------- */
const dailyEvents = [
  // Each event contains description and choices
  {
    text: "Your manager asks you to take a weekend to finish a deliverable. Do you accept?",
    choices: [
      {text:"Accept — work extra (Performance +20, Energy -25)", effect:()=>applyDelta(20,0,-25,'accepted_overtime')},
      {text:"Decline — keep balance (Reputation -8, Energy +5)", effect:()=>applyDelta(0,-8,5,'declined_overtime')},
      {text:"Negotiate for help (Performance +8, Reputation +6, Energy -8)", effect:()=>applyDelta(8,6,-8,'negotiated')},
    ]
  },
  {
    text: "A coworker suggests fudge a small metric to look better. What do you do?",
    choices: [
      {text:"Refuse — keep ethics (Reputation +6, Performance -5)", effect:()=>applyDelta(-5,6,0,'ethical_choice')},
      {text:"Agree — boost metric but risky (Performance +18, Reputation -20)", effect:()=>applyDelta(18,-20,0,'fudged')},
      {text:"Report anonymously (Reputation +10, Energy -5)", effect:()=>applyDelta(0,10,-5,'reported')},
    ]
  },
  {
    text: "Company offers training session today. Attend?",
    choices: [
      {text:"Attend — (+10 Performance, -6 Energy)", effect:()=>applyDelta(10,0,-6,'attended_training')},
      {text:"Skip, focus on deliverable (+7 Performance, -3 Reputation)", effect:()=>applyDelta(7,-3,-4,'skipped_training')},
      {text:"Do a short break instead (+15 Energy)", effect:()=>applyDelta(0,0,15,'short_break')},
    ]
  },
  {
    text: "Client requests a risky shortcut to meet deadline. Choose:",
    choices: [
      {text:"Push risky shortcut (Perf +15, Rep -15)", effect:()=>applyDelta(15,-15,-5,'risky_shortcut')},
      {text:"Insist on proper QA (Rep +8, Perf -6)", effect:()=>applyDelta(-6,8,-2,'proper_qa')},
      {text:"Split the work with team (+6 Perf, +6 Rep, -6 Eng)", effect:()=>applyDelta(6,6,-6,'team_split')},
    ]
  },
  {
    text: "Manager offers to recognize you publicly if you take sole credit.",
    choices: [
      {text:"Take credit (Perf +12, Rep -18)", effect:()=>applyDelta(12,-18,-4,'took_credit')},
      {text:"Share credit (Rep +12, Perf +6)", effect:()=>applyDelta(6,12,-3,'shared_credit')},
      {text:"Politely decline (Rep +4)", effect:()=>applyDelta(0,4,0,'declined_credit')},
    ]
  },
  {
    text: "Midweek slump — you can rest or push through.",
    choices: [
      {text:"Power through (Perf +10, Eng -18)", effect:()=>applyDelta(10,0,-18,'power_through')},
      {text:"Rest a bit (Eng +18, Perf -6)", effect:()=>applyDelta(-6,0,18,'rested')},
      {text:"Short team coffee (Rep +8, Eng +6)", effect:()=>applyDelta(0,8,6,'coffee')},
    ]
  },
  {
    text: "Final day — decide how to present results.",
    choices: [
      {text:"Big flashy presentation (Perf +15, Rep -10, Eng -8)", effect:()=>applyDelta(15,-10,-8,'flashy')},
      {text:"Solid honest report (Rep +12, Perf +6)", effect:()=>applyDelta(6,12,-3,'honest_report')},
      {text:"Ask team to present (Rep +8, Perf +2, Eng +5)", effect:()=>applyDelta(2,8,5,'team_present')},
    ]
  }
];

function applyDelta(perfDelta, repDelta, engDelta, flag) {
  const before = {perf:state.perf, rep:state.rep, eng:state.eng};
  state.perf = clamp(state.perf + perfDelta);
  state.rep  = clamp(state.rep + repDelta);
  state.eng  = clamp(state.eng + engDelta);
  // record history for checks
  state.history.push({
    day: state.day,
    perfDelta, repDelta, engDelta, flag
  });
  pushLog(`Chose: ${flag} — P ${perfDelta>=0?'+':''}${perfDelta}, R ${repDelta>=0?'+':''}${repDelta}, E ${engDelta>=0?'+':''}${engDelta}`);
  renderStats(); checkAchievements(); renderAchievements();
  // immediate fired check
  if (state.rep <= 0 || state.eng <= 0) {
    pushLog("Critical failure: Company terminates your role!");
    endGame('fired');
  }
}

/* ---------- Game flow ---------- */
function startDay(){
  // render today's event based on day index (wrap dailyEvents for variety)
  const idx = (state.day - 1) % dailyEvents.length;
  const event = dailyEvents[idx];

  // display text and choices
  $('sceneText').textContent = event.text;
  const choicesDiv = $('choices');
  choicesDiv.innerHTML = '';
  event.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choiceBtn';
    btn.textContent = c.text;
    btn.onclick = () => {
      // apply choice effect
      c.effect();
      // save day snapshot
      state.history[state.history.length-1].snapshot = { perf: state.perf, rep: state.rep, eng: state.eng };
      // proceed to next day
      nextDay();
    };
    choicesDiv.appendChild(btn);
  });
}

function nextDay(){
  // store daily summary
  state.history.push({ summary:`End of Day ${state.day}`, snapshot: {perf:state.perf,rep:state.rep,eng:state.eng}});
  // advance day counters
  if (state.day >= MAX_DAYS) {
    // evaluation
    evaluatePromotion();
  } else {
    state.day++;
    state.daysLeft = MAX_DAYS - state.day + 1;
    // small energy regen overnight (+6)
    state.eng = clamp(state.eng + 6);
    renderStats();
    startDay();
  }
}

/* ---------- Promotion logic & endings ---------- */
function evaluatePromotion(){
  // final achievement check
  checkAchievements();
  renderAchievements();

  // scoring rule (simple): weighted score: perf*0.6 + rep*0.3 + eng*0.1 + achievement bonuses
  let score = state.perf*0.6 + state.rep*0.3 + state.eng*0.1;
  const achCount = Object.keys(state.achievements).length;
  score += achCount * 6; // each achievement adds small boost

  // thresholds
  if (state.rep <= 0 || state.eng <= 0) {
    endGame('fired');
    return;
  }
  if (score >= 85) endGame('promoted');
  else if (score >= 55) endGame('kept');
  else endGame('kept'); // default keep job (no promotion)
}

/* ---------- End game presentation ---------- */
function endGame(outcome){
  // hide gameplay area
  $('choices').innerHTML = '';
  $('sceneText').textContent = "Week complete — evaluating performance...";
  // create end modal content
  const title = $('endTitle');
  const text = $('endText');
  const achUL = $('endAch');
  achUL.innerHTML = '';

  if (outcome === 'promoted') {
    title.textContent = 'Congratulations — PROMOTED!';
    text.textContent = `You secured the promotion. Final stats — Performance: ${pct(state.perf)}, Reputation: ${pct(state.rep)}, Energy: ${pct(state.eng)}.`;
  } else if (outcome === 'fired') {
    title.textContent = 'You were fired';
    text.textContent = `A critical failure (low Reputation or Energy) led to termination. Final stats — Performance: ${pct(state.perf)}, Reputation: ${pct(state.rep)}, Energy: ${pct(state.eng)}.`;
  } else {
    title.textContent = 'You keep your job';
    text.textContent = `You survived the week but didn't get promoted. Final stats — Performance: ${pct(state.perf)}, Reputation: ${pct(state.rep)}, Energy: ${pct(state.eng)}.`;
  }

  for (const k of Object.keys(state.achievements)) {
    const li = document.createElement('li');
    li.textContent = k;
    achUL.appendChild(li);
  }
  // show modal (custom)
  $('endModal').classList.remove('hidden');
}

/* ---------- Download report ---------- */
function downloadReport(){
  const report = {
    final: {perf:state.perf,rep:state.rep,eng:state.eng,day:state.day},
    achievements: state.achievements,
    history: state.history,
    log: state.log
  };
  const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'career_report.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Initialization ---------- */
function init(){
  // wire up end buttons
  $('restartBtn').onclick = () => location.reload();
  $('downloadReportBtn').onclick = () => downloadReport();

  // initial render
  renderStats();
  renderAchievements();
  renderLog();

  // start first day
  startDay();
}

window.onload = init;
