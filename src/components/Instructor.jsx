import React, { useState } from "react";
import { flattenLessons, fmtTime } from "../data.js";

export function InstructorCourses({ courses, onUpdate }) {
  const [openId, setOpenId] = useState(courses[0]?.id || null);
  const course = courses.find((c) => c.id === openId);

  function addSection() {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: [...c.sections, { id: "s" + Date.now(), title: "New section", lessons: [] }]
    }));
  }
  function renameSection(sectionId, title) {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
    }));
  }
  function addLesson(sectionId) {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: c.sections.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: [...s.lessons, { id: "l" + Date.now(), title: "New lesson", duration: 300, type: "video" }] }
          : s
      )
    }));
  }
  function renameLesson(sectionId, lessonId, title) {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: c.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, title } : l)) }
      )
    }));
  }
  function removeLesson(sectionId, lessonId) {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: c.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
      )
    }));
  }
  function moveLesson(sectionId, index, dir) {
    onUpdate(course.id, (c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const lessons = [...s.lessons];
        const target = index + dir;
        if (target < 0 || target >= lessons.length) return s;
        [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
        return { ...s, lessons };
      })
    }));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
      <div>
        {courses.map((c) => (
          <button
            key={c.id}
            className="rail-link"
            style={{
              color: c.id === openId ? "var(--accent-dark)" : "var(--ink)",
              background: c.id === openId ? "#EAF2EE" : "transparent",
              border: "1px solid var(--line)",
              marginBottom: 8
            }}
            onClick={() => setOpenId(c.id)}
          >
            {c.title}
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.status}</div>
          </button>
        ))}
      </div>

      {course && (
        <div>
          <div className="row between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>{course.title}</h3>
            <span className={"pill " + (course.status === "approved" ? "ok" : "warn")}>{course.status}</span>
          </div>

          {course.sections.map((sec) => (
            <div className="section-block" key={sec.id}>
              <div className="section-title-row">
                <input
                  value={sec.title}
                  onChange={(e) => renameSection(sec.id, e.target.value)}
                  style={{
                    border: "none",
                    fontFamily: "'Fraunces',serif",
                    fontSize: 16,
                    background: "transparent",
                    width: "70%"
                  }}
                />
                <button className="btn small secondary" onClick={() => addLesson(sec.id)}>
                  + Lesson
                </button>
              </div>
              {sec.lessons.map((l, i) => (
                <div className="lesson-edit-row" key={l.id}>
                  <span style={{ fontSize: 11, color: "var(--muted)", width: 14 }}>{l.type === "quiz" ? "Q" : "▶"}</span>
                  <input
                    value={l.title}
                    onChange={(e) => renameLesson(sec.id, l.id, e.target.value)}
                    style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 3, padding: "5px 8px", fontSize: 13 }}
                  />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmtTime(l.duration)}</span>
                  <button className="icon-btn" onClick={() => moveLesson(sec.id, i, -1)}>
                    ↑
                  </button>
                  <button className="icon-btn" onClick={() => moveLesson(sec.id, i, 1)}>
                    ↓
                  </button>
                  <button className="icon-btn" onClick={() => removeLesson(sec.id, l.id)}>
                    ✕
                  </button>
                </div>
              ))}
              {sec.lessons.length === 0 && <div className="course-meta">No lessons yet.</div>}
            </div>
          ))}
          <button className="btn secondary" onClick={addSection}>
            + Add section
          </button>
        </div>
      )}
    </div>
  );
}

export function InstructorAnalytics({ courses }) {
  return (
    <div>
      {courses.map((c) => {
        const lessons = flattenLessons(c);
        return (
          <div className="card" key={c.id} style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 16 }}>{c.title}</h3>
            <div className="course-meta" style={{ marginBottom: 12 }}>
              {c.students} enrolled students
            </div>
            {lessons.map((l) => {
              // demo metric: fraction of enrolled students estimated complete, seeded from lesson index
              const pct = Math.max(10, 95 - lessons.indexOf(l) * 14);
              return (
                <div className="bar-row" key={l.id}>
                  <div className="label">{l.title}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: pct + "%" }} />
                  </div>
                  <div className="bar-val">{pct}%</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
