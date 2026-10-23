// ---------- Question bank (5 are picked at random each run) ----------
const BANK = [
  { q: "Which method selects an element by ID in JavaScript?", o: ["querySelectorAll()", "getElementById()", "getElementsByTagName()", "getElementByClass()"], a: 1 },
  { q: "Which HTML attribute is used to link CSS?", o: ["src", "href", "rel", "link"], a: 1 },
  { q: "Which method removes the last element of an array?", o: ["shift()", "pop()", "push()", "splice()"], a: 1 },
  { q: "Which JS array method adds an element to the end?", o: ["push()", "pop()", "unshift()", "concat()"], a: 0 },
  { q: "Which CSS property changes text color?", o: ["font-color", "text-color", "color", "foreground"], a: 2 },
  { q: "Which JS keyword declares a block-scoped variable?", o: ["var", "let", "def", "dim"], a: 1 },
  { q: "Which Bootstrap class creates a responsive fixed-width container?", o: [".wrapper", ".container", ".box", ".frame"], a: 1 },
  { q: "Which HTML tag is used for the largest heading?", o: ["<h6>", "<head>", "<h1>", "<heading>"], a: 2 },
  { q: "Which CSS layout module is one-dimensional (row or column)?", o: ["Flexbox", "Float", "Table", "Position"], a: 0 },
  { q: "Which event fires when a user clicks an element?", o: ["onhover", "onpress", "onclick", "onselect"], a: 2 },
  { q: "Which operator checks both value and type in JavaScript?", o: ["==", "=", "===", "!="], a: 2 },
  { q: "Which CSS media feature is used for responsive breakpoints?", o: ["max-width", "color-depth", "font-size", "z-index"], a: 0 }
];
const TOTAL = 5, TIME = 15;

const $ = id => document.getElementById(id);
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let questions = [], idx = 0, score = 0, answers = [], timeLeft = TIME, timerId = null, locked = false;

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute("data-bs-theme", t);
  $("themeToggle").textContent = t === "dark" ? "🌙" : "☀️";
  try { localStorage.setItem("quiz-theme", t); } catch (e) {}
}
$("themeToggle").onclick = () => applyTheme(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
let saved = null; try { saved = localStorage.getItem("quiz-theme"); } catch (e) {}
applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

// ---------- Quiz flow ----------
function start() {
  // pick 5 random questions and shuffle their options (tracking the correct one)
  questions = shuffle(BANK).slice(0, TOTAL).map(item => {
    const opts = shuffle(item.o.map((t, i) => ({ t, ok: i === item.a })));
    return { q: item.q, opts };
  });
  idx = 0; score = 0; answers = [];
  $("segBar").innerHTML = questions.map(() => '<div class="seg"></div>').join("");
  $("resultCard").classList.add("d-none");
  $("quizCard").classList.remove("d-none");
  showQuestion();
}

function updateBar() {
  [...$("segBar").children].forEach((s, i) => {
    s.classList.toggle("done", i < idx);
    s.classList.toggle("current", i === idx);
  });
}

function showQuestion() {
  locked = false;
  const cur = questions[idx];
  $("qCounter").textContent = `Question ${idx + 1} / ${TOTAL}`;
  $("qText").textContent = cur.q;
  $("nextBtn").disabled = true;
  $("nextBtn").textContent = idx === TOTAL - 1 ? "Finish ✓" : "Next →";
  $("options").innerHTML = "";
  cur.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt"; b.textContent = o.t;
    b.onclick = () => choose(i);
    $("options").appendChild(b);
  });
  updateBar();
  startTimer();
}

function startTimer() {
  clearInterval(timerId);
  timeLeft = TIME; renderTimer();
  timerId = setInterval(() => {
    timeLeft--; renderTimer();
    if (timeLeft <= 0) { clearInterval(timerId); if (!locked) choose(-1); } // time up
  }, 1000);
}
function renderTimer() {
  const t = $("timer");
  t.textContent = `Time Left: ${timeLeft}s`;
  t.classList.toggle("low", timeLeft <= 5);
  t.classList.toggle("text-success", timeLeft > 5);
}

function choose(i) {
  if (locked) return;
  locked = true; clearInterval(timerId);
  const cur = questions[idx];
  const correctIdx = cur.opts.findIndex(o => o.ok);
  const btns = [...$("options").children];
  btns.forEach(b => b.disabled = true);
  btns[correctIdx].classList.add("correct");
  if (i >= 0 && i !== correctIdx) btns[i].classList.add("wrong");
  if (i === correctIdx) score++;
  answers.push({
    q: cur.q,
    yours: i >= 0 ? cur.opts[i].t : "Not Answered",
    correct: cur.opts[correctIdx].t,
    ok: i === correctIdx
  });
  $("nextBtn").disabled = false;
}

$("nextBtn").onclick = () => {
  idx++;
  if (idx < TOTAL) showQuestion(); else showResult();
};

// ---------- Result ----------
function showResult() {
  updateBar();
  $("quizCard").classList.add("d-none");
  $("resultCard").classList.remove("d-none");
  $("scoreText").textContent = `Score: ${score} / ${TOTAL}`;
  $("resultBody").innerHTML = answers.map((a, i) => `
    <tr><td>${i + 1}</td><td>${a.q}</td><td>${a.yours}</td><td>${a.correct}</td>
    <td class="text-white ${a.ok ? "bg-success" : "bg-danger"}">${a.ok ? "Correct" : "Incorrect"}</td></tr>`).join("");
}

// ---------- PDF download (jsPDF + AutoTable) ----------
$("pdfBtn").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20); doc.text("Quiz Result", 14, 20);
  doc.setFontSize(13); doc.text(`Score: ${score} / ${TOTAL}`, 14, 30);
  doc.autoTable({
    startY: 38,
    head: [["#", "Question", "Your Answer", "Correct Answer", "Status"]],
    body: answers.map((a, i) => [i + 1, a.q, a.yours, a.correct, a.ok ? "Correct" : "Incorrect"]),
    headStyles: { fillColor: [225, 225, 225], textColor: 0 },
    didParseCell: d => {
      if (d.section === "body" && d.column.index === 4) {
        d.cell.styles.fillColor = d.cell.raw === "Correct" ? [25, 135, 84] : [220, 53, 69];
        d.cell.styles.textColor = 255;
      }
    }
  });
  doc.save("Quiz_Result.pdf");
};

$("restartBtn").onclick = start;
start();
