(() => {
  "use strict";

  window.BSITCurriculumSeed = {
    programId: "bsit",
    curriculumId: "curriculum-bsit-cmo25-2015",
    curriculumYear: "CMO No. 25 (2015)",
    importSource: "fullbright-bsit-cmo25-2015",
    source: "Fullbright College BSIT curriculum images supplied by the administrator",
    subjects: [
      { code: "FCMATH", name: "Fundamental Concepts of Mathematics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENGPLU1", name: "English Plus", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CPROG1", name: "Computer Programming 1 (Fundamentals of Programming)", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "CWTS11", name: "NSTP 1 (Civic Welfare Training Service 1)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED6", name: "Purposive Communication", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED5", name: "Art Appreciation", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED7", name: "Science, Technology, and Society", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED8", name: "Ethics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENEL1", name: "General Elective (Living in the IT Era)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CCFUND", name: "Introduction to Computing", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC1", name: "Self Testing Activities", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "CPROG2", name: "Computer Programming 2 (Intermediate Programming)", prerequisiteCodes: ["CPROG1"], yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "CWTS12", name: "NSTP 2 (Civic Welfare Training Service 2)", prerequisiteCodes: ["CWTS11"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "DISCRT", name: "Discrete Mathematics", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED1", name: "Understanding the Self", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED2", name: "Readings in Philippine History", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED3", name: "The Contemporary World", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "HUMAN1", name: "Introduction to Human and Computer Interaction", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "PEDUC2", name: "Rhythmic Activities", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "DSALGO", name: "Data Structures and Algorithms", prerequisiteCodes: ["CPROG2"], yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "GENEL2", name: "General Elective 2 (The Entrepreneurial Mind)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENEL3", name: "General Elective 3 (Philippine Popular Culture)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "OOPROG", name: "Object Oriented Programming", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "PEDUC3", name: "Games and Sports", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "PLTECH", name: "Elective 2 (Platform Technologies)", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },

      { code: "GENED4", name: "Mathematics in the Modern World", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED9", name: "Rizal's Life and Works", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "INFORM", name: "Information Management 1", prerequisiteCodes: ["DSALGO"], yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "INPROG", name: "Integrative Programming and Technologies", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "NETWO1", name: "Networking 1", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "PEDUC4", name: "Recreational Activities", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "QUANM", name: "Quantitative Methods (including Modeling and Simulation)", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },

      { code: "ADMSYS", name: "Advanced Database Systems", yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "NETWO2", name: "Networking 2", prerequisiteCodes: ["NETWO1"], yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "SYSINT1", name: "Systems Integration and Architecture 1", yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "WEBSYS", name: "Elective 3 (Web Systems and Technologies)", yearLevel: 3, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },

      { code: "ADETEC", name: "Application Development and Emerging Technologies", prerequisiteCodes: ["CPROG2"], yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "IASEC1", name: "Information Assurance and Security 1", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 1, sourceNeedsReview: true },
      { code: "SYSAD1", name: "Systems Administration and Maintenance", yearLevel: 3, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "SOCPRO", name: "Social and Professional Issues", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "IASEC2", name: "Information Assurance and Security 2", prerequisiteCodes: ["IASEC1"], yearLevel: 4, semester: "1", lectureHours: 2, laboratoryHours: 3, units: 3 },
      { code: "THESI1", name: "Capstone Project 1", prerequisiteText: "4th year standing", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },

      { code: "ITOPRA", name: "Practicum", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 0, laboratoryHours: 6, units: 6, sourceNeedsReview: true },
      { code: "SYSINT2", name: "Elective 4 (Systems Integration and Architecture 2)", yearLevel: 4, semester: "2", lectureHours: 2, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "THESI2", name: "Capstone Project 2", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true }
    ]
  };
})();
