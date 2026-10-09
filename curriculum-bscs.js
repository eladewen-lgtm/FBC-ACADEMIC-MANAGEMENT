(() => {
  "use strict";

  window.BSCSCurriculumSeed = {
    programId: "bscs",
    curriculumId: "curriculum-bscs-cmo79-2018",
    curriculumYear: "CMO No. 79 (2018)",
    importSource: "fullbright-bscs-cmo79-2018",
    source: "Fullbright College BSCS curriculum images supplied by the administrator",
    subjects: [
      { code: "FCMATH", name: "Fundamental Concepts of Mathematics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENGPLU1", name: "English Plus", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CPROG1", name: "Computer Programming 1 (Fundamentals of Programming)", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "CWTS11", name: "NSTP 1 (Civic Welfare Training Service 1)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED5", name: "Purposive Communication", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED6", name: "Art Appreciation", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED7", name: "Science, Technology, and Society", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED8", name: "Ethics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENEL1", name: "General Elective (Living in the IT Era)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CCFUND", name: "Introduction to Computing", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC1", name: "Self Testing Activities", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "CWTS12", name: "NSTP 2 (Civic Welfare Training Service 2)", prerequisiteCodes: ["CWTS11"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CPROG2", name: "Computer Programming 2 (Intermediate Programming)", prerequisiteCodes: ["CPROG1"], yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "DISCR1", name: "Discrete Structures 1", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "GENED1", name: "Understanding the Self", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED2", name: "Readings in Philippine History", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED3", name: "The Contemporary World", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "HUMAN1", name: "Human Computer Interaction", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "PEDUC2", name: "Rhythmic Activities", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "ALGCOM", name: "Algorithms and Complexity", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "DISCR2", name: "Discrete Structures 2", prerequisiteCodes: ["DISCR1"], yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "DSALGO", name: "Data Structures and Algorithms", prerequisiteCodes: ["CPROG2"], yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "GENEL2", name: "General Elective 2 (The Entrepreneurial Mind)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENEL3", name: "General Elective 3 (Philippine Popular Culture)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "OOPROG", name: "Object Oriented Programming", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "PEDUC3", name: "Games and Sports", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "GENED4", name: "Mathematics in the Modern World", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED9", name: "Rizal's Life and Works", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "INFORM", name: "Information Management 1", prerequisiteCodes: ["DSALGO"], yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "CALCU2", name: "Math Elective (Calculus 2)", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "PEDUC4", name: "Recreational Activities", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "ADETEC", name: "Application Development and Emerging Technologies", prerequisiteCodes: ["CPROG2"], yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "ARCOIG", name: "Architecture and Organization", yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "CSELE1", name: "CS Elective 1 (Graphics and Visual Computing)", yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "CSO204", name: "Automata Theory and Formal Languages", yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "IASEC1", name: "Information Assurance and Security", yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },

      { code: "CSELE2", name: "CS Elective 2 (Parallel and Distributed Computing)", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "CSELE3", name: "CS Elective 3 (Intelligent Systems)", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "CSO203", name: "Programming Languages", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "CSO207", name: "Operating Systems", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "SOCPRO", name: "Social Issues and Professional Practice 1", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "SOFEN1", name: "Software Engineering 1", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },

      { code: "CSO500", name: "Practicum", prerequisiteText: "4th year standing", yearLevel: 4, semester: "1", lectureHours: 0, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "CSO501", name: "Thesis 1", prerequisiteText: "4th year standing", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "SOFEN2", name: "Software Engineering 2", prerequisiteCodes: ["SOFEN1"], yearLevel: 4, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },

      { code: "CSO502", name: "Thesis 2", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "NETCOM", name: "Networks and Communications", yearLevel: 4, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 }
    ]
  };
})();
