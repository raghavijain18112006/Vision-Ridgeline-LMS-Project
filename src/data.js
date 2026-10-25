/* =========================================================================
   MOCK DATA
   In the full-stack version this all lives in MongoDB and is fetched
   through the Express REST API described in the project brief. Here it's
   in-memory so the app runs without a backend.
========================================================================= */

export const initialCourses = [
  {
    id: "c1",
    title: "React for Interview-Ready Frontends",
    category: "Web Development",
    price: 0,
    rating: 4.7,
    instructor: "Ananya Rao",
    status: "approved",
    students: 312,
    description:
      "Component architecture, hooks, and state patterns asked about in every frontend interview loop.",
    sections: [
      {
        id: "s1",
        title: "Foundations",
        lessons: [
          { id: "l1", title: "Why component trees matter", duration: 480, type: "video" },
          { id: "l2", title: "State vs. props", duration: 600, type: "video" },
          {
            id: "l3",
            title: "Quiz: Core concepts",
            duration: 300,
            type: "quiz",
            questions: [
              {
                q: "What triggers a re-render in React?",
                options: ["Changing a state or prop value", "Refreshing the CSS file", "Restarting the browser"],
                answer: 0
              },
              {
                q: "Props are best described as:",
                options: ["Mutable internal data", "Read-only inputs passed to a component", "A styling API"],
                answer: 1
              }
            ]
          }
        ]
      },
      {
        id: "s2",
        title: "Data & Side Effects",
        lessons: [
          { id: "l4", title: "useEffect and cleanup", duration: 540, type: "video" },
          { id: "l5", title: "Fetching and caching data", duration: 660, type: "video" }
        ]
      }
    ]
  },
  {
    id: "c2",
    title: "Node & Express: Production APIs",
    category: "Backend",
    price: 1499,
    rating: 4.5,
    instructor: "Vikram Shah",
    status: "approved",
    students: 158,
    description: "Build role-protected REST APIs with JWT middleware, the backend half of this LMS.",
    sections: [
      {
        id: "s1",
        title: "Auth & Roles",
        lessons: [
          { id: "l1", title: "JWT middleware end to end", duration: 720, type: "video" },
          {
            id: "l2",
            title: "Quiz: Auth basics",
            duration: 240,
            type: "quiz",
            questions: [
              {
                q: "Where should role checks be enforced?",
                options: ["Only in the UI", "On the server, for every protected route", "Nowhere, roles are just cosmetic"],
                answer: 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "c3",
    title: "MongoDB Schema Design for SaaS",
    category: "Backend",
    price: 999,
    rating: 4.3,
    instructor: "Priya Menon",
    status: "pending",
    students: 0,
    description: "Modelling relationships, indexes, and aggregation pipelines for real products.",
    sections: [
      {
        id: "s1",
        title: "Getting started",
        lessons: [{ id: "l1", title: "Documents vs. collections", duration: 420, type: "video" }]
      }
    ]
  },
  {
    id: "c4", title: "UI/UX Design Masterclass", category: "Design", price: 799, rating: 4.8, instructor: "Meera Joshi", status: "approved", students: 246,
    description: "Create beautiful interfaces using design systems, wireframes and usability principles.",
    sections: [{id:"s1", title:"Design foundations", lessons:[{id:"l1",title:"Design thinking essentials",duration:420,type:"video"},{id:"l2",title:"Wireframes and user flows",duration:540,type:"video"},{id:"l3",title:"Quiz: UX basics",duration:240,type:"quiz",questions:[{q:"What is a wireframe?",options:["A layout blueprint","A database","A deployment tool"],answer:0}]}]}]
  },
  {
    id: "c5", title: "Python for Data Analytics", category: "Data & AI", price: 1199, rating: 4.6, instructor: "Arjun Verma", status: "approved", students: 389,
    description: "Learn Python, data cleaning and visualisation through practical mini projects.",
    sections: [{id:"s1",title:"Python essentials",lessons:[{id:"l1",title:"Variables and collections",duration:480,type:"video"},{id:"l2",title:"Working with datasets",duration:600,type:"video"},{id:"l3",title:"Knowledge check",duration:240,type:"quiz",questions:[{q:"Which library is popular for tabular data?",options:["Pandas","React","Express"],answer:0}]}]}]
  },
  {
    id: "c6", title: "Java DSA Interview Bootcamp", category: "Programming", price: 1499, rating: 4.9, instructor: "Karan Mehta", status: "approved", students: 521,
    description: "Master arrays, strings, recursion and problem-solving patterns for coding interviews.",
    sections: [{id:"s1",title:"Problem solving",lessons:[{id:"l1",title:"Time complexity explained",duration:480,type:"video"},{id:"l2",title:"Arrays and two pointers",duration:660,type:"video"},{id:"l3",title:"DSA checkpoint",duration:300,type:"quiz",questions:[{q:"What is the typical complexity of binary search?",options:["O(log n)","O(n²)","O(2ⁿ)"],answer:0}]}]}]
  },
  {
    id: "c7", title: "Cloud & DevOps Foundations", category: "Cloud", price: 999, rating: 4.5, instructor: "Neel Sethi", status: "approved", students: 174,
    description: "Understand cloud models, CI/CD pipelines, containers and deployment workflows.",
    sections: [{id:"s1",title:"Cloud fundamentals",lessons:[{id:"l1",title:"Cloud service models",duration:420,type:"video"},{id:"l2",title:"CI/CD pipeline basics",duration:540,type:"video"}]}]
  },
  {
    id: "c8", title: "Communication & Placement Skills", category: "Career Skills", price: 499, rating: 4.4, instructor: "Simran Kaur", status: "approved", students: 298,
    description: "Improve your resume, presentations, group discussions and technical interview confidence.",
    sections: [{id:"s1",title:"Career readiness",lessons:[{id:"l1",title:"Build a strong resume",duration:360,type:"video"},{id:"l2",title:"Technical interview strategy",duration:480,type:"video"}]}]
  }
];

export const initialUsers = [
  { id: "u1", name: "Rhea Kapoor", role: "student", status: "active" },
  { id: "u2", name: "Dev Malhotra", role: "student", status: "active" },
  { id: "u3", name: "Ananya Rao", role: "instructor", status: "active" },
  { id: "u4", name: "Vikram Shah", role: "instructor", status: "active" },
  { id: "u5", name: "Sana Iqbal", role: "student", status: "suspended" }
];

export const CURRENT_USER = { name: "Rhea Kapoor", id: "u1" };

export function flattenLessons(course) {
  const out = [];
  course.sections.forEach((sec) =>
    sec.lessons.forEach((l) => out.push({ ...l, sectionId: sec.id, sectionTitle: sec.title }))
  );
  return out;
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtMoney(n) {
  return n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`;
}
