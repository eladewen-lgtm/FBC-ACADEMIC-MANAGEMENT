(() => {
  "use strict";

  const PROGRAMS = [
    { id: "bsit", code: "BSIT", name: "Bachelor of Science in Information Technology", archived: false },
    { id: "bscs", code: "BSCS", name: "Bachelor of Science in Computer Science", archived: false },
    { id: "bscoe", code: "BSCOE", name: "Bachelor of Science in Computer Engineering", archived: false },
    { id: "bsele", code: "BSELE", name: "Bachelor of Science in Electronics Engineering", archived: false },
    { id: "bsce", code: "BSCE", name: "Bachelor of Science in Civil Engineering", archived: true },
    { id: "bsen", code: "BSEN", name: "Bachelor of Science in Environmental Engineering", archived: true }
  ];
  const STORES = ["programs", "curricula", "subjects", "curriculumSubjects", "classes", "classSubjects", "teachers", "assignments"];
  const TABLES = {
    curricula: "curricula",
    subjects: "subjects",
    curriculumSubjects: "curricula?select=subject_offerings",
    classes: "classes",
    classSubjects: "classes?select=class_subjects",
    teachers: "teacher_assignments?select=id,data&record_type=eq.teacher",
    assignments: "teacher_assignments?select=id,data&record_type=eq.assignment"
  };
  const LEGACY_DATABASE_NAME = "campusflow-academic";
  const SESSION_STORAGE_KEY = "fullbright-academic-session";
  const ADMIN_USERNAME = "fbcadmin";
  const ADMIN_EMAIL = "fbcadmin@gmail.com";
  let supabaseUrl;
  let supabaseAnonKey;
  let normalizedSchema = true;
  let authSession = null;

  function setConnectionStatus(status, message) {
    const container = document.querySelector(".database-status");
    const label = document.querySelector(".database-label");
    if (container) container.dataset.state = status;
    if (label) label.textContent = message;
  }

  async function requestSupabase(path, options = {}) {
    if (!authSession?.access_token) throw new Error("Log in with an authorized administrator account to access academic records.");
    if (authSession.expires_at && authSession.expires_at * 1000 < Date.now() + 60_000) await refreshSession();
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${authSession.access_token}`
      }
    });
    const body = await response.text();
    if (!response.ok) {
      let detail = body;
      let code;
      try {
        const parsed = JSON.parse(body);
        detail = parsed.message || parsed.details || parsed.hint || body;
        code = parsed.code;
      } catch {}
      const error = new Error(`Supabase request failed (${response.status}): ${detail || response.statusText}`);
      error.status = response.status;
      error.code = code;
      throw error;
    }
    return body ? JSON.parse(body) : null;
  }

  async function authRequest(path, options = {}) {
    const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
      ...options,
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    const body = await response.text();
    if (!response.ok) {
      let message = body;
      try {
        const parsed = JSON.parse(body);
        message = parsed.msg || parsed.message || parsed.error_description || parsed.error || body;
      } catch {}
      const error = new Error(`Authentication failed (${response.status}): ${message || response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return body ? JSON.parse(body) : null;
  }

  function saveSession(session) {
    authSession = session;
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async function refreshSession() {
    if (!authSession?.refresh_token) {
      saveSession(null);
      throw new Error("Your login session has expired. Please log in again.");
    }
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: authSession.refresh_token })
    });
    saveSession({ ...refreshed, expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in });
    return authSession;
  }

  async function restoreSession() {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;
    try {
      authSession = JSON.parse(saved);
    } catch {
      saveSession(null);
      throw new Error("The saved login session is invalid. Please log in again.");
    }
    if (!authSession?.access_token || !authSession?.refresh_token) {
      saveSession(null);
      return null;
    }
    try {
      if (!authSession.expires_at || authSession.expires_at * 1000 < Date.now() + 60_000) await refreshSession();
      const user = await authRequest("user", { headers: { Authorization: `Bearer ${authSession.access_token}` } });
      authSession = { ...authSession, user };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authSession));
      return authSession;
    } catch (error) {
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        saveSession(null);
        return null;
      }
      throw error;
    }
  }

  async function loadCollection(name) {
    if (name === "programs") return PROGRAMS;
    const rows = [];
    const pageSize = 1000;
    let offset = 0;
    while (true) {
      const page = await requestSupabase(
        normalizedSchema
          ? `${TABLES[name]}${TABLES[name].includes("?") ? "&" : "?"}order=id.asc`
          : `academic_records?select=id,data&collection=eq.${encodeURIComponent(name)}&order=id.asc`,
        { headers: { Range: `${offset}-${offset + pageSize - 1}`, "Range-Unit": "items" } }
      );
      rows.push(...page);
      if (page.length < pageSize) {
        if (!normalizedSchema) return rows.map((row) => row.data);
        if (name === "curriculumSubjects") return rows.flatMap((row) => row.subject_offerings || []);
        if (name === "classSubjects") return rows.flatMap((row) => row.class_subjects || []);
        return rows.map((row) => row.data);
      }
      offset += page.length;
    }
  }

  async function readLegacyRecords() {
    if (!("indexedDB" in window) || typeof indexedDB.databases !== "function") return null;
    const databases = await indexedDB.databases();
    if (!databases.some((item) => item.name === LEGACY_DATABASE_NAME)) return null;

    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(LEGACY_DATABASE_NAME);
      request.onerror = () => reject(request.error || new Error("Could not open the previous local academic database."));
      request.onblocked = () => reject(new Error("Close other open copies of this app before restoring local class data."));
      request.onsuccess = () => resolve(request.result);
    });
    const stores = STORES.filter((name) => database.objectStoreNames.contains(name));
    if (!stores.length) {
      database.close();
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(stores, "readonly");
      const records = {};
      for (const name of stores) {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => { records[name] = request.result; };
        request.onerror = () => transaction.abort();
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(records);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Could not read records from the previous local database."));
      };
    });
  }

  async function restoreLegacyRecords() {
    const legacy = await readLegacyRecords();
    if (!legacy) return 0;
    return transact(STORES, "readwrite", (records, tx) => {
      let restored = 0;
      for (const name of STORES) {
        const existingIds = new Set(records[name].map((record) => record.id));
        for (const record of legacy[name] || []) {
          if (!record || typeof record.id !== "string" || !record.id || existingIds.has(record.id)) continue;
          tx.objectStore(name).put(record);
          records[name].push(record);
          existingIds.add(record.id);
          restored += 1;
        }
      }
      return restored;
    });
  }

  function id() {
    return crypto.randomUUID();
  }

  function configure() {
    const config = window.SUPABASE_CONFIG;
    if (!config || typeof config.url !== "string" || typeof config.anonKey !== "string" ||
      !config.anonKey || !/^https:\/\//i.test(config.url)) {
      fail("Supabase is not configured. Check supabase-config.js and reload the application.");
    }
    supabaseUrl = config.url.replace(/\/+$/, "");
    supabaseAnonKey = config.anonKey;
  }

  async function transact(storeNames, mode, operation) {
    const unknownStores = storeNames.filter((name) => !STORES.includes(name));
    if (unknownStores.length) throw new Error(`Unknown academic data collection: ${unknownStores.join(", ")}.`);
    const loaded = await Promise.all(storeNames.map(loadCollection));
    const records = Object.fromEntries(storeNames.map((name, index) => [name, loaded[index]]));
    const changes = new Map(storeNames.map((name) => [name, new Map()]));
    const deletions = new Map(storeNames.map((name) => [name, new Set()]));
    const tx = {
      objectStore(name) {
        if (!changes.has(name)) throw new Error(`Collection ${name} is not part of this operation.`);
        if (mode !== "readwrite") throw new Error("Cannot modify records during a read-only operation.");
        return {
          put(record) {
            if (!record || typeof record.id !== "string" || !record.id) throw new Error(`A valid id is required for ${name}.`);
            changes.get(name).set(record.id, { collection: name, id: record.id, data: record });
            deletions.get(name).delete(record.id);
          },
          delete(recordId) {
            changes.get(name).delete(recordId);
            deletions.get(name).add(recordId);
          }
        };
      }
    };
    const result = operation(records, tx);
    if (mode === "readwrite") {
      const changedRecords = [...changes].filter(([collection]) => collection !== "programs")
        .flatMap(([, items]) => [...items.values()]);
      const removedRecords = [...deletions].filter(([collection]) => collection !== "programs")
        .flatMap(([collection, ids]) =>
        [...ids].map((recordId) => ({ collection, id: recordId })));
      if (changedRecords.length || removedRecords.length) {
        await requestSupabase("rpc/apply_academic_changes", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ p_changes: changedRecords, p_deletions: removedRecords })
        });
      }
    }
    return result;
  }

  const all = (store) => transact([store], "readonly", (records) => records[store]);
  const get = (store, key) => transact([store], "readonly", (records) => records[store].find((record) => record.id === key) || null);
  const find = (records, key) => records.find((record) => record.id === key);
  const matches = (left, right) => left.toLocaleLowerCase() === right.toLocaleLowerCase();
  const fail = (message) => { throw new Error(message); };
  const schedulesForClass = (classRecord) => {
    if (Array.isArray(classRecord.scheduleEntries) && classRecord.scheduleEntries.length) {
      return classRecord.scheduleEntries.map((entry) => ({
        days: entry.days || entry.scheduleDays || [],
        startTime: entry.startTime || "",
        endTime: entry.endTime || "",
        room: entry.room || "",
        building: entry.building || "",
        mode: entry.mode || "On campus",
        subjectId: entry.subjectId || ""
      }));
    }
    return [{
      days: classRecord.scheduleDays || [],
      startTime: classRecord.startTime || "",
      endTime: classRecord.endTime || "",
      room: classRecord.room || "",
      building: classRecord.building || "",
      mode: classRecord.mode || "On campus",
      subjectId: ""
    }];
  };
  const schedulesConflict = (leftSchedules, rightSchedules) => leftSchedules.some((left) =>
    rightSchedules.some((right) => left.days.some((day) => right.days.includes(day)) &&
      left.startTime < right.endTime && right.startTime < left.endTime));

  const api = {
    programs: PROGRAMS,
    activePrograms: PROGRAMS.filter((program) => !program.archived),
    configure,
    login: async (username, password) => {
      if (username.trim().toLocaleLowerCase() !== ADMIN_USERNAME) {
        throw new Error("Unknown administrator username.");
      }
      const session = await authRequest("token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: ADMIN_EMAIL, password })
      });
      saveSession({ ...session, expires_at: Math.floor(Date.now() / 1000) + session.expires_in });
      return authSession;
    },
    restoreSession,
    isAdmin: async () => requestSupabase("rpc/is_academic_admin", { method: "POST", body: "{}" }),
    signOut: async () => {
      let error;
      try {
        if (authSession?.access_token) await authRequest("logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${authSession.access_token}` }
        });
      } catch (caught) {
        error = caught;
      } finally {
        saveSession(null);
      }
      if (error) throw error;
    },
    init: async () => {
      setConnectionStatus("connecting", "Connecting to Supabase…");
      configure();
      try {
        await requestSupabase("curricula?select=id,subject_offerings&limit=1");
        await requestSupabase("classes?select=id,class_subjects&limit=1");
        await requestSupabase("teacher_assignments?select=id,record_type&limit=1");
        normalizedSchema = true;
      } catch (error) {
        if (error.status !== 404 && error.status !== 400 &&
          error.code !== "PGRST205" && error.code !== "42703") throw error;
        await requestSupabase("academic_records?select=id&limit=1");
        normalizedSchema = false;
      }
      const seeds = [window.BSCOECurriculumSeed, window.BSITCurriculumSeed, window.BSELECurriculumSeed, window.BSCSCurriculumSeed].filter(Boolean);
      if (!seeds.length || seeds.some((seed) => !Array.isArray(seed.subjects))) fail("The supplied curriculum data could not be loaded.");
      await transact(["programs", "curricula", "subjects", "curriculumSubjects", "classes", "classSubjects", "assignments"], "readwrite", (records, tx) => {
        for (const seed of seeds) {
          const importSource = seed.importSource || "fullbright-bscoe-cmo87-2017";
          const curriculumId = seed.curriculumId || "curriculum-bscoe-cmo87-2017";
          let curriculum = records.curricula.find((item) => item.programId === seed.programId && item.year === seed.curriculumYear);
          if (!curriculum) {
            curriculum = { id: curriculumId, programId: seed.programId, year: seed.curriculumYear, status: "active", source: seed.source };
            tx.objectStore("curricula").put(curriculum);
            records.curricula.push(curriculum);
          }

          const subjectsByCode = new Map();
          const subjectStore = tx.objectStore("subjects");
          for (const entry of seed.subjects) {
            const normalizedCode = entry.code.trim().toLocaleUpperCase();
            const codeMatches = records.subjects.filter((item) => item.code.toLocaleUpperCase() === normalizedCode);
            const matchesEntry = (item) => item.name.trim().toLocaleLowerCase() === entry.name.trim().toLocaleLowerCase() &&
              Number(item.lectureHours || 0) === Number(entry.lectureHours || 0) &&
              Number(item.laboratoryHours || 0) === Number(entry.laboratoryHours || 0) &&
              Number(item.units) === Number(entry.units);
            let subject = codeMatches.find(matchesEntry);
            if (!subject) subject = codeMatches.find((item) => item.importSource === importSource);
            if (!subject) {
              const subjectId = codeMatches.length
                ? `${seed.programId}-${normalizedCode.toLocaleLowerCase()}-${curriculumId}`
                : `${seed.programId}-${normalizedCode.toLocaleLowerCase()}`;
              subject = {
                id: subjectId,
                code: normalizedCode,
                name: entry.name,
                description: entry.name,
                lectureHours: entry.lectureHours,
                laboratoryHours: entry.laboratoryHours,
                units: entry.units,
                prerequisiteId: null,
                prerequisiteIds: [],
                prerequisiteText: entry.prerequisiteText || "",
                prerequisiteCodes: entry.prerequisiteCodes || [],
                corequisiteId: null,
                corequisiteIds: [],
                corequisiteText: entry.corequisiteText || "",
                corequisiteCodes: entry.corequisiteCodes || [],
                status: "active",
                sourceNeedsReview: Boolean(entry.sourceNeedsReview),
                sourceNote: entry.sourceNeedsReview ? "Please verify the subject text or code against the original Fullbright curriculum document." : `Transcribed from ${seed.source}.`,
                importSource
              };
              subjectStore.put(subject);
              records.subjects.push(subject);
            }
            subjectsByCode.set(normalizedCode, subject);
          }

          for (const entry of seed.subjects) {
            const subject = subjectsByCode.get(entry.code.trim().toLocaleUpperCase());
            if (subject.importSource !== importSource) continue;
            const prerequisites = subject.prerequisiteIds && subject.prerequisiteIds.length
              ? subject.prerequisiteIds.map((id) => records.subjects.find((item) => item.id === id)).filter(Boolean)
              : (subject.prerequisiteCodes || []).map((code) => subjectsByCode.get(code.toLocaleUpperCase())).filter(Boolean);
            const corequisites = subject.corequisiteIds && subject.corequisiteIds.length
              ? subject.corequisiteIds.map((id) => records.subjects.find((item) => item.id === id)).filter(Boolean)
              : (subject.corequisiteCodes || []).map((code) => subjectsByCode.get(code.toLocaleUpperCase())).filter(Boolean);
            const updated = {
              ...subject,
              prerequisiteIds: subject.prerequisiteIds && subject.prerequisiteIds.length ? subject.prerequisiteIds : prerequisites.map((item) => item.id),
              prerequisiteId: subject.prerequisiteId || (prerequisites.length === 1 ? prerequisites[0].id : null),
              corequisiteIds: subject.corequisiteIds && subject.corequisiteIds.length ? subject.corequisiteIds : corequisites.map((item) => item.id),
              corequisiteId: subject.corequisiteId || (corequisites.length === 1 ? corequisites[0].id : null)
            };
            subjectStore.put(updated);
            subjectsByCode.set(updated.code, updated);
            const recordIndex = records.subjects.findIndex((item) => item.id === updated.id);
            records.subjects[recordIndex] = updated;
          }

          const offeringsStore = tx.objectStore("curriculumSubjects");
          for (const entry of seed.subjects) {
            const subject = subjectsByCode.get(entry.code.trim().toLocaleUpperCase());
            const existing = records.curriculumSubjects.find((item) => {
              const linkedSubject = records.subjects.find((record) => record.id === item.subjectId);
              return item.curriculumId === curriculum.id && Number(item.yearLevel) === Number(entry.yearLevel) &&
                item.semester === entry.semester && linkedSubject && linkedSubject.code.toLocaleUpperCase() === entry.code.toLocaleUpperCase();
            });
            if (existing) {
              if (existing.subjectId !== subject.id) {
                const linkedClasses = records.classes.filter((item) => item.curriculumId === curriculum.id &&
                  Number(item.yearLevel) === Number(entry.yearLevel) && item.semester === entry.semester);
                for (const classRecord of linkedClasses) {
                  const oldLink = records.classSubjects.find((item) => item.classId === classRecord.id && item.subjectId === existing.subjectId);
                  if (!oldLink) continue;
                  if (records.classSubjects.some((item) => item.classId === classRecord.id && item.subjectId === subject.id)) {
                    fail(`Cannot separate ${entry.code} in ${seed.programId}; a class already contains both subject records.`);
                  }
                  const oldAssignment = records.assignments.find((item) => item.classId === classRecord.id && item.subjectId === existing.subjectId);
                  if (oldAssignment && records.assignments.some((item) => item.classId === classRecord.id && item.subjectId === subject.id)) {
                    fail(`Cannot separate ${entry.code} in ${seed.programId}; the class has conflicting teacher assignments.`);
                  }
                  const updatedLink = { ...oldLink, subjectId: subject.id };
                  tx.objectStore("classSubjects").put(updatedLink);
                  records.classSubjects[records.classSubjects.indexOf(oldLink)] = updatedLink;
                  if (oldAssignment) {
                    const updatedAssignment = { ...oldAssignment, subjectId: subject.id };
                    tx.objectStore("assignments").put(updatedAssignment);
                    records.assignments[records.assignments.indexOf(oldAssignment)] = updatedAssignment;
                  }
                }
                const updatedOffering = { ...existing, subjectId: subject.id };
                offeringsStore.put(updatedOffering);
                records.curriculumSubjects[records.curriculumSubjects.indexOf(existing)] = updatedOffering;
              }
              continue;
            }
            const offering = {
              id: `${seed.programId}-${curriculum.id}-y${entry.yearLevel}-s${entry.semester}-${subject.code.toLocaleLowerCase()}`,
              curriculumId: curriculum.id,
              subjectId: subject.id,
              yearLevel: entry.yearLevel,
              semester: entry.semester
            };
            offeringsStore.put(offering);
            records.curriculumSubjects.push(offering);
          }
        }
      });
      await transact(["curricula", "curriculumSubjects", "classes"], "readwrite", (records, tx) => {
        const emptyBsiteCurriculum = records.curricula.find((item) =>
          item.programId === "bsit" &&
          String(item.year).replace(/[–—]/g, "-").replace(/\s/g, "") === "2026-2027" &&
          !records.curriculumSubjects.some((offering) => offering.curriculumId === item.id) &&
          !records.classes.some((classRecord) => classRecord.curriculumId === item.id)
        );
        if (emptyBsiteCurriculum) tx.objectStore("curricula").delete(emptyBsiteCurriculum.id);
      });
      const restoredCount = await restoreLegacyRecords();
      if (!normalizedSchema) {
        setConnectionStatus("legacy", "Run supabase-schema.sql to split database tables");
      } else {
        setConnectionStatus("connected", restoredCount
          ? `Supabase connected · Restored ${restoredCount} local records`
          : "Supabase connected");
      }
    },
    all,
    get,
    dashboard: async () => {
      const names = ["curricula", "subjects", "classes", "teachers", "assignments"];
      return transact(names, "readonly", (records) => Object.fromEntries(names.map((name) => [name, records[name]])));
    },
    saveSubject: (subject) => transact(["subjects", "curriculumSubjects"], "readwrite", (records, tx) => {
      const existing = find(records.subjects, subject.id);
      if (!subject.code.trim() || !subject.name.trim()) fail("Enter both a subject code and name.");
      if (!Number.isFinite(Number(subject.units)) || Number(subject.units) <= 0) fail("Units must be greater than zero.");
      if (!Number.isFinite(Number(subject.lectureHours || 0)) || Number(subject.lectureHours || 0) < 0 ||
        !Number.isFinite(Number(subject.laboratoryHours || 0)) || Number(subject.laboratoryHours || 0) < 0) {
        fail("Lecture and laboratory hours must be zero or greater.");
      }
      const duplicate = records.subjects.find((item) => item.id !== subject.id && matches(item.code, subject.code) && matches(item.name, subject.name));
      if (duplicate) fail(`Subject ${subject.code} · ${subject.name} is already in the catalog.`);
      const prerequisiteIds = [...new Set([...(subject.prerequisiteIds || []), ...(subject.prerequisiteId ? [subject.prerequisiteId] : [])])];
      const corequisiteIds = [...new Set([...(subject.corequisiteIds || []), ...(subject.corequisiteId ? [subject.corequisiteId] : [])])];
      if (prerequisiteIds.some((id) => id === subject.id)) fail("A subject cannot be its own prerequisite.");
      if (corequisiteIds.some((id) => id === subject.id)) fail("A subject cannot be its own corequisite.");
      if (prerequisiteIds.some((id) => !find(records.subjects, id))) fail("Choose existing prerequisite subjects.");
      if (corequisiteIds.some((id) => !find(records.subjects, id))) fail("Choose existing corequisite subjects.");
      if (prerequisiteIds.length) {
        const visited = new Set();
        const pending = prerequisiteIds.map((id) => find(records.subjects, id));
        while (pending.length) {
          const current = pending.pop();
          if (!current) continue;
          if (current.id === subject.id || visited.has(current.id)) {
            if (current.id === subject.id) fail("Prerequisite relationships cannot form a cycle.");
            continue;
          }
          visited.add(current.id);
          const dependencies = [...(current.prerequisiteIds || []), ...(current.prerequisiteId ? [current.prerequisiteId] : [])];
          pending.push(...dependencies.map((id) => find(records.subjects, id)));
        }
      }
      const saved = {
        description: "",
        lectureHours: 0,
        laboratoryHours: 0,
        prerequisiteIds: [],
        prerequisiteText: "",
        prerequisiteCodes: [],
        corequisiteIds: [],
        corequisiteText: "",
        corequisiteCodes: [],
        sourceNeedsReview: false,
        sourceNote: "",
        importSource: existing && existing.importSource || "",
        status: "active",
        ...subject,
        id: subject.id || id(),
        code: subject.code.trim().toUpperCase(),
        name: subject.name.trim(),
        description: String(subject.description || "").trim(),
        units: Number(subject.units),
        lectureHours: Number(subject.lectureHours || 0),
        laboratoryHours: Number(subject.laboratoryHours || 0),
        prerequisiteIds,
        prerequisiteText: String(subject.prerequisiteText || "").trim(),
        prerequisiteCodes: [...new Set((subject.prerequisiteCodes || []).map((code) => String(code).trim().toUpperCase()).filter(Boolean))],
        corequisiteIds,
        corequisiteText: String(subject.corequisiteText || "").trim(),
        corequisiteCodes: [...new Set((subject.corequisiteCodes || []).map((code) => String(code).trim().toUpperCase()).filter(Boolean))],
        sourceNeedsReview: Boolean(subject.sourceNeedsReview),
        sourceNote: String(subject.sourceNote || "").trim(),
        status: subject.status === "inactive" ? "inactive" : "active"
      };
      tx.objectStore("subjects").put(saved);
      return saved;
    }),
    deleteSubject: (subjectId) => transact(["subjects", "curriculumSubjects", "classSubjects"], "readwrite", (records, tx) => {
      if (!find(records.subjects, subjectId)) fail("That subject no longer exists.");
      if (records.curriculumSubjects.some((item) => item.subjectId === subjectId)) fail("Remove this subject from its curricula before deleting it.");
      if (records.classSubjects.some((item) => item.subjectId === subjectId)) fail("Remove this subject from its classes before deleting it.");
      if (records.subjects.some((item) => item.prerequisiteId === subjectId || item.corequisiteId === subjectId ||
        (item.prerequisiteIds || []).includes(subjectId) || (item.corequisiteIds || []).includes(subjectId))) fail("Another subject references this subject as a prerequisite or corequisite. Update that subject first.");
      tx.objectStore("subjects").delete(subjectId);
    }),
    saveCurriculum: (curriculum) => transact(["programs", "curricula", "classes"], "readwrite", (records, tx) => {
      const existing = find(records.curricula, curriculum.id);
      const selectedProgram = find(records.programs, curriculum.programId);
      if (!selectedProgram || selectedProgram.archived && (!existing || existing.programId !== selectedProgram.id)) fail("Choose one of the active programs.");
      if (!curriculum.year.trim()) fail("Enter a curriculum year.");
      if (existing && existing.programId !== curriculum.programId && records.classes.some((item) => item.curriculumId === existing.id)) {
        fail("The program cannot be changed while this curriculum has class sections.");
      }
      const duplicate = records.curricula.find((item) => item.id !== curriculum.id && item.programId === curriculum.programId && item.year === curriculum.year.trim());
      if (duplicate) fail("That program already has a curriculum for this curriculum year.");
      const saved = { status: "active", ...curriculum, id: curriculum.id || id(), year: curriculum.year.trim(), status: curriculum.status === "inactive" ? "inactive" : "active" };
      tx.objectStore("curricula").put(saved);
      return saved;
    }),
    deleteCurriculum: (curriculumId) => transact(["curricula", "curriculumSubjects", "classes"], "readwrite", (records, tx) => {
      if (!find(records.curricula, curriculumId)) fail("That curriculum no longer exists.");
      if (records.classes.some((item) => item.curriculumId === curriculumId)) fail("This curriculum is used by one or more classes. Delete those classes before deleting the curriculum.");
      for (const offering of records.curriculumSubjects) {
        if (offering.curriculumId === curriculumId) tx.objectStore("curriculumSubjects").delete(offering.id);
      }
      tx.objectStore("curricula").delete(curriculumId);
    }),
    saveOffering: (offering) => transact(["curricula", "subjects", "curriculumSubjects", "classes", "classSubjects"], "readwrite", (records, tx) => {
      if (!find(records.curricula, offering.curriculumId)) fail("Choose an existing curriculum.");
      const subject = find(records.subjects, offering.subjectId);
      if (!subject) fail("Choose an existing subject.");
      if (subject.status === "inactive") fail("Inactive subjects cannot be added to a curriculum.");
      if (!Number.isInteger(Number(offering.yearLevel)) || Number(offering.yearLevel) < 1 || Number(offering.yearLevel) > 5) fail("Year level must be between 1 and 5.");
      if (!["1", "2", "summer"].includes(offering.semester)) fail("Choose a valid semester.");
      const duplicate = records.curriculumSubjects.find((item) => item.id !== offering.id && item.curriculumId === offering.curriculumId && Number(item.yearLevel) === Number(offering.yearLevel) && item.semester === offering.semester && item.subjectId === offering.subjectId);
      if (duplicate) fail("This subject is already included in that year level and semester.");
      const existing = find(records.curriculumSubjects, offering.id);
      const usedByClass = existing && records.classes.some((classRecord) =>
        classRecord.curriculumId === existing.curriculumId && Number(classRecord.yearLevel) === Number(existing.yearLevel) && classRecord.semester === existing.semester &&
        records.classSubjects.some((link) => link.classId === classRecord.id && link.subjectId === existing.subjectId));
      if (usedByClass && (existing.curriculumId !== offering.curriculumId || Number(existing.yearLevel) !== Number(offering.yearLevel) ||
        existing.semester !== offering.semester || existing.subjectId !== offering.subjectId)) {
        fail("This offering is used by a class. Update the class before moving this curriculum subject.");
      }
      const saved = { ...offering, id: offering.id || id(), yearLevel: Number(offering.yearLevel) };
      tx.objectStore("curriculumSubjects").put(saved);
      return saved;
    }),
    deleteOffering: (offeringId) => transact(["curriculumSubjects", "classes", "classSubjects"], "readwrite", (records, tx) => {
      const offering = find(records.curriculumSubjects, offeringId);
      if (!offering) fail("That curriculum subject no longer exists.");
      const linkedClassIds = new Set(records.classes.filter((item) => item.curriculumId === offering.curriculumId && Number(item.yearLevel) === Number(offering.yearLevel) && item.semester === offering.semester).map((item) => item.id));
      if (records.classSubjects.some((item) => linkedClassIds.has(item.classId) && item.subjectId === offering.subjectId)) fail("A class includes this subject. Remove it from the class before changing the curriculum.");
      tx.objectStore("curriculumSubjects").delete(offeringId);
    }),
    saveClass: (classRecord, subjectIds) => transact(["programs", "curricula", "subjects", "curriculumSubjects", "classes", "classSubjects", "assignments", "teachers"], "readwrite", (records, tx) => {
      const curriculum = find(records.curricula, classRecord.curriculumId);
      if (!curriculum) fail("Choose an existing curriculum.");
      const existingClass = find(records.classes, classRecord.id);
      const classProgram = find(records.programs, curriculum.programId);
      if ((!classProgram || classProgram.archived) && !existingClass) fail("New classes can only be created for active programs.");
      if (curriculum.status === "inactive" && !existingClass) fail("New classes can only use an active curriculum.");
      const yearLevel = Number(classRecord.yearLevel);
      if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 5) fail("Year level must be between 1 and 5.");
      if (!["1", "2", "summer"].includes(classRecord.semester)) fail("Choose a valid semester.");
      if (!classRecord.section.trim() || !classRecord.academicYear.trim()) fail("Enter a section and academic year.");
      const validSubjectIds = new Set(records.curriculumSubjects
        .filter((item) => item.curriculumId === curriculum.id && Number(item.yearLevel) === yearLevel && item.semester === classRecord.semester)
        .filter((item) => { const subject = find(records.subjects, item.subjectId); return subject && subject.status !== "inactive"; })
        .map((item) => item.subjectId));
      if (!subjectIds.length) fail("Include at least one curriculum subject in the class.");
      if (subjectIds.some((subjectId) => !validSubjectIds.has(subjectId))) fail("A selected subject does not belong to this curriculum, year level, and semester.");
      const duplicate = records.classes.find((item) =>
        item.id !== classRecord.id && item.curriculumId === curriculum.id && Number(item.yearLevel) === yearLevel &&
        matches(item.section, classRecord.section) && matches(item.academicYear, classRecord.academicYear) && item.semester === classRecord.semester);
      if (duplicate) fail("A class already exists for this curriculum, year level, section, academic year, and semester.");

      const selected = new Set(subjectIds);
      const assignedSubjectIds = new Set(records.assignments.filter((item) => item.classId === classRecord.id).map((item) => item.subjectId));
      if ([...assignedSubjectIds].some((subjectId) => !selected.has(subjectId))) fail("Remove teacher assignments for a subject before removing it from this class.");

      if (!["active", "inactive", "cancelled"].includes(classRecord.status || "active")) fail("Choose a valid class status.");
      const capacity = Number(classRecord.maxStudents || (existingClass && existingClass.maxStudents) || 40);
      if (!Number.isInteger(capacity) || capacity < 1) fail("Maximum students must be at least 1.");
      const scheduleEntries = Array.isArray(classRecord.scheduleEntries) ? classRecord.scheduleEntries.map((entry) => ({
        days: Array.isArray(entry.days) ? [...new Set(entry.days)] : [],
        startTime: String(entry.startTime || ""),
        endTime: String(entry.endTime || ""),
        room: String(entry.room || "").trim(),
        building: String(entry.building || "").trim(),
        mode: String(entry.mode || "On campus"),
        subjectId: String(entry.subjectId || "")
      })) : [];
      const schedules = Array.isArray(classRecord.scheduleEntries) ? scheduleEntries : [{
        days: Array.isArray(classRecord.scheduleDays) ? [...new Set(classRecord.scheduleDays)] : [],
        startTime: String(classRecord.startTime || ""),
        endTime: String(classRecord.endTime || ""),
        room: String(classRecord.room || "").trim(),
        building: String(classRecord.building || "").trim(),
        mode: String(classRecord.mode || "On campus"),
        subjectId: ""
      }];
      if (schedules.some((entry) => entry.subjectId && !selected.has(entry.subjectId))) fail("A schedule entry can only be linked to a subject included in this class.");
      if (!existingClass && !schedules.length) fail("Add at least one schedule entry when creating a class.");
      if (schedules.some((entry) => !entry.days.length || !entry.startTime || !entry.endTime || !entry.room)) fail("Each schedule entry needs at least one day, start and end time, and room.");
      if (schedules.some((entry) => entry.days.some((day) => !["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day)))) fail("Choose valid class schedule days.");
      if (schedules.some((entry) => entry.startTime >= entry.endTime)) fail("Class end time must be after start time.");
      if (schedules.some((entry) => !["On campus", "Hybrid", "Online"].includes(entry.mode))) fail("Choose a valid class mode.");
      for (let index = 0; index < schedules.length; index += 1) {
        if (schedulesConflict([schedules[index]], schedules.slice(index + 1))) fail("A class cannot have overlapping schedule entries.");
      }
      const primarySchedule = schedules[0] || { days: [], startTime: "", endTime: "", room: "", building: "", mode: "On campus" };
      const saved = {
        scheduleDays: [],
        room: "",
        startTime: "",
        endTime: "",
        maxStudents: 40,
        status: "active",
        ...classRecord,
        id: classRecord.id || id(),
        curriculumId: curriculum.id,
        programId: curriculum.programId,
        yearLevel,
        scheduleEntries: schedules,
        scheduleDays: primarySchedule.days,
        startTime: primarySchedule.startTime,
        endTime: primarySchedule.endTime,
        room: primarySchedule.room,
        building: primarySchedule.building,
        mode: primarySchedule.mode,
        maxStudents: capacity,
        status: classRecord.status || "active"
      };
      for (const assignment of records.assignments.filter((item) => item.classId === saved.id)) {
        for (const otherAssignment of records.assignments) {
          if (otherAssignment.classId === saved.id || otherAssignment.teacherId !== assignment.teacherId) continue;
          const otherClass = find(records.classes, otherAssignment.classId);
          if (!otherClass || otherClass.academicYear !== saved.academicYear || otherClass.semester !== saved.semester) continue;
          if (schedulesConflict(schedulesForClass(saved), schedulesForClass(otherClass))) {
            const teacher = find(records.teachers, assignment.teacherId);
            fail(`This schedule conflicts with another class assigned to ${teacher ? teacher.name : "the teacher"}.`);
          }
        }
      }
      tx.objectStore("classes").put(saved);
      const classSubjects = tx.objectStore("classSubjects");
      const existing = records.classSubjects.filter((item) => item.classId === saved.id);
      for (const item of existing) if (!selected.has(item.subjectId)) classSubjects.delete(item.id);
      const existingIds = new Set(existing.map((item) => item.subjectId));
      for (const subjectId of selected) {
        if (!existingIds.has(subjectId)) classSubjects.put({ id: id(), classId: saved.id, subjectId });
      }
      return saved;
    }),
    deleteClass: (classId) => transact(["classes", "classSubjects", "assignments"], "readwrite", (records, tx) => {
      if (!find(records.classes, classId)) fail("That class no longer exists.");
      if (records.assignments.some((item) => item.classId === classId)) fail("Remove this class's teacher assignments before deleting it.");
      for (const item of records.classSubjects) if (item.classId === classId) tx.objectStore("classSubjects").delete(item.id);
      tx.objectStore("classes").delete(classId);
    }),
    deleteAllClassSchedules: () => transact(["classes"], "readwrite", (records, tx) => {
      let deletedCount = 0;
      const updates = records.classes.map((classRecord) => {
        const hasLegacySchedule = (classRecord.scheduleDays || []).length || classRecord.startTime || classRecord.endTime || classRecord.room || classRecord.building;
        const schedules = Array.isArray(classRecord.scheduleEntries) && classRecord.scheduleEntries.length
          ? classRecord.scheduleEntries
          : hasLegacySchedule ? [{
            days: classRecord.scheduleDays || [],
            startTime: classRecord.startTime || "",
            endTime: classRecord.endTime || "",
            room: classRecord.room || "",
            building: classRecord.building || "",
            mode: classRecord.mode || "On campus",
            subjectId: ""
          }] : [];
        deletedCount += schedules.length;
        return {
          ...classRecord,
          scheduleEntries: [],
          scheduleDays: [],
          startTime: "",
          endTime: "",
          room: "",
          building: "",
          mode: ""
        };
      });

      const classStore = tx.objectStore("classes");
      for (const classRecord of updates) classStore.put(classRecord);
      return deletedCount;
    }),
    saveTeacher: (teacher) => transact(["teachers"], "readwrite", (records, tx) => {
      const cleanName = teacher.name.trim();
      const department = teacher.department.trim();
      if (!cleanName || !department) fail("Enter the teacher's name and department.");
      if (!["Full-Time", "Part-Time"].includes(teacher.employmentType)) fail("Choose a valid employment type.");
      if (!["active", "inactive"].includes(teacher.status)) fail("Choose a valid employment status.");
      const duplicate = records.teachers.find((item) => item.id !== teacher.id && matches(item.name, cleanName));
      if (duplicate) fail("A teacher with that name is already in the directory.");
      const saved = {
        ...find(records.teachers, teacher.id),
        ...teacher,
        id: teacher.id || id(),
        name: cleanName,
        department,
        employmentType: teacher.employmentType,
        status: teacher.status
      };
      tx.objectStore("teachers").put(saved);
      return saved;
    }),
    saveAssignment: (assignment) => transact(["classes", "classSubjects", "teachers", "assignments"], "readwrite", (records, tx) => {
      const classRecord = find(records.classes, assignment.classId);
      if (!classRecord) fail("Choose an existing class.");
      if (classRecord.status === "inactive" || classRecord.status === "cancelled") fail("Teachers can only be assigned to active classes.");
      if (!records.classSubjects.some((item) => item.classId === assignment.classId && item.subjectId === assignment.subjectId)) fail("That subject is not included in the selected class.");
      const teacher = find(records.teachers, assignment.teacherId);
      if (!teacher) fail("Choose an existing teacher.");
      if (teacher.status === "inactive") fail("This teacher is inactive and cannot be assigned.");
      const duplicate = records.assignments.find((item) => item.id !== assignment.id && item.classId === assignment.classId && item.subjectId === assignment.subjectId);
      if (duplicate) fail("A teacher is already assigned to this subject in the selected class.");
      const classSchedules = schedulesForClass(classRecord).filter((entry) => !entry.subjectId || entry.subjectId === assignment.subjectId);
      for (const existing of records.assignments) {
        if (existing.id === assignment.id || existing.teacherId !== assignment.teacherId) continue;
        const otherClass = find(records.classes, existing.classId);
        if (!otherClass || otherClass.id === classRecord.id || otherClass.academicYear !== classRecord.academicYear || otherClass.semester !== classRecord.semester) continue;
        const otherSchedules = schedulesForClass(otherClass).filter((entry) => !entry.subjectId || entry.subjectId === existing.subjectId);
        if (schedulesConflict(classSchedules, otherSchedules)) {
          fail(`Schedule conflict: this teacher already has a class in ${otherClass.section} (${otherClass.academicYear}, ${otherClass.semester}) at an overlapping day and time.`);
        }
      }
      const saved = { ...assignment, id: assignment.id || id() };
      tx.objectStore("assignments").put(saved);
      return saved;
    }),
    deleteAssignment: (assignmentId) => transact(["assignments"], "readwrite", (records, tx) => {
      if (!find(records.assignments, assignmentId)) fail("That assignment no longer exists.");
      tx.objectStore("assignments").delete(assignmentId);
    })
  };

  window.AcademicDB = api;
})();
