const state = {
    scene: 0,
    flags: {}
};

const scenes = [
    {
        s: "",
        t: "You arrive outside DreamForge Studios on a rainy night..."
    },
    {
        s: "Narrator",
        t: "The Creative Director greets you warmly..."
    },
    {
        s: "Director",
        t: "First decision: What will you prioritize?",
        choices: [
            { label: "Emotion-first (Story)", effect: () => { state.flags.path = "emotion"; setBG("warm"); } },
            { label: "Systems-first (Mechanic)", effect: () => { state.flags.path = "system"; setBG("cold"); } }
        ]
    },
    {
        s: "Narrator",
        t: "Second decision: Clarity or Mystery?",
        choices: [
            { label: "Clear guidance", effect: () => { state.flags.clarity = "clear"; } },
            { label: "Mysterious tone", effect: () => { state.flags.clarity = "mystery"; } }
        ]
    },
    {
        s: "Narrator",
        t: "A notebook shows two sticky notes...",
        choices: [
            { label: "Forgive", effect: () => { state.flags.theme = "forgiveness"; setBG("warm"); } },
            { label: "Remember", effect: () => { state.flags.theme = "memory"; setBG("cold"); } }
        ]
    },
    {
        s: "Director",
        t: "Your prototype is complete...",
        end: true
    }
];

function $(id) { return document.getElementById(id); }

function setBG(type) {
    const bg = $("bg");
    bg.className = "";
    bg.classList.add("bg-" + type);
}

function loadScene() {
    const scene = scenes[state.scene];

    $("speaker").textContent = scene.s;
    $("text").textContent = scene.t;
    $("choices").innerHTML = "";

    $("next").style.display = scene.choices ? "none" : "block";

    if (scene.choices) {
        scene.choices.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "choiceBtn";
            btn.textContent = c.label;
            btn.onclick = () => {
                c.effect();
                nextScene();
            };
            $("choices").appendChild(btn);
        });
    }

    if (scene.end) finishGame();
}

function nextScene() {
    state.scene++;
    loadScene();
}

function finishGame() {
    $("ui").classList.add("hidden");
    $("ending").classList.remove("hidden");

    $("endingTitle").textContent = "Your Ending";
    $("endingText").textContent = JSON.stringify(state.flags, null, 2);
}

/* ======================= BUTTONS ======================= */

$("startBtn").onclick = () => {
    $("menu").classList.add("hidden");
    $("ui").classList.remove("hidden");
    loadScene();
};

$("howBtn").onclick = () => {
    $("menu").classList.add("hidden");
    $("howto").classList.remove("hidden");
};

$("closeHowto").onclick = () => {
    $("howto").classList.add("hidden");
    $("menu").classList.remove("hidden");
};

$("pauseBtn").onclick = () => {
    $("ui").classList.add("hidden");
    $("pauseMenu").classList.remove("hidden");
};

$("resumeBtn").onclick = () => {
    $("pauseMenu").classList.add("hidden");
    $("ui").classList.remove("hidden");
};

$("restartBtn").onclick = () => location.reload();

$("playAgain").onclick = () => location.reload();

$("dialogueBox").onclick = () => {
    if (!scenes[state.scene].choices) nextScene();
};
