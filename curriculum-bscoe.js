(() => {
  "use strict";

  window.BSCOECurriculumSeed = {
    programId: "bscoe",
    curriculumYear: "CMO No. 87 (2017)",
    source: "Fullbright College BSCOE curriculum images supplied by the administrator",
    subjects: [
      { code: "FCMATH", name: "Fundamental Concepts of Mathematics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENGPLU1", name: "English Plus", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CALCU1", name: "Calculus 1", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "COEDS", name: "Computer Engineering as a Discipline", yearLevel: 1, semester: "1", lectureHours: 1, laboratoryHours: 0, units: 1, sourceNeedsReview: true },
      { code: "GENCHE", name: "Chemistry for Engineers", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENED1", name: "Understanding the Self", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED7", name: "Science, Technology, Engineering and Society", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED4", name: "Mathematics for the Modern World", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PROGLO", name: "Programming Logic and Design", yearLevel: 1, semester: "1", lectureHours: 0, laboratoryHours: 5, units: 2 },
      { code: "PEDUCA", name: "Self Testing Activities", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "CWTS11", name: "NSTP 1 (Civic Welfare Training Service 1)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "CALCU2", name: "Calculus 2", yearLevel: 1, semester: "2", prerequisiteCodes: ["CALCU1"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENPHY1", name: "Physics for Engineers", yearLevel: 1, semester: "2", prerequisiteCodes: ["CALCU1"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "OOPROG", name: "Object Oriented Programming", yearLevel: 1, semester: "2", prerequisiteCodes: ["PROGLO"], lectureHours: 0, laboratoryHours: 5, units: 3 },
      { code: "GENED2", name: "Readings in Philippine History", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENDATA", name: "Engineering Data Analysis", yearLevel: 1, semester: "2", prerequisiteCodes: ["CALCU1"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "DISCRT", name: "Discrete Mathematics", yearLevel: 1, semester: "2", prerequisiteCodes: ["CALCU1"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC2", name: "Rhythmic Activities", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "CWTS12", name: "NSTP 2 (Civic Welfare Training Service 2)", yearLevel: 1, semester: "2", prerequisiteCodes: ["CWTS11"], lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "DEQUAT", name: "Differential Equations", yearLevel: 2, semester: "1", prerequisiteCodes: ["CALCU2"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED5", name: "Art Appreciation", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "DSALNA", name: "Data Structures and Algorithms", yearLevel: 2, semester: "1", prerequisiteCodes: ["OOPROG"], lectureHours: 0, laboratoryHours: 6, units: 2 },
      { code: "ECONO", name: "Engineering Economics", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "FELCIR", name: "Fundamentals of Electrical Circuits", yearLevel: 2, semester: "1", prerequisiteCodes: ["ENPHY1"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENEL1", name: "General Elective (Living in the IT Era)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CADRA", name: "Computer Aided Drafting", yearLevel: 2, semester: "1", prerequisiteText: "2nd year standing", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "PEDUC3", name: "Games and Sports", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2, sourceNeedsReview: true },

      { code: "NUMETH", name: "Numerical Methods", yearLevel: 2, semester: "2", prerequisiteCodes: ["DEQUAT"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "SDESIG", name: "Software Design", yearLevel: 2, semester: "2", prerequisiteCodes: ["DSALNA"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENED6", name: "Purposive Communication", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "FLECTRO", name: "Fundamentals of Electronics Circuits", yearLevel: 2, semester: "2", prerequisiteCodes: ["FELCIR"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENED9", name: "Rizal's Life and Works", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED3", name: "The Contemporary World", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC4", name: "Recreational Activities", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "LCDES", name: "Logic Circuits and Design", yearLevel: 3, semester: "1", prerequisiteCodes: ["FLECTRO"], lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "OESYS", name: "Operating Systems", yearLevel: 3, semester: "1", prerequisiteCodes: ["DSALNA"], lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "DATCOM", name: "Data and Digital Communications", yearLevel: 3, semester: "1", prerequisiteCodes: ["FLECTRO"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "INTROL", name: "Introduction to HDL", yearLevel: 3, semester: "1", prerequisiteCodes: ["FLECTRO", "LCDES"], lectureHours: 0, laboratoryHours: 3, units: 1 },
      { code: "ECOSYS", name: "Feedback and Control Systems", yearLevel: 3, semester: "1", prerequisiteCodes: ["NUMETH", "FELCIR"], lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "FAMISS", name: "Fundamentals of Mixed Signals and Sensors", yearLevel: 3, semester: "1", prerequisiteCodes: ["FLECTRO"], lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "CODECAD", name: "Computer Engineering Drafting and Design", yearLevel: 3, semester: "1", lectureHours: 0, laboratoryHours: 3, units: 1 },
      { code: "COELE1", name: "Cognate/Elective Course 1", yearLevel: 3, semester: "1", prerequisiteText: "3rd year standing", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "BOHSAF", name: "Basic Occupational Health and Safety", yearLevel: 3, semester: "2", prerequisiteText: "3rd year standing", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "NETSEC", name: "Computer Networks and Security", yearLevel: 3, semester: "2", prerequisiteCodes: ["DATCOM"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "MSYSTE", name: "Microprocessor", yearLevel: 3, semester: "2", prerequisiteCodes: ["LCDES"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "MRESEA", name: "Methods of Research", yearLevel: 3, semester: "2", prerequisiteCodes: ["ENDATA", "GENED5", "LCDES"], lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "TECHNO", name: "Technopreneurship", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED8", name: "Ethics", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "COELAW", name: "CpE Laws and Professional Practice", yearLevel: 3, semester: "2", prerequisiteText: "3rd year standing", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "COELE2", name: "Cognate/Elective Course 2", yearLevel: 3, semester: "2", prerequisiteText: "3rd year standing", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "EMSYS", name: "Embedded Systems", yearLevel: 4, semester: "1", prerequisiteCodes: ["MSYSTE"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "COMORG", name: "Computer Architecture and Organization", yearLevel: 4, semester: "1", prerequisiteCodes: ["MSYSTE"], lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "EMTECH", name: "Emerging Technologies in CpE", yearLevel: 4, semester: "1", prerequisiteText: "4th year standing", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "DPRD01", name: "CpE Practice and Design 1", yearLevel: 4, semester: "1", prerequisiteCodes: ["MSYSTE", "MRESEA"], lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "DSPROG", name: "Digital Signal Processing", yearLevel: 4, semester: "1", prerequisiteCodes: ["ECOSYS"], lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "GENEL2", name: "General Elective 2 (The Entrepreneurial Mind)", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "COELE3", name: "Cognate/Elective Course 3", yearLevel: 4, semester: "1", prerequisiteText: "4th year standing", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "DPRD02", name: "CpE Practice and Design 2", yearLevel: 4, semester: "2", prerequisiteCodes: ["DPRD01"], lectureHours: 0, laboratoryHours: 6, units: 2, sourceNeedsReview: true },
      { code: "SEMINAR", name: "Seminars and Fieldtrips", yearLevel: 4, semester: "2", prerequisiteText: "4th year standing", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "PRACUM", name: "On the Job Training (240 Hrs)", yearLevel: 4, semester: "2", prerequisiteText: "4th year standing", lectureHours: 3, laboratoryHours: 240, units: 3, sourceNeedsReview: true },
      { code: "GENEL3", name: "General Elective 3 (Philippine Popular Culture)", yearLevel: 4, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true }
    ]
  };
})();
