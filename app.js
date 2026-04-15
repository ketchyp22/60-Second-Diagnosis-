// app.js — Угадай диагноз за 60 секунд
// Зависимости: questions.js (должен быть подключён раньше в index.html)

const GAME_TIME = 60; // секунд на всю игру
const POINTS_CORRECT = 10;
const LETTERS = ['А', 'Б', 'В', 'Г'];

// ═══════════════════════════════════════════
// СОСТОЯНИЕ ИГРЫ
// ═══════════════════════════════════════════
const state = {
  questions: [],        // перемешанный массив вопросов
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  skippedCount: 0,
  timerInterval: null,
  timeLeft: GAME_TIME,
  answered: false,      // заблокировать повторный клик
  gameOver: false,
};

// ═══════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════
const screens = {
  start:  document.getElementById('screen-start'),
  game:   document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};

const el = {
  // игра
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
  // результат
  resultIcon:      document.getElementById('result-icon'),
  resultTitle:     document.getElementById('result-title'),
  resultScore:     document.getElementById('result-score'),
  resultCorrect:   document.getElementById('result-correct'),
  resultWrong:     document.getElementById('result-wrong'),
  resultSkipped:   document.getElementById('result-skipped'),
  resultGrade:     document.getElementById('result-grade'),
};

// ═══════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// СТАРТ
// ═══════════════════════════════════════════
function initStart() {
  showScreen('start');
}

function startGame() {
  // Сброс состояния
  state.questions    = shuffle(QUESTIONS);
  state.currentIndex = 0;
  state.score        = 0;
  state.correctCount = 0;
  state.wrongCount   = 0;
  state.skippedCount = 0;
  state.timeLeft     = GAME_TIME;
  state.gameOver     = false;

  el.progressTotal.textContent = state.questions.length;
  showScreen('game');
  loadQuestion();
  startTimer();
}

// ═══════════════════════════════════════════
// ТАЙМЕР
// ═══════════════════════════════════════════
function startTimer() {
  clearInterval(state.timerInterval);
  updateTimerUI();

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      endGame();
    }
  }, 1000);
}

function updateTimerUI() {
  el.timerDisplay.textContent = state.timeLeft;
  const pct = (state.timeLeft / GAME_TIME) * 100;
  el.timerBar.style.width = pct + '%';

  // Цвет
  const isWarning = state.timeLeft <= 20 && state.timeLeft > 10;
  const isDanger  = state.timeLeft <= 10;

  el.timerDisplay.className = isDanger ? 'danger' : isWarning ? 'warning' : '';
  el.timerBar.className     = isDanger ? 'danger' : isWarning ? 'warning' : '';
}

// ═══════════════════════════════════════════
// ВОПРОС
// ═══════════════════════════════════════════
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

  // Прячем пояснение
  el.explanationBox.classList.remove('show');
  el.btnNext.style.display = 'none';
  el.btnSkip.style.display = 'inline-flex';

  // Перемешиваем варианты ответов
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
}

// ═══════════════════════════════════════════
// ОТВЕТ
// ═══════════════════════════════════════════
function handleAnswer(clickedBtn, isCorrect, explanation) {
  if (state.answered || state.gameOver) return;
  state.answered = true;

  // Блокируем все кнопки
  const allBtns = el.optionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.getAttribute('data-correct') === 'true') {
      btn.classList.add('correct');
    }
  });

  if (isCorrect) {
    state.score        += POINTS_CORRECT;
    state.correctCount += 1;
  } else {
    clickedBtn.classList.add('wrong');
    state.wrongCount += 1;
  }

  // Показываем пояснение
  el.explanationText.innerHTML = `<strong>Пояснение:</strong> ${explanation}`;
  el.explanationBox.classList.add('show');

  el.scoreLive.innerHTML = `Счёт: <span>${state.score}</span>`;
  el.btnNext.style.display  = 'inline-flex';
  el.btnSkip.style.display  = 'none';
}

// ═══════════════════════════════════════════
// СЛЕДУЮЩИЙ / ПРОПУСК
// ═══════════════════════════════════════════
function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) {
    endGame();
  } else {
    loadQuestion();
  }
}

function skipQuestion() {
  if (state.answered || state.gameOver) return;
  state.skippedCount++;
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) {
    endGame();
  } else {
    loadQuestion();
  }
}

// ═══════════════════════════════════════════
// КОНЕЦ ИГРЫ
// ═══════════════════════════════════════════
function endGame() {
  if (state.gameOver) return;
  state.gameOver = true;
  clearInterval(state.timerInterval);

  // Рассчитываем итог
  const total    = state.questions.length;
  const answered = state.correctCount + state.wrongCount;
  const accuracy = answered > 0 ? Math.round((state.correctCount / answered) * 100) : 0;

  // Иконка и оценка
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
    title     = 'Время вышло!';
    gradeText = `<strong>Не успел</strong> ответить правильно ни разу. Не сдавайся — попробуй ещё раз!`;
  }

  el.resultIcon.textContent    = icon;
  el.resultTitle.textContent   = title;
  el.resultScore.textContent   = state.score;
  el.resultCorrect.textContent = state.correctCount;
  el.resultWrong.textContent   = state.wrongCount;
  el.resultSkipped.textContent = state.skippedCount + (total - state.currentIndex > 0 ? (total - state.currentIndex) : 0);
  el.resultGrade.innerHTML     = gradeText;

  showScreen('result');
}

// ═══════════════════════════════════════════
// НАВЕШИВАЕМ СОБЫТИЯ
// ═══════════════════════════════════════════
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-next').addEventListener('click', nextQuestion);
document.getElementById('btn-skip').addEventListener('click', skipQuestion);
document.getElementById('btn-play-again').addEventListener('click', startGame);
document.getElementById('btn-to-menu').addEventListener('click', initStart);

// ═══════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════
initStart();
