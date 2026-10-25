import React from "react";
import { fmtMoney, flattenLessons } from "../data.js";

export function Catalog({ courses, enrollments, onEnroll, onOpen }) {
  const approved = courses.filter((c) => c.status === "approved");
  return (
    <div className="grid">
      {approved.map((c) => {
        const enrolled = enrollments.includes(c.id);
        return (
          <div key={c.id} className="card course-card">
            <div className="course-thumb">{c.title}</div>
            <div className="row between">
              <span className="pill">{c.category}</span>
              <span className="pill ok">★ {c.rating}</span>
            </div>
            <h3 style={{ fontSize: 17 }}>{c.title}</h3>
            <div className="course-meta">{c.description}</div>
            <div className="course-meta">
              By {c.instructor} · {c.students} students
            </div>
            <hr className="hair" style={{ margin: "6px 0" }} />
            <div className="row between">
              <strong>{fmtMoney(c.price)}</strong>
              {enrolled ? (
                <button className="btn secondary small" onClick={() => onOpen(c.id)}>
                  Resume
                </button>
              ) : (
                <button
                  className="btn accent small"
                  onClick={() => {
                    onEnroll(c.id);
                    onOpen(c.id);
                  }}
                >
                  Enrol
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MyCourses({ courses, progress, onOpen }) {
  if (courses.length === 0) {
    return <div className="empty">You haven't enrolled in any courses yet. Visit the catalogue to get started.</div>;
  }
  return (
    <div className="grid">
      {courses.map((c) => {
        const lessons = flattenLessons(c);
        const done = lessons.filter((l) => progress[c.id]?.[l.id]?.complete).length;
        const pct = Math.round((done / lessons.length) * 100);
        return (
          <div key={c.id} className="card course-card">
            <div className="course-thumb">{c.title}</div>
            <h3 style={{ fontSize: 17 }}>{c.title}</h3>
            <div className="course-meta">
              {done}/{lessons.length} lessons complete
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: pct + "%" }} />
            </div>
            <button className="btn small" onClick={() => onOpen(c.id)}>
              Continue
            </button>
          </div>
        );
      })}
    </div>
  );
}
