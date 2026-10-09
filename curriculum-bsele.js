(() => {
  "use strict";

  window.BSELECurriculumSeed = {
    programId: "bsele",
    curriculumId: "curriculum-bsele-cmo301-2017",
    curriculumYear: "CMO No. 301 (2017)",
    importSource: "fullbright-bsele-cmo301-2017",
    source: "Fullbright College BSELE curriculum images supplied by the administrator",
    subjects: [
      { code: "FCMATH", name: "Fundamental Concepts of Mathematics", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENGPLU1", name: "English Plus", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CALCU1", name: "Calculus 1", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "CWTS11", name: "NSTP 1 (Civic Welfare Training Service 1)", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENDATA", name: "Engineering Data Analysis", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENCHE", name: "Chemistry for Engineers", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENED1", name: "Understanding the Self", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED4", name: "Mathematics for the Modern World", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED7", name: "Science, Technology, and Society", yearLevel: 1, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC1", name: "Self Testing Activities", yearLevel: 1, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "CALCU2", name: "Calculus 2", prerequisiteCodes: ["CALCU1"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENPROG", name: "Computer Programming", yearLevel: 1, semester: "2", lectureHours: 0, laboratoryHours: 6, units: 2, sourceNeedsReview: true },
      { code: "CWTS12", name: "NSTP 2 (Civic Welfare Training Service 2)", prerequisiteCodes: ["CWTS11"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ENPHY1", name: "Physics for Engineers 1", prerequisiteCodes: ["CALCU1", "CALCU2"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "ENPHY2", name: "Physics for Engineers 2", prerequisiteCodes: ["CALCU1", "ENPHY1"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENED2", name: "Readings in Philippine History", yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "MSCIEN", name: "Materials Science and Engineering", prerequisiteCodes: ["GENCHE"], yearLevel: 1, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "PEDUC2", name: "Rhythmic Activities", yearLevel: 1, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "CADRAF", name: "Computer Aided Drafting", prerequisiteText: "2nd year standing", yearLevel: 2, semester: "1", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "CALCU3", name: "Calculus 3", prerequisiteCodes: ["ENPHY2"], yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "DEQUAT", name: "Differential Equations", prerequisiteCodes: ["CALCU2"], yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ECELEC", name: "ECE Laws, Contracts, Ethics, Standards and Safety", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "ECONOM", name: "Engineering Economics", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "ELEC1", name: "Electronics 1 (Electronic Devices and Circuit)", prerequisiteCodes: ["CIRCU1"], yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "GENED5", name: "Art Appreciation", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENEL1", name: "General Elective (Living in the IT Era)", yearLevel: 2, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC3", name: "Games and Sports", yearLevel: 2, semester: "1", lectureHours: 2, laboratoryHours: 0, units: 2 },

      { code: "ANUMAT", name: "Advanced Engineering Mathematics for ECE", prerequisiteCodes: ["DEQUAT"], yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "CIRCU2", name: "Circuits 2", prerequisiteCodes: ["CIRCU1"], yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "ENELAN", name: "Electronics 1 (Electronic Circuit Analysis and Design)", prerequisiteCodes: ["ELEC1"], yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "ELECMAG", name: "Electromagnetics", prerequisiteCodes: ["DEQUAT"], yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "EMANAG", name: "Engineering Management", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "GENED9", name: "Rizal's Life and Works", yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "PEDUC4", name: "Recreational Activities", yearLevel: 2, semester: "2", lectureHours: 2, laboratoryHours: 0, units: 2 },
      { code: "PFCOMM", name: "Fundamentals of Communication Systems", prerequisiteCodes: ["ELEC1"], yearLevel: 2, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },

      { code: "GENED3", name: "The Contemporary World", yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED6", name: "Purposive Communication", yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "GENED8", name: "Ethics", yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "LCTHE", name: "Digital Electronics 1 (Logic Circuit and Switching Theory)", prerequisiteCodes: ["ELEC1"], yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "MCOTEC", name: "Communication 2 (Modulation and Coding Techniques)", prerequisiteCodes: ["PFCOMM"], yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "SSNPRO", name: "Signals, Spectra and Signal Processing", prerequisiteCodes: ["ANUMAT"], yearLevel: 3, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },

      { code: "TMASYS", name: "Communications 3 (Transmission Media and Antenna System and Design)", prerequisiteCodes: ["MCOTEC"], yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "DATCOM", name: "Communication 4 (Data Communications)", prerequisiteCodes: ["MCOTEC"], yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "ECOSYS", name: "Feedback and Control Systems", prerequisiteCodes: ["ANUMAT"], yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4 },
      { code: "GENEL2", name: "General Elective 2 (The Entrepreneurial Mind)", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "MSYSTE", name: "Digital Electronics 2 (Microprocessor and Microcontroller Systems and Design)", prerequisiteCodes: ["LCTHE"], yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "TECHNO", name: "Technopreneurship", yearLevel: 3, semester: "2", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "CPRD01", name: "Design 1 (Capstone Project 1)", prerequisiteCodes: ["ELECSY", "ECONOM", "MSYSTE", "DATCOM"], yearLevel: 4, semester: "1", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "ECELE1", name: "ECE Elective 1 (Advanced Communication System and Design/Antenna)", prerequisiteCodes: ["DATCOM"], yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "ENVSCI", name: "Environmental Science and Engineering", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3, sourceNeedsReview: true },
      { code: "EPRBOT", name: "ECE Elective (Robotics Technology)", prerequisiteCodes: ["ELEC1"], yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 3, units: 3, sourceNeedsReview: true },
      { code: "GENEL3", name: "General Elective 3 (Philippine Popular Culture)", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },
      { code: "MRESEA", name: "Methods of Research", prerequisiteText: "4th year standing", yearLevel: 4, semester: "1", lectureHours: 3, laboratoryHours: 0, units: 3 },

      { code: "COMCLA", name: "Comprehensive Class", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 0, laboratoryHours: 0, units: 1, sourceNeedsReview: true },
      { code: "DPRD02", name: "Design 2 (Capstone Project 2)", prerequisiteCodes: ["CPRD01", "ECONOM", "MSYSTE", "DATCOM"], yearLevel: 4, semester: "2", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true },
      { code: "ECELE2", name: "ECE Elective 2 (Advanced Networking)", prerequisiteCodes: ["DATCOM"], yearLevel: 4, semester: "2", lectureHours: 3, laboratoryHours: 3, units: 4, sourceNeedsReview: true },
      { code: "PRACUM", name: "On the Job Training (240 hrs)", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 3, laboratoryHours: 240, units: 3, sourceNeedsReview: true },
      { code: "SEMINR", name: "Seminars and Field Trips", prerequisiteText: "4th year standing", yearLevel: 4, semester: "2", lectureHours: 0, laboratoryHours: 3, units: 1, sourceNeedsReview: true }
    ]
  };
})();
