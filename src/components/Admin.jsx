import React from "react";
import { fmtMoney } from "../data.js";

export function AdminApprovals({ courses, onUpdate }) {
  const pending = courses.filter((c) => c.status === "pending");
  if (pending.length === 0) return <div className="empty">No courses waiting for review.</div>;
  return (
    <div className="grid">
      {pending.map((c) => (
        <div className="card" key={c.id}>
          <h3 style={{ fontSize: 16 }}>{c.title}</h3>
          <div className="course-meta" style={{ marginBottom: 10 }}>
            By {c.instructor} · {c.category} · {fmtMoney(c.price)}
          </div>
          <p style={{ fontSize: 13.5 }}>{c.description}</p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn accent small" onClick={() => onUpdate(c.id, (x) => ({ ...x, status: "approved" }))}>
              Approve
            </button>
            <button className="btn danger small" onClick={() => onUpdate(c.id, (x) => ({ ...x, status: "rejected" }))}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminUsers({ users, setUsers }) {
  function toggleStatus(id) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
  }
  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td style={{ textTransform: "capitalize" }}>{u.role}</td>
              <td>
                <span className={"pill " + (u.status === "active" ? "ok" : "bad")}>{u.status}</span>
              </td>
              <td>
                <button className="btn small secondary" onClick={() => toggleStatus(u.id)}>
                  {u.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRevenue({ courses }) {
  const paid = courses.filter((c) => c.status === "approved" && c.price > 0);
  const revenue = paid.reduce((s, c) => s + c.price * c.students, 0);
  const totalStudents = courses.reduce((s, c) => s + c.students, 0);
  const maxRev = Math.max(...paid.map((c) => c.price * c.students), 1);
  return (
    <div>
      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <div className="num">₹{revenue.toLocaleString("en-IN")}</div>
          <div className="label">Total revenue</div>
        </div>
        <div className="card stat">
          <div className="num">{totalStudents}</div>
          <div className="label">Total enrolments</div>
        </div>
        <div className="card stat">
          <div className="num">{courses.filter((c) => c.status === "approved").length}</div>
          <div className="label">Live courses</div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Revenue by course</h3>
        {paid.map((c) => {
          const rev = c.price * c.students;
          return (
            <div className="bar-row" key={c.id}>
              <div className="label">{c.title}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: (rev / maxRev) * 100 + "%" }} />
              </div>
              <div className="bar-val">₹{rev.toLocaleString("en-IN")}</div>
            </div>
          );
        })}
        {paid.length === 0 && <div className="course-meta">No paid enrolments yet.</div>}
      </div>
    </div>
  );
}
