import React from "react";
import { flattenLessons } from "../data.js";

export function Dashboard({ courses, progress }) {
  if (courses.length === 0) {
    return <div className="empty">Enrol in a course to start tracking progress.</div>;
  }

  const totals = courses.map((c) => {
    const lessons = flattenLessons(c);
    const done = lessons.filter((l) => progress[c.id]?.[l.id]?.complete).length;
    return { course: c, done, total: lessons.length, pct: Math.round((done / lessons.length) * 100) };
  });
  const overallPct = Math.round(totals.reduce((s, t) => s + t.pct, 0) / totals.length);
  const certificates = totals.filter((t) => t.pct === 100).length;

  return (
    <div>
      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="num">{overallPct}%</div>
          <div className="label">Average completion</div>
        </div>
        <div className="card stat">
          <div className="num">{courses.length}</div>
          <div className="label">Active enrolments</div>
        </div>
        <div className="card stat">
          <div className="num">{certificates}</div>
          <div className="label">Certificates earned</div>
        </div>
        <div className="card stat">
          <div className="num">4</div>
          <div className="label">Day streak</div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Per-course progress</h3>
        {totals.map((t) => (
          <div className="bar-row" key={t.course.id}>
            <div className="label">{t.course.title}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: t.pct + "%" }} />
            </div>
            <div className="bar-val">
              {t.done}/{t.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
