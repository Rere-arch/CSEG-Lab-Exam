const state = {
  sceneIndex: 0,
  flags: {},
  decisionCount: 0,
  startTime: null
};

const scenes = [
  { speaker: '', text: "You wake on a rainy evening outside DreamForge's studio...", bg:'neutral' },
  { speaker: 'Narrator', text: "The Creative Director greets you...", bg:'neutral' },

  // Decision 1
  { 
    speaker: 'Director',
    text: "First decision: What will you prioritize?",
    bg:'neutral',
    choices: [
      {id:'A', label:'Emotion-first (Story)', effect:()=>{state.flags.path='emotion'; setBG('warm'); playTone(440,0.12);} },
      {id:'B', label:'Systems-first (Mechanic)', effect:()=>{state.flags.path='system'; setBG('cold'); playTone(220,0.12);} }
    ],
    timed: true,
    timer: 10
  },

  // Decision 2
  { 
    speaker:'Narrator',
    text:"Next: Clarity or mystery?",
    bg:'neutral',
    choices:[
      {id:'1', label:'Keep it clear', effect:()=>{state.flags.clarity='clear'; playTone(660,0.08);} },
      {id:'2', label:'Make it mysterious', effect:()=>{state.flags.clarity='mystery'; playTone(330,0.08);} }
    ]
  },

  // Decision 3
  { 
    speaker:'Narrator',
    text:"A journal reads: Forgive or Remember?",
    bg:'neutral',
    choices:[
      {id:'forgive', label:'Forgive', effect:()=>{state.flags.theme='forgiveness'; setBG('warm');} },
      {id:'remember', label:'Remember', effect:()=>{state.flags.theme='memory'; setBG('cold');} }
    ]
  },

  { speaker:'Director', text:"The prototype is complete.", bg:'neutral' },
];

const endings = {
  A_clear_forgiveness: { title:'Warm Closure', text:"Your emotional prototype moved players deeply.", tone:'warm' },
  A_mystery_memory: { title:'Bittersweet Echo', text:"A haunting, mysterious narrative about memory.", tone:'cold' },
  B_clear_memory: { title:'Ingenious System', text:"A clever system-driven branching narrative.", tone:'cold' },
  B_mystery_forgiveness: { title:'Ambiguous Hope', text:"Ambiguous but hopeful reconciliation.", tone:'warm' },
  fallback: { title:'Prototype Built', text:"A balanced prototype with meaningful decisions." }
};

function $(id){return document.getElementById(id);}
function setBG(type){
  const bg=$('bg');
  bg.className='';
  bg.classList.add('bg-'+type);
}

function playTone(freq,dur){
  try{
    const ctx=window.audioCtx||(window.audioCtx=new AudioContext());
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.frequency.value=freq;
    g.gain.value=0.02;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>o.stop(),dur*1000);
  }catch(e){}
}

function showScene(i){
  const s = scenes[i];
  $('speaker').textContent = s.speaker;
  $('text').textContent = s.text;
  $('choices').innerHTML = '';
  $('next').style.display = s.choices ? 'none' : 'block';

  if(s.choices){
    s.choices.forEach(choice=>{
      const btn=document.createElement('button');
      btn.classList.add('choiceBtn');
      btn.textContent=choice.label;
      btn.onclick=()=>{
        choice.effect();
        state.decisionCount++;
        nextScene();
      };
      $('choices').appendChild(btn);
    });
  }
}

function nextScene(){
  state.sceneIndex++;
  if(state.sceneIndex >= scenes.length) finishGame();
  else showScene(state.sceneIndex);
}

function finishGame(){
  const p = state.flags.path || 'B';
  const c = state.flags.clarity || 'clear';
  const t = state.flags.theme || 'forgiveness';

  let key='fallback';
  if(p==='emotion' && c==='clear' && t==='forgiveness') key='A_clear_forgiveness';
  if(p==='emotion' && c==='mystery' && t==='memory') key='A_mystery_memory';
  if(p==='system' && c==='clear' && t==='memory') key='B_clear_memory';
  if(p==='system' && c==='mystery' && t==='forgiveness') key='B_mystery_forgiveness';

  const end = endings[key];

  $('endingTitle').textContent=end.title;
  $('endingText').textContent=end.text;

  $('ui').classList.add('hidden');
  $('ending').classList.remove('hidden');
}

window.onload = ()=>{
  $('startBtn').onclick=()=>{
    $('menu').classList.add('hidden');
    $('ui').classList.remove('hidden');
    showScene(0);
  };

  $('playAgain').onclick=()=>location.reload();
  $('restartBtn').onclick=()=>location.reload();
  $('pauseBtn').onclick=()=>{ $('pauseMenu').classList.remove('hidden'); $('ui').classList.add('hidden'); };
  $('resumeBtn').onclick=()=>{ $('pauseMenu').classList.add('hidden'); $('ui').classList.remove('hidden'); };
  $('loadBtn').onclick=()=>{ $('menu').classList.add('hidden'); $('howto').classList.remove('hidden'); };
  $('closeHowto').onclick=()=>{ $('howto').classList.add('hidden'); $('menu').classList.remove('hidden'); };

  document.getElementById('dialogueBox').onclick=()=>{
    const s = scenes[state.sceneIndex];
    if(!s.choices) nextScene();
  };

  $('downloadDoc').onclick=()=> window.open('documentation.pdf');
};
