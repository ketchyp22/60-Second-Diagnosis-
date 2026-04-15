// app.js — Угадай диагноз за 60 секунд

const GAME_TIME = 60; // секунд на ОДНУ задачу
const POINTS_CORRECT = 10;
const LETTERS = ['А', 'Б', 'В', 'Г'];

document.addEventListener('DOMContentLoaded', function() {

const state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  skippedCount: 0,
  timerInterval: null,
  timeLeft: GAME_TIME,
  answered: false,
  gameOver: false,
};

const screens = {
  start:  document.getElementById('screen-start'),
  game:   document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};

const el = {
  progressCurrent: document.getElementById('progress-current'),
  progressTotal:   document.getElementById('progress-total'),
  timerDisplay:    document.getElementById('timer-display'),
  timerBar:        document.getElementById('timer-bar'),
  scenarioText:    document.getElementById('scenario-text'),
  optionsContainer:document.getElementById('options-container'),
  explanationBox:  document.getElementById('explanation-box'),
  explanationText: document.getElementById('explanation-text'),
  scoreLive:       document.getElementById('score-live'),
  btnNext:         document.getElementById('btn-next'),
  btnSkip:         document.getElementById('btn-skip'),
  resultIcon:      document.getElementById('result-icon'),
  resultTitle:     document.getElementById('result-title'),
  resultScore:     document.getElementById('result-score'),
  resultCorrect:   document.getElementById('result-correct'),
  resultWrong:     document.getElementById('result-wrong'),
  resultSkipped:   document.getElementById('result-skipped'),
  resultGrade:     document.getElementById('result-grade'),
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function initStart() {
  showScreen('start');
}

function startGame() {
  state.questions    = shuffle(QUESTIONS);
  state.currentIndex = 0;
  state.score        = 0;
  state.correctCount = 0;
  state.wrongCount   = 0;
  state.skippedCount = 0;
  state.gameOver     = false;

  el.progressTotal.textContent = state.questions.length;
  showScreen('game');
  loadQuestion();
}

// ─── ТАЙМЕР — сбрасывается на каждую задачу ───
function startTimer() {
  clearInterval(state.timerInterval);
  state.timeLeft = GAME_TIME;
  updateTimerUI();

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      // время на задачу вышло — считаем как пропуск
      clearInterval(state.timerInterval);
      autoSkip();
    }
  }, 1000);
}

function autoSkip() {
  if (state.answered || state.gameOver) return;
  state.skippedCount++;

  // подсветим правильный ответ
  const allBtns = el.optionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.getAttribute('data-correct') === 'true') btn.classList.add('correct');
  });

  el.explanationText.innerHTML = `<strong>Время вышло!</strong> Правильный ответ выделен выше.`;
  el.explanationBox.classList.add('show');
  el.btnNext.style.display = 'inline-flex';
  el.btnSkip.style.display = 'none';
  state.answered = true;
}

function updateTimerUI() {
  el.timerDisplay.textContent = state.timeLeft;
  const pct = (state.timeLeft / GAME_TIME) * 100;
  el.timerBar.style.width = pct + '%';

  const isWarning = state.timeLeft <= 20 && state.timeLeft > 10;
  const isDanger  = state.timeLeft <= 10;

  el.timerDisplay.className = isDanger ? 'danger' : isWarning ? 'warning' : '';
  el.timerBar.className     = isDanger ? 'danger' : isWarning ? 'warning' : '';
}

function loadQuestion() {
  if (state.currentIndex >= state.questions.length) {
    endGame();
    return;
  }

  state.answered = false;
  const q = state.questions[state.currentIndex];

  el.progressCurrent.textContent = state.currentIndex + 1;
  el.scenarioText.textContent    = q.scenario;
  el.scoreLive.innerHTML         = `Счёт: <span>${state.score}</span>`;
  el.explanationBox.classList.remove('show');
  el.btnNext.style.display = 'none';
  el.btnSkip.style.display = 'inline-flex';

  const shuffledOptions = shuffle(q.options.map((o, i) => ({ ...o, origIndex: i })));
  el.optionsContainer.innerHTML = '';
  shuffledOptions.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('data-correct', opt.correct);
    btn.innerHTML = `
      <span class="option-letter">${LETTERS[i]}</span>
      <span class="option-text">${opt.text}</span>
    `;
    btn.addEventListener('click', () => handleAnswer(btn, opt.correct, q.explanation));
    el.optionsContainer.appendChild(btn);
  });

  // запускаем таймер для этой задачи
  startTimer();
}

function handleAnswer(clickedBtn, isCorrect, explanation) {
  if (state.answered || state.gameOver) return;
  state.answered = true;
  clearInterval(state.timerInterval);

  const allBtns = el.optionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.getAttribute('data-correct') === 'true') btn.classList.add('correct');
  });

  if (isCorrect) {
    state.score        += POINTS_CORRECT;
    state.correctCount += 1;
  } else {
    clickedBtn.classList.add('wrong');
    state.wrongCount += 1;
  }

  el.explanationText.innerHTML = `<strong>Пояснение:</strong> ${explanation}`;
  el.explanationBox.classList.add('show');
  el.scoreLive.innerHTML = `Счёт: <span>${state.score}</span>`;
  el.btnNext.style.display = 'inline-flex';
  el.btnSkip.style.display = 'none';
}

function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) endGame();
  else loadQuestion();
}

function skipQuestion() {
  if (state.answered || state.gameOver) return;
  clearInterval(state.timerInterval);
  state.skippedCount++;
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) endGame();
  else loadQuestion();
}

function endGame() {
  if (state.gameOver) return;
  state.gameOver = true;
  clearInterval(state.timerInterval);

  const total    = state.questions.length;
  const answered = state.correctCount + state.wrongCount;
  const accuracy = answered > 0 ? Math.round((state.correctCount / answered) * 100) : 0;

  let icon, title, gradeText;
  if (accuracy >= 80 && state.correctCount >= 5) {
    icon      = '🏆';
    title     = 'Отличный результат!';
    gradeText = `<strong>Отлично!</strong> Ты справился как настоящий клиницист. ${accuracy}% точность — уверенный уровень.`;
  } else if (accuracy >= 60) {
    icon      = '⚕️';
    title     = 'Хороший результат';
    gradeText = `<strong>Неплохо!</strong> Основы знаешь, но есть что повторить. Точность — ${accuracy}%.`;
  } else if (state.correctCount > 0) {
    icon      = '📖';
    title     = 'Нужно повторить';
    gradeText = `<strong>Есть над чем поработать.</strong> Точность ${accuracy}% — открывай учебник!`;
  } else {
    icon      = '💉';
    title     = 'Не угадал ни одной!';
    gradeText = `<strong>Не сдавайся!</strong> Попробуй ещё раз — задачи каждый раз перемешиваются.`;
  }

  el.resultIcon.textContent    = icon;
  el.resultTitle.textContent   = title;
  el.resultScore.textContent   = state.score;
  el.resultCorrect.textContent = state.correctCount;
  el.resultWrong.textContent   = state.wrongCount;
  el.resultSkipped.textContent = state.skippedCount;
  el.resultGrade.innerHTML     = gradeText;

  showScreen('result');
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-next').addEventListener('click', nextQuestion);
document.getElementById('btn-skip').addEventListener('click', skipQuestion);
document.getElementById('btn-play-again').addEventListener('click', startGame);
document.getElementById('btn-to-menu').addEventListener('click', initStart);

initStart();

});
