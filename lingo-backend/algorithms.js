// 四种学习算法的纯函数实现
// quality: 0-5 分（0=完全不记得，5=完全记得），quality >= 3 视为答对

// 艾宾浩斯遗忘曲线
// 固定间隔序列：1, 2, 4, 7, 15, 30 天
const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30];

function ebbinghaus(progress, quality) {
  let reviewCount = progress.review_count || 0;
  if (quality >= 3) {
    reviewCount = Math.min(reviewCount + 1, EBBINGHAUS_INTERVALS.length - 1);
  } else {
    reviewCount = 0;
  }
  const intervalDays = EBBINGHAUS_INTERVALS[reviewCount];
  return {
    review_count: reviewCount,
    interval_days: intervalDays,
    next_review_at: daysFromNow(intervalDays)
  };
}

// SM-2 算法（Anki 使用的算法）
function sm2(progress, quality) {
  let ef = progress.ease_factor || 2.5;
  let interval = progress.interval_days || 1;
  let reviewCount = progress.review_count || 0;

  if (quality >= 3) {
    if (reviewCount === 0) interval = 1;
    else if (reviewCount === 1) interval = 6;
    else interval = Math.round(interval * ef);
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ef = Math.max(1.3, ef);
    reviewCount += 1;
  } else {
    interval = 1;
    reviewCount = 0;
  }

  return {
    review_count: reviewCount,
    ease_factor: ef,
    interval_days: interval,
    next_review_at: daysFromNow(interval)
  };
}

// FSRS 简化版
// 参考 FSRS 论文，简化实现
const FSRS_DECAY = -0.5;
const FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1;

function fsrs(progress, quality) {
  let stability = progress.stability || 1.0;
  let difficulty = progress.difficulty || 5.0;
  let reviewCount = progress.review_count || 0;

  // 调整难度 (1-10)
  difficulty = difficulty + (quality < 3 ? 1 : -0.2 * (quality - 3));
  difficulty = Math.max(1, Math.min(10, difficulty));

  if (quality >= 3) {
    // 更新稳定性
    const retrievability = Math.pow(1 + FSRS_FACTOR * (progress.interval_days || 1) / stability, FSRS_DECAY);
    stability = stability * (Math.exp(0.9 * (quality - 3 + 1)) * retrievability);
    stability = Math.max(0.1, stability);
    reviewCount += 1;
  } else {
    stability = Math.max(0.1, stability * 0.5);
    reviewCount = 0;
  }

  const interval = Math.max(1, Math.round(stability * Math.log(0.9) / Math.log(0.9 + FSRS_FACTOR)));

  return {
    review_count: reviewCount,
    stability,
    difficulty,
    interval_days: interval,
    next_review_at: daysFromNow(interval)
  };
}

// Leitner 卡片盒（5个盒子）
const LEITNER_INTERVALS = [1, 2, 4, 8, 16];

function leitner(progress, quality) {
  let box = progress.leitner_box || 1;
  let reviewCount = progress.review_count || 0;

  if (quality >= 3) {
    box = Math.min(box + 1, LEITNER_INTERVALS.length);
    reviewCount += 1;
  } else {
    box = 1;
    reviewCount = 0;
  }

  const intervalDays = LEITNER_INTERVALS[box - 1];
  return {
    review_count: reviewCount,
    leitner_box: box,
    interval_days: intervalDays,
    next_review_at: daysFromNow(intervalDays)
  };
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function calculate(algorithm, progress, quality) {
  switch (algorithm) {
    case 'ebbinghaus': return ebbinghaus(progress, quality);
    case 'sm2': return sm2(progress, quality);
    case 'fsrs': return fsrs(progress, quality);
    case 'leitner': return leitner(progress, quality);
    default: throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

module.exports = { calculate };
