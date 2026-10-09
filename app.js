(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { route: "dashboard", detailCurriculumId: null, data: {}, curriculumFilters: { programId: "" }, subjectFilters: { programId: "", yearLevel: "", semester: "" }, classFilters: { programId: "", yearLevel: "", academicYear: "", semester: "", teacherId: "", status: "", search: "" } };
  const page = $("#page-content");
  const modalRoot = $("#modal-root");

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const program = (id) => AcademicDB.programs.find((item) => item.id === id);
  const semesterName = (semester) => ({ "1": "1st semester", "2": "2nd semester", summer: "Summer" }[semester] || semester);
  const yearName = (year) => `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year`;
  const byId = (records, id) => records.find((item) => item.id === id);
  const relationshipText = (subject, relation, subjects) => {
    const singularId = subject[`${relation}Id`];
    const ids = [...new Set([...(subject[`${relation}Ids`] || []), ...(singularId ? [singularId] : [])])];
    const codes = [...new Set([
      ...ids.map((id) => byId(subjects, id)).filter(Boolean).map((item) => item.code),
      ...(subject[`${relation}Codes`] || [])
    ])];
    const notes = subject[`${relation}Text`] ? [subject[`${relation}Text`]] : [];
    return [...codes, ...notes].join(", ");
  };
  const fmtDate = (date) => date || "—";
  const initial = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
  const classTitle = (classRecord) => {
    const course = program(classRecord.programId);
    return `${course ? course.code : "Program"} · ${yearName(classRecord.yearLevel)} · Section ${classRecord.section}`;
  };
  const classSchedules = (classRecord) => {
    if (Array.isArray(classRecord.scheduleEntries) && classRecord.scheduleEntries.length) {
      return classRecord.scheduleEntries.map((entry) => ({
        days: entry.days || entry.scheduleDays || [],
        startTime: entry.startTime || "",
        endTime: entry.endTime || "",
        room: entry.room || "",
        building: entry.building || "",
        mode: entry.mode || "",
        subjectId: entry.subjectId || ""
      }));
    }
    const legacySchedule = {
      days: classRecord.scheduleDays || [],
      startTime: classRecord.startTime || "",
      endTime: classRecord.endTime || "",
      room: classRecord.room || "",
      building: classRecord.building || "",
      mode: classRecord.mode || "",
      subjectId: ""
    };
    return legacySchedule.days.length || legacySchedule.startTime || legacySchedule.endTime || legacySchedule.room || legacySchedule.building
      ? [legacySchedule]
      : [];
  };
  const scheduleText = (entry) => `${entry.days.join(", ") || "Days not set"}${entry.startTime ? ` · ${entry.startTime}–${entry.endTime}` : ""}`;
  const clockTime = (value) => {
    if (!value) return "Time not set";
    const [hours, minutes] = value.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
  };
  const assignmentSchedules = (classRecord, subjectId) => classSchedules(classRecord)
    .filter((entry) => !entry.subjectId || entry.subjectId === subjectId);
  const assignmentScheduleText = (entry) => {
    const days = entry.days.map((day) => ({ Mon: "M", Tue: "T", Wed: "W", Thu: "Th", Fri: "F", Sat: "Sa", Sun: "Su" }[day] || day)).join("/");
    const times = entry.startTime && entry.endTime ? `${clockTime(entry.startTime)}–${clockTime(entry.endTime)}` : "Time not set";
    return `${days || "Days not set"} · ${times}`;
  };
  const assignmentScheduleConflict = (teacherId, classRecord, subjectId, assignmentId) => {
    if (!teacherId || !classRecord) return null;
    const selectedSchedules = assignmentSchedules(classRecord, subjectId);
    for (const assignment of state.data.assignments) {
      if (assignment.id === assignmentId || assignment.teacherId !== teacherId || assignment.classId === classRecord.id) continue;
      const otherClass = byId(state.data.classes, assignment.classId);
      if (!otherClass || otherClass.academicYear !== classRecord.academicYear || otherClass.semester !== classRecord.semester) continue;
      const conflict = selectedSchedules.some((left) => assignmentSchedules(otherClass, assignment.subjectId).some((right) =>
        left.days.some((day) => right.days.includes(day)) &&
        left.startTime && left.endTime && right.startTime && right.endTime &&
        left.startTime < right.endTime && right.startTime < left.endTime));
      if (conflict) return otherClass;
    }
    return null;
  };

  function toast(message, type = "success") {
    const region = $("#toast-region");
    const item = document.createElement("div");
    item.className = `toast toast-${type}`;
    item.innerHTML = `<span class="toast-mark">${type === "error" ? "!" : "✓"}</span><span>${escapeHtml(message)}</span>`;
    region.append(item);
    window.setTimeout(() => item.remove(), 3800);
  }

  async function loadData() {
    const stores = ["curricula", "subjects", "curriculumSubjects", "classes", "classSubjects", "teachers", "assignments"];
    const values = await Promise.all(stores.map((store) => AcademicDB.all(store)));
    state.data = Object.fromEntries(stores.map((store, index) => [store, values[index]]));
  }

  function modal(title, content, options = {}) {
    const { subtitle = "", wide = false, submitText = "Save changes" } = options;
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal-card${wide ? " modal-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header class="modal-header">
            <div><h2 id="modal-title">${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</div>
            <button type="button" class="icon-button modal-close" data-close-modal aria-label="Close dialog">×</button>
          </header>
          <form id="modal-form" novalidate>
            <div class="modal-body">${content}</div>
            <footer class="modal-footer"><button type="button" class="button button-quiet" data-close-modal>Cancel</button><button type="submit" class="button button-primary">${escapeHtml(submitText)}</button></footer>
          </form>
        </section>
      </div>`;
    $("#modal-form").addEventListener("submit", (event) => {
      event.preventDefault();
      handleForm(event.currentTarget).catch((error) => toast(error.message || "Something went wrong. Please try again.", "error"));
    });
    const focusable = $("input,select,button", $("#modal-form"));
    if (focusable) focusable.focus();
  }

  function closeModal() {
    modalRoot.innerHTML = "";
  }

  function field(label, control, hint = "") {
    return `<label class="form-field"><span class="field-label">${label}</span>${control}${hint ? `<small class="field-hint">${hint}</small>` : ""}</label>`;
  }

  function selectOptions(items, selected, labelFor, emptyText = "Select an option") {
    const options = items.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === selected ? " selected" : ""}>${escapeHtml(labelFor(item))}</option>`).join("");
    return `<option value="">${escapeHtml(emptyText)}</option>${options}`;
  }

  function pageHeading(eyebrow, title, description, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action}</div>`;
  }

  function emptyState(icon, title, description, action = "") {
    return `<div class="empty-state"><span class="empty-icon">${icon}</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
  }

  function buttonAction(action, label, classes = "button button-primary", extra = "") {
    return `<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;
  }

  async function render() {
    await loadData();
    const navLabels = { dashboard: "Overview", curricula: "Curriculum", subjects: "Subjects", classes: "Classes", assignments: "Teacher assignment" };
    $("#breadcrumb-current").textContent = state.route === "curricula" && state.detailCurriculumId ? "Curriculum details" : navLabels[state.route] || "Overview";
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.route === state.route));
    $("#nav-curricula").textContent = state.data.curricula.length;
    $("#nav-subjects").textContent = state.data.subjects.length;
    $("#nav-classes").textContent = state.data.classes.length;
    $("#nav-assignments").textContent = state.data.assignments.length;
    const renderers = {
      dashboard: renderDashboard,
      curricula: state.detailCurriculumId ? renderCurriculumDetail : renderCurricula,
      subjects: renderSubjects,
      classes: renderClasses,
      assignments: renderAssignments
    };
    page.innerHTML = (renderers[state.route] || renderDashboard)();
    if (state.route === "curricula" && !state.detailCurriculumId) applyCurriculumFilters();
    if (state.route === "subjects") applySubjectFilters();
    if (state.route === "classes") applyClassFilters();
  }

  function applyCurriculumFilters() {
    const folders = $("#curriculum-folders");
    if (!folders) return;
    let visible = 0;
    for (const card of $$(".curriculum-folder-card", folders)) {
      const show = !state.curriculumFilters.programId || card.dataset.program === state.curriculumFilters.programId;
      card.hidden = !show;
      if (show) visible += 1;
    }
    const noResults = $("#curriculum-no-results");
    noResults.hidden = visible > 0;
  }

  function applySubjectFilters() {
    const catalog = $("#subject-catalog");
    if (!catalog) return;
    const visibleIds = new Set();
    const expandMatches = Boolean(state.subjectFilters.yearLevel || state.subjectFilters.semester);
    for (const card of $$(".subject-card", catalog)) {
      const show = (!state.subjectFilters.programId || card.dataset.program === state.subjectFilters.programId) &&
        (!state.subjectFilters.yearLevel || card.dataset.year === state.subjectFilters.yearLevel) &&
        (!state.subjectFilters.semester || card.dataset.semester === state.subjectFilters.semester);
      card.hidden = !show;
      if (show) visibleIds.add(card.dataset.subjectId);
    }
    for (const folder of $$(".subject-semester-folder", catalog)) {
      const visible = Boolean($(".subject-card:not([hidden])", folder));
      folder.hidden = !visible;
      if (visible && (expandMatches || state.subjectFilters.semester === folder.dataset.semesterGroup)) folder.open = true;
    }
    for (const folder of $$(".subject-year-folder", catalog)) {
      const visible = Boolean($(".subject-semester-folder:not([hidden])", folder));
      folder.hidden = !visible;
      if (visible && (expandMatches || state.subjectFilters.yearLevel === folder.dataset.yearGroup)) folder.open = true;
    }
    for (const folder of $$(".subject-program-folder", catalog)) {
      const visible = Boolean($(".subject-card:not([hidden])", folder));
      folder.hidden = !visible;
      if (visible && (expandMatches || (state.subjectFilters.programId && folder.dataset.programFolder === state.subjectFilters.programId))) folder.open = true;
    }
    const count = $("#subject-result-count");
    count.textContent = `${visibleIds.size} ${visibleIds.size === 1 ? "subject" : "subjects"} shown`;
    $("#subject-no-results").hidden = visibleIds.size > 0;
    $("#clear-subject-filters").hidden = !Object.values(state.subjectFilters).some(Boolean);
  }

  function renderDashboard() {
    const { curricula, subjects, classes, teachers, assignments } = state.data;
    const setupComplete = curricula.length && subjects.length && classes.length;
    const upcoming = [...classes].sort((a, b) => a.academicYear.localeCompare(b.academicYear)).slice(0, 4);
    const recentAssignments = [...assignments].slice(-4).reverse();
    return `
      <section class="welcome-banner">
        <div class="welcome-copy"><span class="welcome-tag"><span></span> YOUR ACADEMIC WORKSPACE</span><h1>Good day, Administrator <span>✳</span></h1><p>Keep programs, classes, and teaching assignments organized from one place.</p></div>
        <div class="welcome-art" aria-hidden="true"><span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span><span class="art-cap">✦</span><span class="art-dot"></span></div>
      </section>
      <div class="section-title-row"><div><h2>Academic overview</h2><p>A quick look at your institution's records.</p></div><span class="period-chip"><span class="period-dot"></span> Live records</span></div>
      <section class="stats-grid">
        ${statCard("Active curricula", curricula.length, "Across all programs", "book", "purple")}
        ${statCard("Subjects", subjects.length, "In the subject catalog", "subject", "blue")}
        ${statCard("Class sections", classes.length, "Across academic years", "calendar", "orange")}
        ${statCard("Teaching assignments", assignments.length, `${teachers.length} teacher${teachers.length === 1 ? "" : "s"} in directory`, "people", "green")}
      </section>
      ${!setupComplete ? `<section class="setup-card"><div class="setup-icon">✦</div><div class="setup-copy"><h3>Start building your academic records</h3><p>Create curricula and add subjects first. Classes can then use curriculum subjects, and teachers can be assigned to those classes.</p></div><div class="setup-actions">${buttonAction("go-curricula", "Create a curriculum", "button button-primary")}${buttonAction("go-subjects", "Add subjects", "button button-quiet")}</div></section>` : ""}
      <div class="dashboard-columns">
        <section class="panel">
          <div class="panel-heading"><div><h2>Class sections</h2><p>Recently added class sections</p></div><a href="#classes" class="text-link">View all <span>→</span></a></div>
          ${upcoming.length ? `<div class="compact-list">${upcoming.map((item) => {
            const curr = byId(curricula, item.curriculumId);
            const count = state.data.classSubjects.filter((entry) => entry.classId === item.id).length;
            return `<div class="compact-row"><div class="list-icon list-icon-blue">▦</div><div class="compact-main"><strong>${escapeHtml(classTitle(item))}</strong><small>${escapeHtml(curr ? curr.year : "")} curriculum · ${escapeHtml(item.academicYear)} · ${escapeHtml(semesterName(item.semester))}</small></div><span class="row-meta">${count} subject${count === 1 ? "" : "s"}</span></div>`;
          }).join("")}</div>` : emptyState("▦", "No classes yet", "Create a class after setting up a curriculum.", buttonAction("go-classes", "Create class", "button button-secondary button-small"))}
        </section>
        <section class="panel">
          <div class="panel-heading"><div><h2>Teaching assignments</h2><p>Latest teacher allocations</p></div><a href="#assignments" class="text-link">View all <span>→</span></a></div>
          ${recentAssignments.length ? `<div class="compact-list">${recentAssignments.map((item) => {
            const teacher = byId(teachers, item.teacherId);
            const subject = byId(subjects, item.subjectId);
            const section = byId(classes, item.classId);
            return `<div class="compact-row"><div class="avatar avatar-soft">${escapeHtml(initial(teacher ? teacher.name : ""))}</div><div class="compact-main"><strong>${escapeHtml(teacher ? teacher.name : "Unknown teacher")}</strong><small>${escapeHtml(subject ? `${subject.code} · ${subject.name}` : "Unknown subject")}</small></div><span class="assignment-class">${escapeHtml(section ? section.section : "")}</span></div>`;
          }).join("")}</div>` : emptyState("♙", "No assignments yet", "Teachers can be assigned once a class and its subjects are ready.", buttonAction("go-assignments", "Assign a teacher", "button button-secondary button-small"))}
        </section>
      </div>
      <section class="program-strip"><div><span class="strip-icon">⌂</span><div><strong>Programs supported</strong><small>Each program has independent curricula and class sections.</small></div></div><div class="program-pills">${AcademicDB.activePrograms.map((item) => `<span class="program-pill">${item.code}</span>`).join("")}</div></section>`;
  }

  function statCard(title, count, caption, icon, color) {
    const paths = {
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8"/>',
      subject: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
      calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3.5v3M16 3.5v3M3.5 9.5h17M8 13h2M13 13h2M8 16.5h2"/>',
      people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 5.5a3.5 3.5 0 0 1 0 6.8M17.4 14a5.6 5.6 0 0 1 3.8 5.3"/>',
      room: '<path d="M3.5 20.5h17M5.5 20V4h13v16M8.5 8h2v2h-2zM13.5 8h2v2h-2zM8.5 13h2v2h-2zM13.5 13h2v2h-2zM10 20v-3h4v3"/>'
    };
    return `<article class="stat-card"><div class="stat-top"><span>${title}</span><span class="stat-icon stat-${color}"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[icon]}</svg></span></div><div class="stat-number">${count}</div><div class="stat-caption"><span class="caption-dot"></span>${caption}</div></article>`;
  }

  function renderCurricula() {
    const { curricula, curriculumSubjects } = state.data;
    const filters = state.curriculumFilters;
    const folderCards = [...new Set(curricula.map((item) => item.programId))].sort((a, b) => {
      return (program(a)?.code || "").localeCompare(program(b)?.code || "");
    }).map((programId) => {
      const course = program(programId);
      const versions = curricula.filter((item) => item.programId === programId).sort((a, b) => {
        const countA = curriculumSubjects.filter((item) => item.curriculumId === a.id).length;
        const countB = curriculumSubjects.filter((item) => item.curriculumId === b.id).length;
        return countB - countA || b.year.localeCompare(a.year);
      });
      const curriculum = versions[0];
      const offerings = curriculumSubjects.filter((item) => versions.some((version) => version.id === item.curriculumId));
      const primaryOfferings = offerings.filter((item) => item.curriculumId === curriculum.id);
      return `<article class="curriculum-folder-card" data-program="${programId}">
        <button class="folder-open" data-action="open-curriculum" data-id="${curriculum.id}" aria-label="Open ${escapeHtml(course.code)} curriculum folder">
          <span class="folder-open-top"><span class="folder-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6.5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11Z"/><path d="M3.5 9h17"/></svg></span><span class="course-badge course-${course.code.toLowerCase()}">${escapeHtml(course.code)}</span><span class="status-pill status-${curriculum.status === "inactive" ? "inactive" : "active"}">${curriculum.status === "inactive" ? "Inactive" : "Active"}</span></span>
          <strong class="folder-title">${escapeHtml(course.name)}</strong><span class="folder-year">Curriculum · ${escapeHtml(curriculum.year)}${versions.length > 1 ? ` · ${versions.length} versions` : ""}</span>
          <span class="folder-summary"><span><strong>${primaryOfferings.length}</strong> subjects</span><span><strong>4</strong> year levels</span><span><strong>8</strong> semesters</span></span>
          <span class="folder-open-label">Open curriculum folder <span aria-hidden="true">→</span></span>
        </button>
      </article>`;
    }).join("");
    return `${pageHeading("ACADEMIC STRUCTURE", "Curriculum", "Choose a program folder to browse its subjects by year level and semester.", buttonAction("new-curriculum", `<span class="button-plus">+</span> Add curriculum`))}
      <div class="info-banner"><span class="info-symbol">i</span><p>Each folder opens the curriculum arranged as year level → semester → subjects. Active curricula are the source of class subjects, and the shared catalog keeps subject details consistent.</p></div>
      <div class="curriculum-filter-bar">
        <label class="filter-field"><span>Program</span><select id="curriculum-filter-program"><option value="">All programs</option>${AcademicDB.activePrograms.map((item) => `<option value="${item.id}"${filters.programId === item.id ? " selected" : ""}>${item.code}</option>`).join("")}</select></label>
      </div>
      ${folderCards ? `<div class="curriculum-folder-grid" id="curriculum-folders">${folderCards}</div><div class="no-search-results folder-no-results" id="curriculum-no-results" hidden>No curriculum folders match these filters.</div>` : emptyState("▤", "No curricula created yet", "Create a curriculum for a program to organize subjects by year and semester.", buttonAction("new-curriculum", "Create your first curriculum"))}`;
  }

  function renderCurriculumDetail() {
    const curriculum = byId(state.data.curricula, state.detailCurriculumId);
    if (!curriculum) {
      state.detailCurriculumId = null;
      return renderCurricula();
    }
    const course = program(curriculum.programId);
    const offerings = state.data.curriculumSubjects.filter((item) => item.curriculumId === curriculum.id);
    const curriculumVersions = state.data.curricula.filter((item) => item.programId === curriculum.programId).sort((a, b) => {
      const countA = state.data.curriculumSubjects.filter((item) => item.curriculumId === a.id).length;
      const countB = state.data.curriculumSubjects.filter((item) => item.curriculumId === b.id).length;
      return countB - countA || b.year.localeCompare(a.year);
    });
    const addAction = buttonAction("new-offering", `<span class="button-plus">+</span> Add subject`);
    const years = [1, 2, 3, 4];
    const groups = years.map((level) => {
      const yearOfferings = offerings.filter((item) => Number(item.yearLevel) === level);
      const semesters = ["1", "2", ...(yearOfferings.some((item) => item.semester === "summer") ? ["summer"] : [])].map((semester) => {
        const entries = yearOfferings.filter((item) => item.semester === semester).sort((a, b) => {
        const subA = byId(state.data.subjects, a.subjectId);
        const subB = byId(state.data.subjects, b.subjectId);
        return (subA ? subA.code : "").localeCompare(subB ? subB.code : "");
      });
        const content = entries.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Subject code</th><th>Subject name</th><th>Prerequisite / corequisite</th><th>Lecture</th><th>Lab</th><th>Units</th><th>Status</th><th></th></tr></thead><tbody>${entries.map((entry) => {
          const subject = byId(state.data.subjects, entry.subjectId);
          const prerequisite = subject ? relationshipText(subject, "prerequisite", state.data.subjects) : "";
          const corequisite = subject ? relationshipText(subject, "corequisite", state.data.subjects) : "";
          return `<tr><td><span class="code-pill">${escapeHtml(subject ? subject.code : "—")}</span></td><td><strong>${escapeHtml(subject ? subject.name : "Missing subject")}</strong>${subject && subject.sourceNeedsReview ? '<small class="review-note">Verify source text</small>' : ""}</td><td>${prerequisite ? escapeHtml(prerequisite) : '<span class="muted">—</span>'}${corequisite ? `<small class="table-subline">Co: ${escapeHtml(corequisite)}</small>` : ""}</td><td>${subject ? Number(subject.lectureHours || 0) : "—"}</td><td>${subject ? Number(subject.laboratoryHours || 0) : "—"}</td><td>${subject ? subject.units : "—"}</td><td><span class="status-pill status-${subject && subject.status === "inactive" ? "inactive" : "active"}">${subject && subject.status === "inactive" ? "Inactive" : "Active"}</span></td><td><div class="table-actions"><button class="text-button" data-action="edit-subject" data-id="${subject.id}">Edit</button><button class="icon-button row-menu" data-action="remove-offering" data-id="${entry.id}" title="Remove from curriculum" aria-label="Remove subject from curriculum">×</button></div></td></tr>`;
        }).join("")}</tbody></table></div>` : '<p class="empty-semester">No subjects are filed in this semester yet.</p>';
        return `<details class="semester-folder" open><summary><span class="semester-folder-glyph" aria-hidden="true"></span><span>${escapeHtml(semesterName(semester))}</span><span class="folder-item-count">${entries.length} subject${entries.length === 1 ? "" : "s"}</span></summary>${content}</details>`;
      }).join("");
      return `<details class="year-folder" open><summary><span class="year-folder-glyph" aria-hidden="true"></span><strong>${yearName(level)}</strong><span class="folder-item-count">${yearOfferings.length} subject${yearOfferings.length === 1 ? "" : "s"}</span></summary><div class="year-folder-content">${semesters}</div></details>`;
    }).join("");
    const content = groups;
    return `<div class="back-row"><button class="back-link" data-action="back-curricula">← All curricula</button></div>
      ${pageHeading("CURRICULUM DETAILS", `${course.code} · ${escapeHtml(curriculum.year)}`, course.name,
        `<div class="heading-actions">${buttonAction("edit-curriculum", "Edit details", "button button-secondary")}${buttonAction("delete-curriculum", "Delete", "button button-danger-soft")}${addAction}</div>`)}
      <div class="curriculum-summary"><div><span class="summary-mark course-${course.code.toLowerCase()}">${course.code.slice(0, 2)}</span><div><strong>${course.code} — ${escapeHtml(course.name)}</strong><small>Curriculum year ${escapeHtml(curriculum.year)}</small></div></div><span>${offerings.length} curriculum subject${offerings.length === 1 ? "" : "s"}</span></div>
      ${curriculumVersions.length > 1 ? `<nav class="curriculum-version-tabs" aria-label="Curriculum versions">${curriculumVersions.map((version) => `<button class="version-tab${version.id === curriculum.id ? " version-tab-active" : ""}" data-action="open-curriculum" data-id="${version.id}">${escapeHtml(version.year)} <span>${state.data.curriculumSubjects.filter((item) => item.curriculumId === version.id).length}</span></button>`).join("")}</nav>` : ""}
      ${content}`;
  }

  function renderSubjects() {
    const { subjects, curriculumSubjects, classSubjects } = state.data;
    const action = buttonAction("new-subject", `<span class="button-plus">+</span> Add subject`);
    const cards = (items, curriculumId, yearLevel, semester) => [...items].sort((a, b) => a.code.localeCompare(b.code)).map((item) => {
      const prerequisite = relationshipText(item, "prerequisite", subjects);
      const corequisite = relationshipText(item, "corequisite", subjects);
      const curriculumCount = new Set(curriculumSubjects.filter((row) => row.subjectId === item.id).map((row) => row.curriculumId)).size;
      const classCount = new Set(classSubjects.filter((row) => row.subjectId === item.id).map((row) => row.classId)).size;
      return `<article class="subject-card" data-subject-id="${item.id}" data-program="${curriculumId ? byId(state.data.curricula, curriculumId).programId : ""}" data-year="${yearLevel || ""}" data-semester="${semester || ""}">
        <div class="subject-card-heading"><span class="code-pill">${escapeHtml(item.code)}</span></div>
        <h4>${escapeHtml(item.name)}</h4>${item.description && item.description !== item.name ? `<p class="subject-card-description">${escapeHtml(item.description)}</p>` : ""}
        ${item.sourceNeedsReview ? '<span class="review-note">Verify source details</span>' : ""}
        <div class="subject-card-facts"><span><strong>${Number(item.lectureHours || 0)}</strong> lecture</span><span><strong>${Number(item.laboratoryHours || 0)}</strong> lab</span><span><strong>${Number(item.units || 0)}</strong> units</span></div>
        <div class="subject-card-requirements"><span><b>Prerequisite</b>${prerequisite ? escapeHtml(prerequisite) : "None listed"}</span>${corequisite ? `<span><b>Corequisite</b>${escapeHtml(corequisite)}</span>` : ""}</div>
        <div class="subject-card-footer"><span>${curriculumCount} curriculum${curriculumCount === 1 ? "" : "s"} · ${classCount} class${classCount === 1 ? "" : "es"}</span><div class="table-actions"><button class="text-button" data-action="edit-subject" data-id="${item.id}">Edit</button><button class="text-button text-danger" data-action="delete-subject" data-id="${item.id}">Delete</button></div></div>
      </article>`;
    }).join("");
    const sections = state.data.curricula
      .slice()
      .sort((a, b) => {
        const programCompare = (program(a.programId)?.code || "").localeCompare(program(b.programId)?.code || "");
        return programCompare || b.year.localeCompare(a.year);
      })
      .map((curriculum) => {
        const course = program(curriculum.programId);
        const offerings = curriculumSubjects.filter((item) => item.curriculumId === curriculum.id);
        const yearGroups = [1, 2, 3, 4].map((level) => {
          const yearEntries = offerings.filter((item) => Number(item.yearLevel) === level);
          const semesterGroups = ["1", "2", "summer"].map((semester) => {
            const entries = yearEntries.filter((item) => item.semester === semester);
            if (!entries.length) return "";
            const items = [...new Map(entries.map((entry) => {
              const subject = byId(subjects, entry.subjectId);
              return subject ? [subject.id, subject] : null;
            }).filter(Boolean))].map(([, subject]) => subject);
            return `<details class="subject-semester-folder" data-semester-group="${semester}" open><summary><span>${escapeHtml(semesterName(semester))}</span><span class="folder-item-count">${items.length} subject${items.length === 1 ? "" : "s"}</span></summary><div class="subject-card-grid">${cards(items, curriculum.id, level, semester)}</div></details>`;
          }).join("");
          return semesterGroups ? `<details class="subject-year-folder" data-year-group="${level}" open><summary><strong>${yearName(level)}</strong><span class="folder-item-count">${yearEntries.length} subject${yearEntries.length === 1 ? "" : "s"}</span></summary><div class="subject-year-content">${semesterGroups}</div></details>` : "";
        }).join("");
        return `<details class="subject-program-folder" data-curriculum-id="${curriculum.id}" data-program-folder="${curriculum.programId}" open><summary><span class="course-badge course-${course.code.toLowerCase()}">${course.code}</span><strong>${escapeHtml(course.name)}</strong><span class="subject-curriculum-year">${escapeHtml(curriculum.year)}</span><span class="folder-item-count">${offerings.length} subjects</span></summary><div class="subject-program-content">${yearGroups || '<p class="empty-semester">No subjects have been assigned to this curriculum yet.</p>'}</div></details>`;
      }).join("");
    const assignedSubjectIds = new Set(curriculumSubjects.map((entry) => entry.subjectId));
    const unassigned = subjects.filter((subject) => !assignedSubjectIds.has(subject.id));
    const unassignedSection = unassigned.length ? `<details class="subject-program-folder subject-unassigned-folder"><summary><strong>Unassigned catalog subjects</strong><span class="folder-item-count">${unassigned.length} subjects</span></summary><div class="subject-card-grid">${cards(unassigned, "", "", "")}</div></details>` : "";
    return `${pageHeading("ACADEMIC CATALOG", "Subjects", "Maintain the shared subject catalog used by curricula and class sections.", action)}
      <div class="subject-filter-panel">
        <label class="filter-field"><span>Program</span><select id="subject-filter-program"><option value="">All programs</option>${AcademicDB.activePrograms.map((item) => `<option value="${item.id}"${state.subjectFilters.programId === item.id ? " selected" : ""}>${item.code}</option>`).join("")}</select></label>
        <label class="filter-field"><span>Year level</span><select id="subject-filter-year"><option value="">All years</option>${[1, 2, 3, 4].map((year) => `<option value="${year}"${String(year) === state.subjectFilters.yearLevel ? " selected" : ""}>${yearName(year)}</option>`).join("")}</select></label>
        <label class="filter-field"><span>Semester</span><select id="subject-filter-semester"><option value="">All semesters</option><option value="1"${state.subjectFilters.semester === "1" ? " selected" : ""}>1st semester</option><option value="2"${state.subjectFilters.semester === "2" ? " selected" : ""}>2nd semester</option><option value="summer"${state.subjectFilters.semester === "summer" ? " selected" : ""}>Summer</option></select></label>
      </div>
      <div class="subject-results-heading"><strong id="subject-result-count">${subjects.length} catalog subjects</strong><button type="button" class="subject-clear-filters" id="clear-subject-filters" data-action="clear-subject-filters" hidden>Clear filters</button></div>
      ${subjects.length ? `<div id="subject-catalog">${sections}${unassignedSection}<div class="no-search-results subject-no-results" id="subject-no-results" hidden>No subjects match these filters.</div></div>` : emptyState("▦", "Your subject catalog is empty", "Add subjects here first, then include them in one or more curricula.", buttonAction("new-subject", "Add your first subject"))}`;
  }

  function renderClasses() {
    const { classes, classSubjects, assignments, subjects, teachers } = state.data;
    const action = buttonAction("new-class", `<span class="button-plus">+</span> Add class`);
    const classYears = [...new Set(classes.map((item) => item.academicYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const assignedTeacherIds = new Set(assignments.map((item) => item.teacherId));
    const classTeachers = teachers.filter((item) => assignedTeacherIds.has(item.id)).sort((a, b) => a.name.localeCompare(b.name));
    const programs = AcademicDB.activePrograms;
    const folders = [...classes].sort((a, b) =>
      b.academicYear.localeCompare(a.academicYear) ||
      a.programId.localeCompare(b.programId) ||
      Number(a.yearLevel) - Number(b.yearLevel) ||
      a.section.localeCompare(b.section)
    ).map((item) => {
      const course = program(item.programId);
      const linkedSubjects = classSubjects.filter((row) => row.classId === item.id).map((row) => byId(subjects, row.subjectId)).filter(Boolean);
      const classSubjectRows = linkedSubjects.length ? linkedSubjects : [null];
      const schedules = classSchedules(item);
      const rows = classSubjectRows.map((subject) => {
        const assignment = subject && assignments.find((row) => row.classId === item.id && row.subjectId === subject.id);
        const teacher = assignment && byId(teachers, assignment.teacherId);
        const subjectSchedules = schedules.filter((entry) => !entry.subjectId || (subject && entry.subjectId === subject.id));
        const scheduleCell = subjectSchedules.map((entry) => {
          const details = [entry.startTime && entry.endTime ? `${entry.startTime}–${entry.endTime}` : "", entry.building, entry.mode].filter(Boolean).join(" · ");
          return `<div class="class-schedule-entry"><strong>${escapeHtml(scheduleText(entry))}</strong>${details ? `<small>${escapeHtml(details)}</small>` : ""}</div>`;
        }).join("");
        const rooms = [...new Set(subjectSchedules.map((entry) => [entry.room, entry.building].filter(Boolean).join(" · ")).filter(Boolean))];
        return `<tr data-class-id="${escapeHtml(item.id)}" data-program="${escapeHtml(item.programId)}" data-year="${Number(item.yearLevel)}" data-academic-year="${escapeHtml(item.academicYear)}" data-semester="${escapeHtml(item.semester)}" data-teacher="${escapeHtml(assignment ? assignment.teacherId : "")}" data-status="${escapeHtml(item.status || "active")}">
          <td>${subject ? `<span class="code-pill">${escapeHtml(subject.code)}</span>` : '<span class="muted">No subject</span>'}</td>
          <td><strong>${escapeHtml(subject ? subject.name : "—")}</strong></td><td class="units-value">${subject ? Number(subject.units) : "—"}</td>
          <td>${teacher ? `<div class="class-teacher"><strong>${escapeHtml(teacher.name)}</strong><small>Teacher ID: ${escapeHtml(teacher.id)}</small></div>` : '<span class="muted">Not assigned</span>'}</td>
          <td>${scheduleCell || '<span class="muted">Not scheduled</span>'}</td>
          <td>${rooms.length ? rooms.map((room) => `<span class="class-room">${escapeHtml(room)}</span>`).join("") : '<span class="muted">—</span>'}</td>
          <td><span class="status-pill status-${item.status === "inactive" || item.status === "cancelled" ? "inactive" : "active"}">${escapeHtml(item.status || "active")}</span></td>
          <td><button class="text-button" data-action="view-class" data-id="${escapeHtml(item.id)}">View schedule</button></td>
        </tr>`;
      }).join("");
      const folderCode = course ? course.code.replace(/^BS/, "") : "CLASS";
      const folderName = /^[A-Z]{2,5}\s*\d/i.test(item.section.trim())
        ? item.section.trim()
        : `${folderCode}${Number(item.yearLevel)}${item.section}`;
      const teachersInClass = [...new Set(assignments.filter((assignment) => assignment.classId === item.id).map((assignment) => byId(teachers, assignment.teacherId)).filter(Boolean).map((teacher) => teacher.name))];
      const roomCount = new Set(schedules.map((entry) => [entry.room, entry.building].filter(Boolean).join(" · ")).filter(Boolean)).size;
      return `<details class="class-section-folder" data-class-folder data-class-id="${escapeHtml(item.id)}" data-program="${escapeHtml(item.programId)}" data-year="${Number(item.yearLevel)}" data-section="${escapeHtml(item.section)}" data-academic-year="${escapeHtml(item.academicYear)}" data-semester="${escapeHtml(item.semester)}" data-status="${escapeHtml(item.status || "active")}">
        <summary>
          <span class="class-folder-icon" aria-hidden="true">▣</span>
          <span class="class-folder-title"><strong>${escapeHtml(folderName)}</strong><small>${escapeHtml(course ? course.code : "Program")} · ${yearName(item.yearLevel)} · Section ${escapeHtml(item.section)}</small></span>
          <span class="class-folder-period">${escapeHtml(item.academicYear)} · ${escapeHtml(semesterName(item.semester))}</span>
          <span class="class-folder-meta">${linkedSubjects.length} subject${linkedSubjects.length === 1 ? "" : "s"} · ${schedules.length} meeting${schedules.length === 1 ? "" : "s"} · ${roomCount} room${roomCount === 1 ? "" : "s"}</span>
          <span class="status-pill status-${item.status === "inactive" || item.status === "cancelled" ? "inactive" : "active"}">${escapeHtml(item.status || "active")}</span>
        </summary>
        <div class="class-folder-content">
          <div class="class-folder-toolbar"><span>${teachersInClass.length ? `Teacher${teachersInClass.length === 1 ? "" : "s"}: ${escapeHtml(teachersInClass.join(", "))}` : "Teachers not assigned"}</span><div class="table-actions"><button class="text-button" data-action="edit-class" data-id="${escapeHtml(item.id)}">Edit class</button><button class="text-button text-danger" data-action="delete-class" data-id="${escapeHtml(item.id)}">Delete class</button></div></div>
          <div class="table-wrap"><table class="data-table class-folder-table"><thead><tr><th>Subject code</th><th>Subject name</th><th>Units</th><th>Teacher</th><th>Schedule</th><th>Room / building</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
        </div>
      </details>`;
    }).join("");
    const filters = state.classFilters;
    const clearButton = `<button type="button" class="button button-secondary" id="clear-class-filters" data-action="clear-class-filters">Clear filters</button>`;
    const searchAndExport = `<div class="classes-table-toolbar"><label class="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4 4"/></svg><input id="class-search" type="search" value="${escapeHtml(filters.search)}" placeholder="Search classes..." aria-label="Search classes"></label><button type="button" class="button button-secondary" data-action="export-classes">Export CSV</button></div>`;
    const scheduleBulkActions = `<div class="class-schedule-bulk-actions"><div><strong>Bulk schedule action</strong><small>Delete schedules from all class sections. Class records remain.</small></div><button type="button" class="button button-danger-soft" data-action="delete-all-class-schedules">Delete all schedules</button></div>`;
    return `${pageHeading("ACADEMIC MANAGEMENT", "Classes", "Manage section subjects, schedules, rooms, and teachers.", action)}
      <div class="info-banner"><span class="info-symbol">i</span><p>Each class section is organized as a folder. Open a section to review all curriculum subjects, assigned teachers, and schedules together.</p></div>
      <section class="classes-section">
        <div class="toolbar classes-toolbar"><span class="toolbar-count" id="class-result-count">${classes.length} class section${classes.length === 1 ? "" : "s"}</span>${searchAndExport}</div>
        <div class="class-list-panel">
        <div class="classes-filter-panel class-filter-card">
          <label class="filter-field"><span>Program</span><select id="class-filter-program"><option value="">All</option>${programs.map((item) => `<option value="${escapeHtml(item.id)}"${filters.programId === item.id ? " selected" : ""}>${escapeHtml(item.code)}</option>`).join("")}</select></label>
          <label class="filter-field"><span>Year level</span><select id="class-filter-year"><option value="">All</option>${[1, 2, 3, 4, 5].map((year) => `<option value="${year}"${filters.yearLevel === String(year) ? " selected" : ""}>${yearName(year)}</option>`).join("")}</select></label>
          <label class="filter-field"><span>School year</span><select id="class-filter-academic-year"><option value="">All</option>${classYears.map((year) => `<option value="${escapeHtml(year)}"${filters.academicYear === year ? " selected" : ""}>${escapeHtml(year)}</option>`).join("")}</select></label>
          <label class="filter-field"><span>Semester</span><select id="class-filter-semester"><option value="">All</option><option value="1"${filters.semester === "1" ? " selected" : ""}>1st semester</option><option value="2"${filters.semester === "2" ? " selected" : ""}>2nd semester</option><option value="summer"${filters.semester === "summer" ? " selected" : ""}>Summer</option></select></label>
          <label class="filter-field"><span>Class teacher</span><select id="class-filter-teacher"><option value="">All</option>${classTeachers.map((item) => `<option value="${escapeHtml(item.id)}"${filters.teacherId === item.id ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
          <label class="filter-field"><span>Status</span><select id="class-filter-status"><option value="">All</option><option value="active"${filters.status === "active" ? " selected" : ""}>Active</option><option value="inactive"${filters.status === "inactive" ? " selected" : ""}>Inactive</option><option value="cancelled"${filters.status === "cancelled" ? " selected" : ""}>Cancelled</option></select></label>
          ${clearButton}
        </div>
        ${classes.length ? `<div class="table-card class-section-list" id="classes-table">${folders}<div class="no-search-results" id="class-no-results" hidden>No classes match these filters.</div></div>` : emptyState("▦", "No class sections yet", "Create curricula and add subjects before opening a class section.", buttonAction("new-class", "Create your first class"))}
        </div>
      </section>`;
  }

  function applyClassFilters() {
    const container = $("#classes-table");
    if (!container) return;
    const filters = state.classFilters;
    const search = filters.search.toLocaleLowerCase().trim();
    const visibleClassIds = new Set();
    let visibleSubjectRows = 0;
    for (const folder of $$(".class-section-folder", container)) {
      const rows = $$("tbody tr", folder);
      const visibleRows = rows.filter((row) => {
        const show = (!filters.programId || row.dataset.program === filters.programId) &&
          (!filters.yearLevel || row.dataset.year === filters.yearLevel) &&
          (!filters.academicYear || row.dataset.academicYear === filters.academicYear) &&
          (!filters.semester || row.dataset.semester === filters.semester) &&
          (!filters.teacherId || row.dataset.teacher === filters.teacherId) &&
          (!filters.status || row.dataset.status === filters.status) &&
          (!search || `${row.textContent} ${folder.textContent}`.toLocaleLowerCase().includes(search));
        row.hidden = !show;
        if (show) visibleSubjectRows += 1;
        return show;
      });
      const showFolder = visibleRows.length > 0;
      folder.hidden = !showFolder;
      if (showFolder) {
        visibleClassIds.add(folder.dataset.classId);
        if (filters.programId || filters.yearLevel || filters.academicYear || filters.semester || filters.teacherId || filters.status || search) folder.open = true;
      }
    }
    const count = $("#class-result-count");
    count.textContent = `${visibleClassIds.size} class section${visibleClassIds.size === 1 ? "" : "s"} · ${visibleSubjectRows} subject listing${visibleSubjectRows === 1 ? "" : "s"}`;
    $("#class-no-results").hidden = visibleClassIds.size > 0;
  }

  function exportClassesCsv() {
    const container = $("#classes-table");
    if (!container) return;
    const headers = ["Program", "Year level", "Section", "Academic year", "Semester", "Subject code", "Subject name", "Units", "Teacher", "Schedule", "Room / building", "Status"];
    const visibleRows = $$(".class-section-folder:not([hidden]) tbody tr:not([hidden])", container).map((row) =>
      [
        program(row.dataset.program)?.code || "",
        yearName(Number(row.dataset.year)),
        row.closest(".class-section-folder").dataset.section,
        row.closest(".class-section-folder").dataset.academicYear,
        semesterName(row.closest(".class-section-folder").dataset.semester),
        $(".code-pill", row)?.textContent.trim() || "No subject",
        $("td:nth-child(2)", row).innerText.trim(),
        $("td:nth-child(3)", row).innerText.trim(),
        $(".class-teacher strong", row)?.textContent.trim() || "Not assigned",
        $("td:nth-child(5)", row).innerText.trim().replace(/\s+/g, " ") || "Not scheduled",
        $$(".class-room", row).map((room) => room.innerText.trim()).join("; ") || "—",
        row.closest(".class-section-folder").dataset.status
      ]);
    const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...visibleRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "class-sections.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openClassDetails(classId) {
    const classRecord = byId(state.data.classes, classId);
    if (!classRecord) return;
    const course = program(classRecord.programId);
    const curriculum = byId(state.data.curricula, classRecord.curriculumId);
    const linkedSubjects = state.data.classSubjects.filter((item) => item.classId === classId).map((link) => {
      const subject = byId(state.data.subjects, link.subjectId);
      const assignment = state.data.assignments.find((item) => item.classId === classId && item.subjectId === link.subjectId);
      const teacher = assignment && byId(state.data.teachers, assignment.teacherId);
      return subject ? { subject, teacher } : null;
    }).filter(Boolean).sort((left, right) => left.subject.code.localeCompare(right.subject.code));
    const subjectRows = linkedSubjects.map(({ subject, teacher }) =>
      `<tr><td><span class="code-pill">${escapeHtml(subject.code)}</span></td><td><strong>${escapeHtml(subject.name)}</strong></td><td>${Number(subject.units)}</td><td>${teacher ? `<div class="class-teacher"><strong>${escapeHtml(teacher.name)}</strong><small>Teacher ID: ${escapeHtml(teacher.id)}</small></div>` : '<span class="muted">Not assigned</span>'}</td></tr>`
    ).join("");
    const schedules = classSchedules(classRecord);
    const scheduleCards = schedules.map((entry, index) => {
      const location = [entry.room, entry.building].filter(Boolean);
      const scheduledSubject = entry.subjectId && byId(state.data.subjects, entry.subjectId);
      const scheduledAssignment = scheduledSubject && linkedSubjects.find((item) => item.subject.id === scheduledSubject.id);
      const scheduledTeacher = scheduledAssignment && scheduledAssignment.teacher;
      return `<article class="section-schedule-card">
        <div class="section-schedule-index">${String(index + 1).padStart(2, "0")}</div>
        <div class="section-schedule-main"><strong>${scheduledSubject ? `${escapeHtml(scheduledSubject.code)} · ${escapeHtml(scheduledSubject.name)}` : "Section meeting"}</strong><span class="section-schedule-days">${entry.days.length ? entry.days.map((day) => `<span>${escapeHtml(day)}</span>`).join("") : '<span>Days not set</span>'}</span><strong>${escapeHtml(entry.startTime && entry.endTime ? `${entry.startTime}–${entry.endTime}` : "Time not set")}</strong><small>${scheduledTeacher ? `Teacher: ${escapeHtml(scheduledTeacher.name)}` : scheduledSubject ? "Teacher not assigned" : "Subject and teacher not linked"}</small></div>
        <div class="section-schedule-location"><strong>${escapeHtml(location.join(" · ") || "Location not set")}</strong><small>${escapeHtml(entry.mode || "Mode not set")}</small><div class="section-schedule-actions"><button type="button" class="text-button" data-action="edit-class-schedule" data-id="${escapeHtml(classId)}" data-index="${index}">Edit</button><button type="button" class="text-button text-danger" data-action="delete-class-schedule" data-id="${escapeHtml(classId)}" data-index="${index}">Delete</button></div></div>
      </article>`;
    }).join("");
    const assignedCount = linkedSubjects.filter((item) => item.teacher).length;
    modal(`${course ? course.code : "Class"} · Section ${classRecord.section}`,
      `<div class="section-profile">
        <header class="section-profile-heading"><span class="course-avatar course-${(course ? course.code : "bsit").toLowerCase()}">${course ? course.code.slice(0, 2) : "—"}</span><div><span class="eyebrow">CLASS SECTION</span><h3>${escapeHtml(course ? course.code : "Class")} · ${yearName(classRecord.yearLevel)} · Section ${escapeHtml(classRecord.section)}</h3><p>${escapeHtml(course ? course.name : "Program unavailable")}</p></div><span class="status-pill status-${classRecord.status === "inactive" || classRecord.status === "cancelled" ? "inactive" : "active"}">${escapeHtml(classRecord.status || "active")}</span></header>
        <div class="class-detail-summary"><div><small>ACADEMIC YEAR</small><strong>${escapeHtml(classRecord.academicYear)}</strong></div><div><small>SEMESTER</small><strong>${escapeHtml(semesterName(classRecord.semester))}</strong></div><div><small>CURRICULUM</small><strong>${escapeHtml(curriculum ? curriculum.year : "Unavailable")}</strong></div><div><small>CLASS ID</small><strong title="${escapeHtml(classRecord.id)}">${escapeHtml(classRecord.id)}</strong></div></div>
        <section class="class-detail-section"><div class="class-detail-heading"><div><h3>Section schedule</h3><p>All meeting times and locations for this section</p></div><button type="button" class="button button-secondary button-small" data-action="edit-class" data-id="${escapeHtml(classId)}">${schedules.length ? "Edit class" : "Add schedule"}</button></div>${scheduleCards ? `<div class="section-schedule-list">${scheduleCards}</div>` : '<p class="empty-semester">No schedule entries set. Add a schedule to this class whenever you are ready.</p>'}</section>
        <section class="class-detail-section"><div class="class-detail-heading"><div><h3>Subjects and teachers</h3><p>Subjects included from this section’s curriculum</p></div><span>${linkedSubjects.length} subjects · ${assignedCount} teachers assigned</span></div>${subjectRows ? `<div class="table-wrap"><table class="data-table class-detail-subjects"><thead><tr><th>Subject code</th><th>Subject name</th><th>Units</th><th>Teacher</th></tr></thead><tbody>${subjectRows}</tbody></table></div>` : '<p class="empty-semester">No curriculum subjects are linked to this class.</p>'}</section>
        <p class="class-detail-id">Section records remain connected to Curriculum and Teacher Assignment.</p>
      </div>`,
      { subtitle: course ? course.name : "Class details", wide: true, submitText: "Close" });
    const form = $("#modal-form");
    form.dataset.type = "class-view";
    $(".modal-footer", form).innerHTML = '<button type="button" class="button button-primary" data-close-modal>Close</button>';
  }

  function renderAssignments() {
    const { assignments, classes, subjects, teachers } = state.data;
    const action = `<div class="heading-actions">${buttonAction("new-teacher", "+ Add teacher", "button button-secondary")}${buttonAction("new-assignment", `<span class="button-plus">+</span> Assign teacher`)}</div>`;
    const rows = [...assignments].reverse().map((item) => {
      const teacher = byId(teachers, item.teacherId);
      const classRecord = byId(classes, item.classId);
      const subject = byId(subjects, item.subjectId);
      const course = classRecord ? program(classRecord.programId) : null;
      const schedules = classRecord ? assignmentSchedules(classRecord, item.subjectId) : [];
      const rooms = [...new Set(schedules.map((entry) => entry.room).filter(Boolean))];
      const status = teacher && teacher.status === "inactive" ? "Inactive" : "Active";
      return `<tr><td><span class="id-value">${escapeHtml(teacher ? teacher.id : "—")}</span></td>
        <td><div class="teacher-cell"><span class="avatar avatar-soft">${escapeHtml(initial(teacher ? teacher.name : ""))}</span><div><strong>${escapeHtml(teacher ? teacher.name : "Unknown teacher")}</strong><small>${escapeHtml(teacher && teacher.department || "Department not set")} · ${escapeHtml(teacher && teacher.employmentType || "Part-Time")}</small></div></div></td>
        <td><strong>${escapeHtml(course ? course.code : "—")}</strong><small class="table-subline">${escapeHtml(classRecord ? classRecord.academicYear : "—")} · ${escapeHtml(classRecord ? semesterName(classRecord.semester) : "—")}</small></td>
        <td>${classRecord ? yearName(classRecord.yearLevel) : "—"}</td><td><strong>${escapeHtml(classRecord ? classRecord.section : "—")}</strong></td>
        <td><span class="code-pill">${escapeHtml(subject ? subject.code : "—")}</span></td><td><strong>${escapeHtml(subject ? subject.name : "Unknown subject")}</strong><small class="table-subline">${subject ? `${Number(subject.units)} units` : "Units unavailable"}</small></td>
        <td><div class="assignment-schedule">${schedules.length ? schedules.map((entry) => `<div><strong>${escapeHtml(assignmentScheduleText(entry))}</strong><small>${escapeHtml([entry.building, entry.mode].filter(Boolean).join(" · ") || "Class mode not set")}</small></div>`).join("") : '<span class="muted">Schedule not set</span>'}</div></td>
        <td>${rooms.length ? rooms.map((room) => `<span class="class-room">${escapeHtml(room)}</span>`).join("") : '<span class="muted">—</span>'}</td>
        <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
        <td><div class="table-actions"><button class="text-button" data-action="view-teacher" data-id="${escapeHtml(item.teacherId)}">View</button><button class="text-button" data-action="edit-assignment" data-id="${escapeHtml(item.id)}">Edit assignment</button><button class="text-button text-danger" data-action="delete-assignment" data-id="${escapeHtml(item.id)}">Remove</button></div></td></tr>`;
    }).join("");
    return `${pageHeading("FACULTY & TEACHING", "Teacher assignment", "Assign teachers to subjects that are included in each class section.", action)}
      <div class="info-banner"><span class="info-symbol">i</span><p>Assignments use the existing class, curriculum subject, and schedule records. Choose a class and active teacher; the class and subject details are filled in automatically.</p></div>
      <div class="toolbar"><label class="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4 4"/></svg><input id="assignment-search" type="search" placeholder="Search teacher, subject, or class" aria-label="Search teacher assignments"></label><span class="toolbar-count">${assignments.length} assignment${assignments.length === 1 ? "" : "s"}</span></div>
      ${assignments.length ? `<div class="table-card"><div class="table-wrap"><table class="data-table assignments-table" id="assignments-table"><thead><tr><th>Teacher ID</th><th>Teacher name / department</th><th>Program / academic period</th><th>Year level</th><th>Section</th><th>Subject code</th><th>Subject name / units</th><th>Schedule / building / mode</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div><div class="no-search-results" id="assignment-no-results" hidden>No assignments match your search.</div></div>` : emptyState("♙", "No teacher assignments yet", "Create a class and select its subjects before assigning a teacher.", buttonAction("new-assignment", "Assign your first teacher"))}`;
  }

  function subjectForm(subject) {
    const options = state.data.subjects.filter((item) => !subject || item.id !== subject.id);
    const subjectSelect = (name, selected, emptyText) => `<select name="${name}"><option value="">${emptyText}</option>${options.map((item) => `<option value="${item.id}"${subject && selected === item.id ? " selected" : ""}>${escapeHtml(item.code)} · ${escapeHtml(item.name)}</option>`).join("")}</select>`;
    const relationCodes = (relation) => {
      const ids = subject ? [...new Set([...(subject[`${relation}Ids`] || []), ...(subject[`${relation}Id`] ? [subject[`${relation}Id`]] : [])])] : [];
      const codes = ids.map((id) => byId(state.data.subjects, id)).filter(Boolean).map((item) => item.code);
      return [...new Set([...codes, ...(subject ? subject[`${relation}Codes`] || [] : [])])].join(", ");
    };
    return `<div class="form-grid">
      ${field("Subject code", `<input name="code" maxlength="20" placeholder="e.g. CPROG1" value="${escapeHtml(subject ? subject.code : "")}" required>`, "A unique code used across the shared subject catalog.")}
      ${field("Subject name", `<input name="name" maxlength="120" placeholder="Subject description/name" value="${escapeHtml(subject ? subject.name : "")}" required>`)}
      ${field("Description", `<input name="description" maxlength="240" placeholder="Optional subject description" value="${escapeHtml(subject ? subject.description || "" : "")}">`)}
      ${field("Credit units", `<input name="units" type="number" min="0.5" max="30" step="0.5" placeholder="e.g. 3" value="${subject ? subject.units : ""}" required>`)}
      ${field("Lecture hours", `<input name="lectureHours" type="number" min="0" max="20" step="0.5" value="${subject ? Number(subject.lectureHours || 0) : 0}" required>`)}
      ${field("Laboratory hours", `<input name="laboratoryHours" type="number" min="0" max="30" step="0.5" value="${subject ? Number(subject.laboratoryHours || 0) : 0}" required>`)}
      ${field("Primary prerequisite", subjectSelect("prerequisiteId", subject && subject.prerequisiteId, "No prerequisite"))}
      ${field("Other prerequisite codes", `<input name="prerequisiteCodes" maxlength="200" placeholder="Comma-separated subject codes" value="${escapeHtml(relationCodes("prerequisite"))}">`)}
      ${field("Primary corequisite", subjectSelect("corequisiteId", subject && subject.corequisiteId, "No corequisite"))}
      ${field("Other corequisite codes", `<input name="corequisiteCodes" maxlength="200" placeholder="Comma-separated subject codes" value="${escapeHtml(relationCodes("corequisite"))}">`)}
      ${field("Prerequisite note", `<input name="prerequisiteText" maxlength="160" placeholder="e.g. 3rd year standing" value="${escapeHtml(subject ? subject.prerequisiteText || "" : "")}">`)}
      ${field("Corequisite note", `<input name="corequisiteText" maxlength="160" placeholder="Optional standing or other requirement" value="${escapeHtml(subject ? subject.corequisiteText || "" : "")}">`)}
      ${field("Source note", `<input name="sourceNote" maxlength="240" placeholder="Source verification note" value="${escapeHtml(subject ? subject.sourceNote || "" : "")}">`)}
      <label class="review-checkbox"><input type="checkbox" name="sourceNeedsReview"${subject && subject.sourceNeedsReview ? " checked" : ""}><span>Flag source text/code for verification</span></label>
      ${field("Subject status", `<select name="status"><option value="active"${!subject || subject.status !== "inactive" ? " selected" : ""}>Active</option><option value="inactive"${subject && subject.status === "inactive" ? " selected" : ""}>Inactive</option></select>`)}
    </div>`;
  }

  function curriculumForm(curriculum) {
    const programOptions = curriculum && !AcademicDB.activePrograms.some((item) => item.id === curriculum.programId)
      ? [...AcademicDB.activePrograms, program(curriculum.programId)]
      : AcademicDB.activePrograms;
    return `<div class="form-grid">
      ${field("Program / course", `<select name="programId" required>${selectOptions(programOptions.filter(Boolean), curriculum && curriculum.programId, (item) => `${item.code} — ${item.name}${item.archived ? " · archived" : ""}`)}</select>`)}
      ${field("Curriculum year", `<input name="year" maxlength="30" placeholder="e.g. 2024" value="${escapeHtml(curriculum ? curriculum.year : "")}" required>`, "Use the year or version label students use to identify this curriculum.")}
      ${field("Curriculum status", `<select name="status"><option value="active"${!curriculum || curriculum.status !== "inactive" ? " selected" : ""}>Active</option><option value="inactive"${curriculum && curriculum.status === "inactive" ? " selected" : ""}>Inactive</option></select>`)}
    </div>`;
  }

  function offeringForm(curriculum, offering) {
    const offeredSubjectIds = new Set(state.data.curriculumSubjects.filter((item) => item.curriculumId === curriculum.id && item.id !== (offering && offering.id)).map((item) => item.subjectId));
    const choices = state.data.subjects.filter((item) => !offeredSubjectIds.has(item.id) || (offering && item.id === offering.subjectId));
    return `<input type="hidden" name="curriculumId" value="${curriculum.id}"><div class="form-grid">
      ${field("Subject", `<select name="subjectId" required>${selectOptions(choices, offering && offering.subjectId, (item) => `${item.code} · ${item.name}`)}</select>`)}
      ${field("Year level", `<select name="yearLevel" required>${Array.from({ length: 5 }, (_, index) => `<option value="${index + 1}"${offering && Number(offering.yearLevel) === index + 1 ? " selected" : ""}>${yearName(index + 1)}</option>`).join("")}</select>`)}
      ${field("Semester", `<select name="semester" required><option value="">Select a semester</option><option value="1"${offering && offering.semester === "1" ? " selected" : ""}>1st semester</option><option value="2"${offering && offering.semester === "2" ? " selected" : ""}>2nd semester</option><option value="summer"${offering && offering.semester === "summer" ? " selected" : ""}>Summer</option></select>`)}
    </div>${choices.length ? "" : '<p class="inline-note">All catalog subjects are already in this curriculum. Add a new subject in the Subjects module first.</p>'}`;
  }

  function classScheduleEntryForm(entry = {}, index = 0, canRemove = true) {
    const days = entry.days || entry.scheduleDays || [];
    const modes = ["On campus", "Hybrid", "Online"];
    return `<fieldset class="schedule-entry" data-schedule-index="${index}">
      <legend>Meeting ${String(index + 1).padStart(2, "0")}</legend>
      <input type="hidden" name="scheduleSubjectId" value="${escapeHtml(entry.subjectId || "")}">
      <div class="schedule-entry-heading"><span>Recurring meeting details</span>${canRemove ? '<button type="button" class="text-button text-danger" data-action="remove-class-schedule">Remove meeting</button>' : ""}</div>
      <div class="form-field schedule-days-field"><span class="field-label">Meeting days <span class="required-indicator">Required</span></span><small class="field-hint">Select every day this class meets each week.</small><div class="day-picker">${[["Mon", "Monday"], ["Tue", "Tuesday"], ["Wed", "Wednesday"], ["Thu", "Thursday"], ["Fri", "Friday"], ["Sat", "Saturday"], ["Sun", "Sunday"]].map(([day, label]) => `<label title="${label}"><input type="checkbox" name="scheduleDays" value="${day}"${days.includes(day) ? " checked" : ""}><span>${day}</span></label>`).join("")}</div></div>
      <div class="form-grid schedule-entry-fields">
        ${field("Start time", `<input name="startTime" type="time" aria-label="Meeting start time" value="${escapeHtml(entry.startTime || "")}" required>`, "Use the time picker.")}
        ${field("End time", `<input name="endTime" type="time" aria-label="Meeting end time" value="${escapeHtml(entry.endTime || "")}" required>`, "Must be later than the start time.")}
        ${field("Room", `<input name="room" maxlength="60" placeholder="e.g. Lab 204" value="${escapeHtml(entry.room || "")}" required>`, "Required for every meeting.")}
        ${field("Building", `<input name="building" maxlength="80" placeholder="e.g. Engineering Building" value="${escapeHtml(entry.building || "")}">`)}
        ${field("Class mode", `<select name="mode">${modes.map((mode) => `<option value="${mode}"${(entry.mode || "On campus") === mode ? " selected" : ""}>${mode}</option>`).join("")}</select>`)}
      </div>
    </fieldset>`;
  }

  function readClassScheduleEntries(form) {
    return $$(".schedule-entry", form).map((entry) => ({
      days: $$('input[name="scheduleDays"]:checked', entry).map((input) => input.value),
      startTime: $('input[name="startTime"]', entry).value,
      endTime: $('input[name="endTime"]', entry).value,
      room: $('input[name="room"]', entry).value,
      building: $('input[name="building"]', entry).value,
      mode: $('select[name="mode"]', entry).value,
      subjectId: $('input[name="scheduleSubjectId"]', entry).value
    }));
  }

  function renderClassScheduleEditor(form, entries = readClassScheduleEntries(form)) {
    const container = $("#class-schedule-entries", form);
    if (!container) return;
    const subjects = $$('input[name="subjectIds"]:checked', form).map((input) => byId(state.data.subjects, input.value)).filter(Boolean);
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    entries = entries.map((entry) => ({ ...entry, subjectId: subjectIds.has(entry.subjectId) ? entry.subjectId : "" }));
    const grouped = subjects.map((subject) => {
      let subjectEntries = entries.filter((entry) => entry.subjectId === subject.id);
      if (!subjectEntries.length && !$("input[name=id]", form).value) {
        const firstEntry = { subjectId: subject.id };
        entries.push(firstEntry);
        subjectEntries = [firstEntry];
      }
      return {
        subject,
        assignment: state.data.assignments.find((item) => item.classId === $("input[name=id]", form).value && item.subjectId === subject.id),
        entries: subjectEntries
      };
    });
    const unlinkedEntries = entries.map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !entry.subjectId || !subjectIds.has(entry.subjectId));
    const renderEntries = (meetingEntries) => meetingEntries.map(({ entry, index }) =>
      classScheduleEntryForm(entry, index, meetingEntries.length > 1 || Boolean($("input[name=id]", form).value))).join("");
    container.innerHTML = `${grouped.length ? `<div class="schedule-subject-groups">${grouped.map(({ subject, assignment, entries: subjectEntries }) => {
      const teacherAssignment = assignment && byId(state.data.teachers, assignment.teacherId);
      const indexedEntries = subjectEntries.map((entry) => ({ entry, index: entries.indexOf(entry) }));
      return `<section class="schedule-subject-card">
        <header class="schedule-subject-heading"><span class="code-pill">${escapeHtml(subject.code)}</span><div><strong>${escapeHtml(subject.name)}</strong><small>${Number(subject.units)} credit units${teacherAssignment ? ` · Teacher: ${escapeHtml(teacherAssignment.name)}` : " · Teacher not assigned"}</small></div><button type="button" class="button button-secondary button-small" data-action="add-class-schedule" data-subject-id="${escapeHtml(subject.id)}">+ Add meeting</button></header>
        ${indexedEntries.length ? renderEntries(indexedEntries) : '<p class="schedule-subject-empty">No meetings scheduled for this subject.</p>'}
      </section>`;
    }).join("")}</div>` : '<div class="picker-placeholder">Select the class subjects above to organize their meeting times here.</div>'}
      ${unlinkedEntries.length ? `<section class="schedule-subject-card schedule-unlinked-card"><header class="schedule-subject-heading"><div><strong>Other section meetings</strong><small>These meetings are not linked to a specific subject.</small></div><button type="button" class="button button-secondary button-small" data-action="add-class-schedule" data-subject-id="">+ Add meeting</button></header>${renderEntries(unlinkedEntries)}</section>` : ""}
      `;
  }

  function classForm(classRecord) {
    const programs = AcademicDB.activePrograms;
    const curriculumChoices = state.data.curricula.filter((item) => item.status !== "inactive" || (classRecord && item.id === classRecord.curriculumId));
    const yearOptions = Array.from({ length: 5 }, (_, index) => `<option value="${index + 1}"${classRecord && Number(classRecord.yearLevel) === index + 1 ? " selected" : ""}>${yearName(index + 1)}</option>`).join("");
    const semesterOptions = `<option value="">Select semester</option><option value="1"${classRecord && classRecord.semester === "1" ? " selected" : ""}>1st semester</option><option value="2"${classRecord && classRecord.semester === "2" ? " selected" : ""}>2nd semester</option><option value="summer"${classRecord && classRecord.semester === "summer" ? " selected" : ""}>Summer</option>`;
    const initialCurriculum = classRecord ? byId(curriculumChoices, classRecord.curriculumId) : null;
    const initialCurriculumChoices = initialCurriculum ? curriculumChoices.filter((item) => item.programId === initialCurriculum.programId) : [];
    const classPrograms = initialCurriculum && !programs.some((item) => item.id === initialCurriculum.programId)
      ? [...programs, program(initialCurriculum.programId)]
      : programs;
    return `<input type="hidden" name="id" value="${classRecord ? classRecord.id : ""}">
      <input type="hidden" name="maxStudents" value="${classRecord ? classRecord.maxStudents || 40 : 40}">
      <section class="class-form-section">
        <header class="class-form-section-heading"><span>1</span><div><strong>Class details</strong><small>Choose the program and academic period for this section.</small></div></header>
        <div class="form-grid">
          ${field("Program / course", `<select name="programId" required>${selectOptions(classPrograms.filter(Boolean), initialCurriculum && initialCurriculum.programId, (item) => `${item.code} — ${item.name}${item.archived ? " · archived" : ""}`)}</select>`)}
          ${field("Curriculum", `<select name="curriculumId" required>${selectOptions(initialCurriculumChoices, classRecord && classRecord.curriculumId, (item) => `${program(item.programId).code} · ${item.year}`)}</select>`, "Choose the active curriculum that provides this class's subjects.")}
          ${field("Year level", `<select name="yearLevel" required><option value="">Select year level</option>${yearOptions}</select>`)}
          ${field("Section", `<input name="section" maxlength="12" placeholder="e.g. A" value="${escapeHtml(classRecord ? classRecord.section : "")}" required>`, "For example: A, B, or 1.")}
          ${field("Academic year", `<input name="academicYear" maxlength="20" placeholder="e.g. 2026-2027" value="${escapeHtml(classRecord ? classRecord.academicYear : "")}" required>`, "Enter the school year for this section.")}
          ${field("Semester", `<select name="semester" required>${semesterOptions}</select>`)}
          ${field("Class status", `<select name="status"><option value="active"${!classRecord || classRecord.status !== "inactive" && classRecord.status !== "cancelled" ? " selected" : ""}>Active</option><option value="inactive"${classRecord && classRecord.status === "inactive" ? " selected" : ""}>Inactive</option><option value="cancelled"${classRecord && classRecord.status === "cancelled" ? " selected" : ""}>Cancelled</option></select>`)}
        </div>
      </section>
      <section class="class-form-section">
        <header class="class-form-section-heading"><span>2</span><div><strong>Curriculum subjects</strong><small>Only subjects offered for the selected program, year, and semester can be included.</small></div></header>
        <div class="subject-picker" id="class-subject-picker"><div class="picker-placeholder">Select a program, curriculum, year level, and semester above to see available subjects.</div></div>
      </section>
      <section class="class-form-section">
        <header class="class-form-section-heading"><span>3</span><div><strong>Weekly class schedule</strong><small>Set the recurring days, meeting times, room, and class mode for each selected subject.</small></div></header>
        <div id="class-schedule-entries"><div class="picker-placeholder">Choose curriculum subjects above to add their schedule details here.</div></div>
      </section>`;
  }

  function fillClassSubjects(form, selectedIds = []) {
    const curriculumId = $("select[name=curriculumId]", form).value;
    const yearLevel = Number($("select[name=yearLevel]", form).value);
    const semester = $("select[name=semester]", form).value;
    const picker = $("#class-subject-picker", form);
    const curriculum = byId(state.data.curricula, curriculumId);
    const offered = state.data.curriculumSubjects.filter((item) => item.curriculumId === curriculumId && Number(item.yearLevel) === yearLevel && item.semester === semester)
      .filter((item) => { const subject = byId(state.data.subjects, item.subjectId); return subject && subject.status !== "inactive"; });
    if (!curriculumId || !yearLevel || !semester) {
      picker.innerHTML = '<div class="picker-placeholder">Select a curriculum, year level, and semester to see the available subjects.</div>';
      return;
    }
    if (!offered.length) {
      picker.innerHTML = '<div class="picker-placeholder">No subjects are available for this selection. Add subjects to this curriculum first.</div>';
      return;
    }
    const existingIds = new Set(selectedIds);
    const checkedCount = offered.filter((item) => existingIds.has(item.subjectId)).length;
    picker.innerHTML = `<div class="picker-heading"><div><strong>Subjects included in this class</strong><small>${escapeHtml(program(curriculum.programId).code)} · ${yearName(yearLevel)} · ${escapeHtml(semesterName(semester))}</small></div><button type="button" class="text-button" data-action="toggle-all-subjects">${checkedCount === offered.length ? "Clear all" : "Select all"}</button></div>
      <div class="subject-choice-list">${offered.map((item) => {
        const subject = byId(state.data.subjects, item.subjectId);
        if (!subject) return "";
        const assigned = state.data.assignments.some((assignment) => assignment.classId === $("input[name=id]", form).value && assignment.subjectId === subject.id);
        const checked = existingIds.has(subject.id);
        return `<label class="subject-choice${assigned ? " choice-locked" : ""}"><input type="checkbox" name="subjectIds" value="${subject.id}"${checked ? " checked" : ""}${assigned ? " disabled checked" : ""}><span class="choice-check"></span><span class="choice-details"><strong>${escapeHtml(subject.code)} · ${escapeHtml(subject.name)}</strong><small>${subject.units} units${assigned ? " · has teacher assignment" : ""}</small></span></label>`;
      }).join("")}</div>`;
  }

  function assignmentForm(assignment) {
    const classOptions = state.data.classes.filter((item) => (item.status !== "inactive" && item.status !== "cancelled") || (assignment && item.id === assignment.classId));
    const teachers = state.data.teachers.filter((item) => item.status !== "inactive");
    const selectedClass = assignment && assignment.classId ? byId(classOptions, assignment.classId) : null;
    return `<input type="hidden" name="id" value="${assignment ? assignment.id : ""}">
      <div class="form-grid form-grid-single">
        ${field("Class section", `<select name="classId" required>${selectOptions(classOptions, assignment && assignment.classId, (item) => `${classTitle(item)} · ${item.academicYear} · ${semesterName(item.semester)}`, "Choose a class")}</select>`, "Class details are linked to the selected section.")}
        <div class="class-context" id="assignment-class-context">${selectedClass ? classContext(selectedClass) : '<span class="context-empty">Select a class to see its program, year, and section details.</span>'}</div>
        ${field("Subject", `<select name="subjectId" required><option value="">Select a class first</option></select>`, "Only subjects included in this class can be assigned.")}
        <div class="class-context assignment-preview" id="assignment-preview"><span class="context-empty">Choose a class subject to preview its units and schedule.</span></div>
        ${field("Available teacher", `<select name="teacherId" required>${selectOptions(teachers, assignment && assignment.teacherId, (item) => `${item.name} · ${item.department || "Department not set"}`, "Choose an active teacher")}</select>`, "Inactive teachers cannot be assigned. Add a teacher using the button above if needed.")}
      </div>`;
  }

  function teacherForm(teacher) {
    return `<input type="hidden" name="id" value="${escapeHtml(teacher ? teacher.id : "")}"><div class="form-grid">
      ${field("Teacher name", `<input name="name" maxlength="120" value="${escapeHtml(teacher ? teacher.name : "")}" placeholder="e.g. Juan Dela Cruz" required>`)}
      ${field("Department", `<input name="department" maxlength="120" value="${escapeHtml(teacher ? teacher.department || "" : "")}" placeholder="e.g. Information Technology" required>`)}
      ${field("Employment type", `<select name="employmentType"><option value="Full-Time"${teacher && teacher.employmentType === "Full-Time" ? " selected" : ""}>Full-Time</option><option value="Part-Time"${!teacher || teacher.employmentType !== "Full-Time" ? " selected" : ""}>Part-Time</option></select>`)}
      ${field("Employment status", `<select name="status"><option value="active"${!teacher || teacher.status !== "inactive" ? " selected" : ""}>Active</option><option value="inactive"${teacher && teacher.status === "inactive" ? " selected" : ""}>Inactive</option></select>`)}
    </div>`;
  }

  function classContext(record) {
    const course = program(record.programId);
    const schedule = classSchedules(record).map((entry) => `${scheduleText(entry)} · ${[entry.room, entry.building, entry.mode].filter(Boolean).join(" · ")}`).join("; ");
    return `<span class="context-item"><small>PROGRAM</small><strong>${course ? course.code : "—"}</strong></span><span class="context-item"><small>YEAR LEVEL</small><strong>${yearName(record.yearLevel)}</strong></span><span class="context-item"><small>SECTION</small><strong>${escapeHtml(record.section)}</strong></span><span class="context-item"><small>ACADEMIC YEAR</small><strong>${escapeHtml(record.academicYear)}</strong></span><span class="context-item"><small>SEMESTER</small><strong>${escapeHtml(semesterName(record.semester))}</strong></span><span class="context-item"><small>SCHEDULE / ROOM</small><strong>${escapeHtml(schedule || "Not set")}</strong></span>`;
  }

  function fillAssignmentSubjects(form, selectedSubjectId = "") {
    const classId = $("select[name=classId]", form).value;
    const classRecord = byId(state.data.classes, classId);
    const context = $("#assignment-class-context", form);
    const subjectSelect = $("select[name=subjectId]", form);
    if (!classRecord) {
      context.innerHTML = '<span class="context-empty">Select a class to see its program, year, and section details.</span>';
      subjectSelect.innerHTML = '<option value="">Select a class first</option>';
      $("#assignment-preview", form).innerHTML = '<span class="context-empty">Choose a class subject to preview its units and schedule.</span>';
      return;
    }
    context.innerHTML = classContext(classRecord);
    const eligible = state.data.classSubjects.filter((item) => item.classId === classId).map((item) => byId(state.data.subjects, item.subjectId)).filter(Boolean);
    const alreadyAssigned = new Set(state.data.assignments.filter((item) => item.classId === classId && item.id !== $("input[name=id]", form).value).map((item) => item.subjectId));
    const available = eligible.filter((item) => !alreadyAssigned.has(item.id) || item.id === selectedSubjectId);
    subjectSelect.innerHTML = selectOptions(available, selectedSubjectId, (item) => `${item.code} · ${item.name} (${item.units} units)`, available.length ? "Choose a class subject" : "No unassigned subjects available");
    fillAssignmentPreview(form);
  }

  function fillAssignmentPreview(form) {
    const preview = $("#assignment-preview", form);
    const classRecord = byId(state.data.classes, $("select[name=classId]", form).value);
    const subject = byId(state.data.subjects, $("select[name=subjectId]", form).value);
    if (!classRecord || !subject) {
      preview.innerHTML = '<span class="context-empty">Choose a class subject to preview its units and schedule.</span>';
      return;
    }
    const schedules = assignmentSchedules(classRecord, subject.id);
    const conflict = assignmentScheduleConflict($("select[name=teacherId]", form).value, classRecord, subject.id, $("input[name=id]", form).value);
    preview.innerHTML = `<span class="context-item"><small>SUBJECT</small><strong>${escapeHtml(subject.code)} · ${escapeHtml(subject.name)} · ${Number(subject.units)} units</strong></span>${schedules.length ? schedules.map((entry) => `<span class="context-item"><small>${escapeHtml(assignmentScheduleText(entry))}</small><strong>${escapeHtml([entry.room, entry.building, entry.mode].filter(Boolean).join(" · ") || "Location/mode not set")}</strong></span>`).join("") : '<span class="context-empty">No schedule has been added to this class yet.</span>'}${conflict ? `<div class="assignment-conflict-warning" role="alert">Schedule conflict: this teacher is already assigned to ${escapeHtml(classTitle(conflict))} (${escapeHtml(conflict.academicYear)}, ${escapeHtml(semesterName(conflict.semester))}) at an overlapping day and time.</div>` : ""}`;
  }

  function openSubjectModal(subject) {
    modal(subject ? "Edit subject" : "Add a subject", subjectForm(subject), { subtitle: "Subject catalog", submitText: subject ? "Save subject" : "Add subject" });
    $("#modal-form").dataset.type = "subject";
    $("#modal-form").dataset.id = subject ? subject.id : "";
  }

  function openCurriculumModal(curriculum) {
    modal(curriculum ? "Edit curriculum details" : "Create a curriculum", curriculumForm(curriculum), { subtitle: "Curriculum management", submitText: curriculum ? "Save details" : "Create curriculum" });
    $("#modal-form").dataset.type = "curriculum";
    $("#modal-form").dataset.id = curriculum ? curriculum.id : "";
  }

  function openOfferingModal(curriculum, offering) {
    modal(offering ? "Edit curriculum subject" : "Add a curriculum subject", offeringForm(curriculum, offering), { subtitle: `${program(curriculum.programId).code} · ${curriculum.year} curriculum`, submitText: offering ? "Save subject" : "Add subject" });
    $("#modal-form").dataset.type = "offering";
    $("#modal-form").dataset.id = offering ? offering.id : "";
  }

  function openClassModal(classRecord) {
    if (!state.data.curricula.some((item) => item.status !== "inactive")) {
      toast("Create a curriculum before creating a class.", "error");
      return;
    }
    modal(classRecord ? "Edit class section" : "Create a class section", classForm(classRecord), { subtitle: "Classes & sections", submitText: classRecord ? "Save class" : "Create class", wide: true });
    const form = $("#modal-form");
    form.dataset.type = "class";
    fillClassSubjects(form, classRecord ? state.data.classSubjects.filter((item) => item.classId === classRecord.id).map((item) => item.subjectId) : []);
    renderClassScheduleEditor(form, classRecord ? classSchedules(classRecord) : []);
    ["curriculumId", "yearLevel", "semester"].forEach((name) => $(`[name=${name}]`, form).addEventListener("change", () => {
      fillClassSubjects(form);
      renderClassScheduleEditor(form);
    }));
    form.addEventListener("change", (event) => {
      if (event.target.matches('input[name="subjectIds"]')) renderClassScheduleEditor(form);
    });
    $("select[name=programId]", form).addEventListener("change", (event) => {
      const options = state.data.curricula.filter((item) => item.programId === event.target.value && item.status !== "inactive");
      $("select[name=curriculumId]", form).innerHTML = selectOptions(options, "", (item) => `${program(item.programId).code} · ${item.year}`);
      fillClassSubjects(form);
      renderClassScheduleEditor(form);
    });
  }

  function openAssignmentModal(assignment) {
    if (!state.data.classes.length) {
      toast("Create a class and include subjects before assigning a teacher.", "error");
      return;
    }
    modal(assignment ? "Edit teacher assignment" : "Assign a teacher", assignmentForm(assignment), { subtitle: "Teacher assignment", submitText: assignment ? "Save assignment" : "Confirm assignment", wide: true });
    const form = $("#modal-form");
    form.dataset.type = "assignment";
    fillAssignmentSubjects(form, assignment ? assignment.subjectId : "");
    $("select[name=classId]", form).addEventListener("change", () => fillAssignmentSubjects(form));
    $("select[name=subjectId]", form).addEventListener("change", () => fillAssignmentPreview(form));
    $("select[name=teacherId]", form).addEventListener("change", () => fillAssignmentPreview(form));
  }

  function openTeacherModal(teacher) {
    modal(teacher ? "Edit teacher profile" : "Add teacher", teacherForm(teacher), {
      subtitle: "Teacher directory",
      submitText: teacher ? "Save teacher" : "Add teacher"
    });
    $("#modal-form").dataset.type = "teacher";
    $("#modal-form").dataset.id = teacher ? teacher.id : "";
  }

  function openTeacherDetails(teacherId) {
    const teacher = byId(state.data.teachers, teacherId);
    if (!teacher) {
      toast("That teacher could not be found.", "error");
      return;
    }
    const assigned = state.data.assignments.filter((item) => item.teacherId === teacherId);
    const scheduleRows = assigned.map((assignment) => {
      const classRecord = byId(state.data.classes, assignment.classId);
      const subject = byId(state.data.subjects, assignment.subjectId);
      const course = classRecord && program(classRecord.programId);
      if (!classRecord) return "";
      const schedules = assignmentSchedules(classRecord, assignment.subjectId);
      return `<article class="teacher-schedule-card"><div><strong>${escapeHtml(course ? course.code : "—")} · ${escapeHtml(classRecord.section)} · ${escapeHtml(subject ? subject.name : "Unknown subject")}</strong><small>${escapeHtml(classRecord.academicYear)} · ${escapeHtml(semesterName(classRecord.semester))} · ${yearName(classRecord.yearLevel)} · ${escapeHtml(subject ? subject.code : "—")} · ${subject ? Number(subject.units) : "—"} units</small></div>${schedules.length ? schedules.map((entry) => `<p><strong>${escapeHtml(assignmentScheduleText(entry))}</strong> · ${escapeHtml([entry.room, entry.building, entry.mode].filter(Boolean).join(" · ") || "Location/mode not set")}</p>`).join("") : '<p class="muted">Schedule not set</p>'}</article>`;
    }).join("");
    const status = teacher.status === "inactive" ? "Inactive" : "Active";
    modal(teacher.name, `<div class="teacher-profile-summary"><span><small>TEACHER ID</small><strong>${escapeHtml(teacher.id)}</strong></span><span><small>DEPARTMENT</small><strong>${escapeHtml(teacher.department || "Not set")}</strong></span><span><small>EMPLOYMENT</small><strong>${escapeHtml(teacher.employmentType || "Part-Time")} · ${status}</strong></span></div><section class="teacher-schedule-list"><h3>Assigned classes (${assigned.length})</h3>${scheduleRows || '<p class="empty-semester">This teacher has no class assignments yet.</p>'}</section>`, {
      subtitle: "Teacher schedule",
      wide: true,
      submitText: "Close"
    });
    const form = $("#modal-form");
    form.dataset.type = "teacher-view";
    $(".modal-footer", form).innerHTML = `<button type="button" class="button button-secondary" data-action="edit-teacher" data-id="${escapeHtml(teacher.id)}">Edit profile</button><button type="button" class="button button-primary" data-close-modal>Close</button>`;
  }

  async function handleForm(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) || "").trim();
    const id = form.dataset.id || "";
    const type = form.dataset.type;
    if (!form.reportValidity()) return;

    if (type === "subject") {
      const units = Number(value("units"));
      if (!Number.isFinite(units) || units <= 0) throw new Error("Units must be greater than zero.");
      const resolveRelationshipCodes = (relation) => {
        const codes = [...new Set(value(`${relation}Codes`).split(/[;,]/).map((code) => code.trim().toUpperCase()).filter(Boolean))];
        const ids = codes.map((code) => state.data.subjects.find((item) => item.code.toUpperCase() === code)).filter(Boolean).map((item) => item.id);
        return { codes, ids };
      };
      const prerequisites = resolveRelationshipCodes("prerequisite");
      const corequisites = resolveRelationshipCodes("corequisite");
      await AcademicDB.saveSubject({
        id, code: value("code"), name: value("name"), description: value("description"),
        lectureHours: Number(value("lectureHours")), laboratoryHours: Number(value("laboratoryHours")),
        units, prerequisiteId: value("prerequisiteId") || null, prerequisiteIds: prerequisites.ids, prerequisiteCodes: prerequisites.codes,
        prerequisiteText: value("prerequisiteText"), corequisiteId: value("corequisiteId") || null,
        corequisiteIds: corequisites.ids, corequisiteCodes: corequisites.codes, corequisiteText: value("corequisiteText"),
        sourceNote: value("sourceNote"), sourceNeedsReview: form.elements.sourceNeedsReview.checked, status: value("status")
      });
      toast(id ? "Subject details updated." : "Subject added to the catalog.");
    } else if (type === "curriculum") {
      const selectedProgram = program(value("programId"));
      if (!selectedProgram) throw new Error("Choose a valid program.");
      const saved = await AcademicDB.saveCurriculum({ id, programId: selectedProgram.id, year: value("year"), status: value("status") });
      if (!id) state.detailCurriculumId = saved.id;
      toast(id ? "Curriculum details updated." : "Curriculum created.");
    } else if (type === "offering") {
      const curriculumId = value("curriculumId");
      await AcademicDB.saveOffering({ id, curriculumId, subjectId: value("subjectId"), yearLevel: value("yearLevel"), semester: value("semester") });
      toast(id ? "Curriculum subject updated." : "Subject added to the curriculum.");
    } else if (type === "class") {
      const subjectIds = $$('input[name="subjectIds"]:checked', form).map((input) => input.value);
      const selectedCurriculum = byId(state.data.curricula, value("curriculumId"));
      if (!selectedCurriculum || selectedCurriculum.programId !== value("programId")) throw new Error("Choose a curriculum for the selected program.");
      await AcademicDB.saveClass({
        id: value("id") || undefined,
        curriculumId: value("curriculumId"),
        yearLevel: value("yearLevel"),
        section: value("section"),
        academicYear: value("academicYear"),
        semester: value("semester"),
        scheduleEntries: readClassScheduleEntries(form),
        maxStudents: value("maxStudents"),
        status: value("status")
      }, subjectIds);
      toast(value("id") ? "Class section updated." : "Class section created.");
    } else if (type === "assignment") {
      await AcademicDB.saveAssignment({ id: value("id") || undefined, classId: value("classId"), subjectId: value("subjectId"), teacherId: value("teacherId") });
      toast(value("id") ? "Teacher assignment updated." : "Teacher assigned to the class subject.");
    } else if (type === "teacher") {
      await AcademicDB.saveTeacher({
        id: value("id") || undefined,
        name: value("name"),
        department: value("department"),
        employmentType: value("employmentType"),
        status: value("status")
      });
      toast(value("id") ? "Teacher profile updated." : "Teacher added to the directory.");
    }
    closeModal();
    await render();
  }

  async function handleAction(action, id, actionButton) {
    if (action === "go-curricula") location.hash = "curricula";
    else if (action === "go-subjects") location.hash = "subjects";
    else if (action === "go-classes") location.hash = "classes";
    else if (action === "go-assignments") location.hash = "assignments";
    else if (action === "clear-subject-filters") {
      state.subjectFilters = { programId: "", yearLevel: "", semester: "", status: "", search: "" };
      await render();
    }
    else if (action === "clear-class-filters") {
      state.classFilters = { programId: "", yearLevel: "", academicYear: "", semester: "", teacherId: "", status: "", search: "" };
      await render();
    }
    else if (action === "export-classes") exportClassesCsv();
    else if (action === "delete-all-class-schedules") {
      if (window.confirm("Delete all class schedules across all class sections? Class records, subjects, and teacher assignments will remain.")) {
        const deletedCount = await AcademicDB.deleteAllClassSchedules();
        toast(deletedCount ? `${deletedCount} class schedule${deletedCount === 1 ? "" : "s"} deleted.` : "There were no class schedules to delete.");
        await render();
      }
    }
    else if (action === "new-curriculum") openCurriculumModal();
    else if (action === "edit-curriculum") openCurriculumModal(byId(state.data.curricula, state.detailCurriculumId));
    else if (action === "open-curriculum") { state.detailCurriculumId = id; await render(); }
    else if (action === "back-curricula") { state.detailCurriculumId = null; await render(); }
    else if (action === "new-subject") openSubjectModal();
    else if (action === "edit-subject") openSubjectModal(byId(state.data.subjects, id));
    else if (action === "edit-offering") {
      const offering = byId(state.data.curriculumSubjects, id);
      const curriculum = offering && byId(state.data.curricula, offering.curriculumId);
      if (offering && curriculum) openOfferingModal(curriculum, offering);
    }
    else if (action === "new-offering") {
      const curriculum = byId(state.data.curricula, state.detailCurriculumId);
      if (!state.data.subjects.length) { toast("Add a subject in the Subjects module first.", "error"); location.hash = "subjects"; return; }
      openOfferingModal(curriculum);
    } else if (action === "new-class") openClassModal();
    else if (action === "view-class") openClassDetails(id);
    else if (action === "edit-class") openClassModal(byId(state.data.classes, id));
    else if (action === "add-class-schedule") {
      const form = $("#modal-form");
      const entries = readClassScheduleEntries(form);
      entries.push({ subjectId: actionButton.dataset.subjectId || "" });
      renderClassScheduleEditor(form, entries);
    } else if (action === "remove-class-schedule") {
      const form = $("#modal-form");
      const entries = readClassScheduleEntries(form);
      entries.splice(Number(actionButton.closest(".schedule-entry").dataset.scheduleIndex), 1);
      renderClassScheduleEditor(form, entries);
    } else if (action === "edit-class-schedule") {
      const classRecord = byId(state.data.classes, id);
      if (classRecord) {
        openClassModal(classRecord);
        const entry = $(`.schedule-entry[data-schedule-index="${Number(actionButton.dataset.index)}"]`, $("#modal-form"));
        if (entry) {
          entry.scrollIntoView({ behavior: "smooth", block: "center" });
          $("input[name=startTime]", entry).focus();
        }
      }
    } else if (action === "delete-class-schedule") {
      const classRecord = byId(state.data.classes, id);
      const index = Number(actionButton.dataset.index);
      const schedules = classRecord && classSchedules(classRecord);
      if (classRecord && schedules && schedules[index] && window.confirm(`Delete meeting ${index + 1} from ${classTitle(classRecord)}? The class and its subjects will remain.`)) {
        const subjectIds = state.data.classSubjects.filter((item) => item.classId === classRecord.id).map((item) => item.subjectId);
        await AcademicDB.saveClass({ ...classRecord, scheduleEntries: schedules.filter((_, entryIndex) => entryIndex !== index) }, subjectIds);
        toast("Class schedule deleted.");
        await render();
        openClassDetails(classRecord.id);
      }
    }
    else if (action === "new-assignment") openAssignmentModal();
    else if (action === "new-teacher") openTeacherModal(null);
    else if (action === "view-teacher") openTeacherDetails(id);
    else if (action === "edit-teacher") openTeacherModal(byId(state.data.teachers, id));
    else if (action === "edit-assignment") openAssignmentModal(byId(state.data.assignments, id));
    else if (action === "delete-subject") {
      const subject = byId(state.data.subjects, id);
      if (subject && window.confirm(`Delete ${subject.code} · ${subject.name}?`)) {
        await AcademicDB.deleteSubject(id); toast("Subject deleted."); await render();
      }
    } else if (action === "delete-curriculum") {
      const curriculum = byId(state.data.curricula, state.detailCurriculumId);
      if (curriculum && window.confirm(`Delete the ${program(curriculum.programId).code} ${curriculum.year} curriculum?`)) {
        await AcademicDB.deleteCurriculum(curriculum.id); state.detailCurriculumId = null; toast("Curriculum deleted."); await render();
      }
    } else if (action === "remove-offering") {
      const offering = byId(state.data.curriculumSubjects, id);
      const subject = offering && byId(state.data.subjects, offering.subjectId);
      if (offering && window.confirm(`Remove ${subject ? subject.code : "this subject"} from the curriculum?`)) {
        await AcademicDB.deleteOffering(id); toast("Subject removed from this curriculum."); await render();
      }
    } else if (action === "delete-class") {
      const item = byId(state.data.classes, id);
      if (item && window.confirm(`Delete ${classTitle(item)} (${item.academicYear})?`)) {
        await AcademicDB.deleteClass(id); toast("Class section deleted."); await render();
      }
    } else if (action === "delete-assignment") {
      const assignment = byId(state.data.assignments, id);
      const teacher = assignment && byId(state.data.teachers, assignment.teacherId);
      if (assignment && window.confirm(`Remove ${teacher ? teacher.name : "this teacher"} from the class subject?`)) {
        await AcademicDB.deleteAssignment(id); toast("Teacher assignment removed."); await render();
      }
    } else if (action === "toggle-all-subjects") {
      const checkboxes = $$('input[name="subjectIds"]:not(:disabled)', $("#modal-form"));
      const selectAll = checkboxes.some((input) => !input.checked);
      checkboxes.forEach((input) => { input.checked = selectAll; });
      const button = $('[data-action="toggle-all-subjects"]', $("#modal-form"));
      button.textContent = selectAll ? "Clear all" : "Select all";
    }
  }

  function updateSearch(input, table, emptyMessage) {
    const term = input.value.toLocaleLowerCase().trim();
    let visible = 0;
    $$("tbody tr", table).forEach((row) => {
      const show = row.textContent.toLocaleLowerCase().includes(term);
      row.hidden = !show;
      if (show) visible += 1;
    });
    emptyMessage.hidden = visible > 0;
  }

  function setupEvents() {
    window.addEventListener("hashchange", () => {
      const route = location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
      state.route = ["dashboard", "curricula", "subjects", "classes", "assignments"].includes(route) ? route : "dashboard";
      if (state.route !== route) location.hash = "dashboard";
      if (state.route !== "curricula") state.detailCurriculumId = null;
      render().catch((error) => toast(error.message, "error"));
    });

    document.addEventListener("click", (event) => {
      if (event.target.matches("[data-close-modal]")) { closeModal(); return; }
      const button = event.target.closest("[data-action]");
      if (button) handleAction(button.dataset.action, button.dataset.id, button).catch((error) => toast(error.message || "Action could not be completed.", "error"));
    });

    document.addEventListener("input", (event) => {
      const input = event.target;
      if (input.id === "class-search") {
        state.classFilters.search = input.value;
        applyClassFilters();
      }
      if (input.id === "assignment-search") updateSearch(input, $("#assignments-table"), $("#assignment-no-results"));
    });
    document.addEventListener("change", (event) => {
      const input = event.target;
      if (input.id === "subject-filter-program") state.subjectFilters.programId = input.value;
      else if (input.id === "subject-filter-year") state.subjectFilters.yearLevel = input.value;
      else if (input.id === "subject-filter-semester") state.subjectFilters.semester = input.value;
      else if (input.id === "curriculum-filter-program") state.curriculumFilters.programId = input.value;
      else if (input.id === "class-filter-program") state.classFilters.programId = input.value;
      else if (input.id === "class-filter-year") state.classFilters.yearLevel = input.value;
      else if (input.id === "class-filter-academic-year") state.classFilters.academicYear = input.value;
      else if (input.id === "class-filter-semester") state.classFilters.semester = input.value;
      else if (input.id === "class-filter-teacher") state.classFilters.teacherId = input.value;
      else if (input.id === "class-filter-status") state.classFilters.status = input.value;
      else return;
      if (input.id.startsWith("subject-filter-")) applySubjectFilters();
      else if (input.id === "curriculum-filter-program") applyCurriculumFilters();
      else applyClassFilters();
    });

    $("#help-button").addEventListener("click", () => {
      modal("About FULLBRIGHT COLLEGE", '<div class="about-content"><p>FULLBRIGHT COLLEGE keeps your academic records connected in one place.</p><div class="about-flow"><span>Curriculum</span><i>→</i><span>Class subjects</span><i>→</i><span>Teacher assignment</span></div><p>Academic records are available only to authorized administrators.</p></div>', { subtitle: "Academic Management System", submitText: "Done" });
      $("#modal-form").dataset.type = "about";
      $(".modal-footer", $("#modal-form")).innerHTML = '<button type="button" class="button button-primary" data-close-modal>Done</button>';
    });
  }

  async function start() {
    const authScreen = $("#auth-screen");
    const appShell = $("#app-shell");
    const loginForm = $("#login-form");
    const loginError = $("#login-error");
    const loginButton = $(".auth-submit", loginForm);

    window.addEventListener("storage", (event) => {
      if (event.key === "fullbright-academic-session" && !event.newValue) location.reload();
    });

    function showLogin(message = "") {
      appShell.hidden = true;
      authScreen.hidden = false;
      loginError.textContent = message;
      loginError.hidden = !message;
      $("#login-password").value = "";
      loginButton.disabled = false;
      loginButton.textContent = "Log in";
    }

    async function openSystem() {
      authScreen.hidden = true;
      appShell.hidden = false;
      try {
        await AcademicDB.init();
        setupEvents();
        $("#logout-button").addEventListener("click", async (event) => {
          const button = event.currentTarget;
          button.disabled = true;
          try {
            await AcademicDB.signOut();
            showLogin();
          } catch (error) {
            showLogin(`You have been logged out locally. ${error.message || "The server could not confirm sign-out."}`);
          }
        });
        const route = location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
        state.route = ["dashboard", "curricula", "subjects", "classes", "assignments"].includes(route) ? route : "dashboard";
        if (state.route !== route) location.hash = "dashboard";
        if (!location.hash) location.hash = "dashboard";
        await render();
      } catch (error) {
        const status = $(".database-status");
        if (status) status.dataset.state = "error";
        const statusLabel = $(".database-label");
        if (statusLabel) statusLabel.textContent = "Supabase connection error";
        page.innerHTML = `<div class="fatal-error"><span>!</span><h1>Could not open the academic database</h1><p>${escapeHtml(error.message || "Please check your browser settings and reload this page.")}</p><button class="button button-secondary" onclick="location.reload()">Reload application</button></div>`;
      }
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      loginError.hidden = true;
      loginButton.disabled = true;
      loginButton.textContent = "Checking access...";
      let sessionCreated = false;
      try {
        await AcademicDB.login($("#login-username").value.trim(), $("#login-password").value);
        sessionCreated = true;
        if (!await AcademicDB.isAdmin()) {
          await AcademicDB.signOut();
          sessionCreated = false;
          showLogin("This account is not authorized to access the administrator system.");
          return;
        }
        await openSystem();
        sessionCreated = false;
      } catch (error) {
        if (sessionCreated) {
          try {
            await AcademicDB.signOut();
          } catch (signOutError) {
            error = new Error(`${error.message} Could not clear the login session: ${signOutError.message}`);
          }
        }
        if (error.status === 400 && /invalid login credentials/i.test(error.message)) {
          error = new Error("Hindi nahanap o hindi tugma ang password ng Supabase account para sa username na ito. I-create o i-reset ang account sa Supabase Authentication > Users, pagkatapos ay idagdag ang user UUID sa public.academic_admins.");
        }
        showLogin(error.message || "Could not sign in. Please verify your account and try again.");
      }
    });

    try {
      AcademicDB.configure();
      const session = await AcademicDB.restoreSession();
      if (!session) {
        showLogin();
        return;
      }
      if (!await AcademicDB.isAdmin()) {
        await AcademicDB.signOut();
        showLogin("This account is not authorized to access the administrator system.");
        return;
      }
      await openSystem();
    } catch (error) {
      showLogin(error.message || "Could not verify your login. Please try again.");
    }
  }

  start();
})();
