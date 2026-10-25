import React, { useState, useEffect, useRef, useMemo } from "react";
import { flattenLessons, fmtTime, CURRENT_USER } from "../data.js";

export function CourseDetail({ course, progress, onProgress, onBack }) {
  const lessons = useMemo(() => flattenLessons(course), [course]);
  const firstIncomplete = lessons.find((l) => !progress[l.id]?.complete) || lessons[0];
  const [activeLessonId, setActiveLessonId] = useState(firstIncomplete.id);
  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = lessons[activeIndex];

  function isUnlocked(index) {
    if (index === 0) return true;
    const prev = lessons[index - 1];
    return !!progress[prev.id]?.complete;
  }

  const completeCount = lessons.filter((l) => progress[l.id]?.complete).length;
  const allComplete = completeCount === lessons.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
      <div>
        <button className="btn secondary small" onClick={onBack} style={{ marginBottom: 14 }}>
          ← Back
        </button>
        <h3 style={{ fontSize: 16 }}>{course.title}</h3>
        <div className="course-meta" style={{ marginBottom: 14 }}>
          {completeCount}/{lessons.length} complete
        </div>
        {course.sections.map((sec) => (
          <div key={sec.id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>
              {sec.title}
            </div>
            {sec.lessons.map((l) => {
              const idx = lessons.findIndex((x) => x.id === l.id);
              const unlocked = isUnlocked(idx);
              const done = !!progress[l.id]?.complete;
              return (
                <div
                  key={l.id}
                  className={
                    "lesson-item" + (!unlocked ? " locked" : "") + (l.id === activeLessonId ? " current" : "")
                  }
                  style={{ cursor: unlocked ? "pointer" : "not-allowed" }}
                  onClick={() => unlocked && setActiveLessonId(l.id)}
                >
                  <div className={"lesson-dot" + (done ? " done" : "")}>
                    {done ? "✓" : l.type === "quiz" ? "Q" : "▶"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {unlocked ? fmtTime(l.duration) : "Locked"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        {allComplete && <Certificate courseTitle={course.title} />}
        {!allComplete && activeLesson.type === "video" && (
          <VideoLesson
            lesson={activeLesson}
            saved={progress[activeLesson.id]}
            onProgress={(patch) => onProgress(activeLesson.id, patch)}
            onNext={() => activeIndex < lessons.length - 1 && setActiveLessonId(lessons[activeIndex + 1].id)}
            hasNext={activeIndex < lessons.length - 1}
          />
        )}
        {!allComplete && activeLesson.type === "quiz" && (
          <QuizLesson
            lesson={activeLesson}
            onComplete={(score) => onProgress(activeLesson.id, { complete: true, quizScore: score })}
            onNext={() => activeIndex < lessons.length - 1 && setActiveLessonId(lessons[activeIndex + 1].id)}
            hasNext={activeIndex < lessons.length - 1}
          />
        )}
      </div>
    </div>
  );
}

function VideoLesson({ lesson, saved, onProgress, onNext, hasNext }) {
  const [watched, setWatched] = useState(saved?.watched || 0);
  const [playing, setPlaying] = useState(false);
  const complete = !!saved?.complete;
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setWatched((w) => {
          const next = Math.min(lesson.duration, w + 1);
          // simulate a resumable-progress checkpoint call (throttled server sync)
          if (next % 5 === 0 || next === lesson.duration) onProgress({ watched: next });
          if (next >= lesson.duration) setPlaying(false);
          return next;
        });
      }, 120); // sped up for demo purposes
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  const pct = Math.round((watched / lesson.duration) * 100);
  const canComplete = pct >= 90; // completion rule: must watch at least 90%

  return (
    <div>
      <div className="player">
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          {lesson.sectionTitle} · {lesson.title}
        </div>
        <div className="player-time">
          {fmtTime(watched)} / {fmtTime(lesson.duration)}
        </div>
        <button className="btn accent" onClick={() => setPlaying((p) => !p)} disabled={watched >= lesson.duration}>
          {playing ? "Pause" : watched > 0 ? "Resume" : "Play"}
        </button>
      </div>
      <div className="progress-track" style={{ marginBottom: 10 }}>
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>
      <div className="row between">
        <span className="course-meta">{pct}% watched — completion unlocks at 90%</span>
        {!complete ? (
          <button className="btn" disabled={!canComplete} onClick={() => onProgress({ complete: true })}>
            Mark lesson complete
          </button>
        ) : (
          <button className="btn secondary" onClick={onNext} disabled={!hasNext}>
            {hasNext ? "Next lesson →" : "Section finished"}
          </button>
        )}
      </div>
      {!canComplete && !complete && (
        <div className="course-meta" style={{ marginTop: 8 }}>
          "Mark complete" stays disabled until playback crosses 90% — this is enforced the same way
          server-side, so a student can't fake completion by editing UI state.
        </div>
      )}
    </div>
  );
}

function QuizLesson({ lesson, onComplete, onNext, hasNext }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    let correct = 0;
    lesson.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const score = Math.round((correct / lesson.questions.length) * 100);
    setSubmitted(true);
    onComplete(score);
  }

  return (
    <div>
      <h3>{lesson.title}</h3>
      {lesson.questions.map((q, i) => (
        <div key={i} className="quiz-q">
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            {i + 1}. {q.q}
          </div>
          {q.options.map((opt, j) => {
            let cls = "quiz-opt";
            if (submitted && j === q.answer) cls += " correct";
            else if (submitted && answers[i] === j) cls += " wrong";
            return (
              <label key={j} className={cls}>
                <input
                  type="radio"
                  name={"q" + i}
                  disabled={submitted}
                  checked={answers[i] === j}
                  onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                />
                {opt}
              </label>
            );
          })}
        </div>
      ))}
      {!submitted ? (
        <button className="btn accent" disabled={Object.keys(answers).length < lesson.questions.length} onClick={submit}>
          Submit answers
        </button>
      ) : (
        <button className="btn secondary" onClick={onNext} disabled={!hasNext}>
          {hasNext ? "Next lesson →" : "Section finished"}
        </button>
      )}
    </div>
  );
}

function Certificate({ courseTitle }) {
  return (
    <div className="certificate">
      <div className="pill ok" style={{ marginBottom: 14 }}>
        Course complete
      </div>
      <h2>Certificate of Completion</h2>
      <div className="course-meta">This certifies that</div>
      <div className="name">{CURRENT_USER.name}</div>
      <div className="course-meta">has completed all lessons and assessments in</div>
      <h3 style={{ marginTop: 8 }}>{courseTitle}</h3>
    </div>
  );
}
