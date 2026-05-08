export const SUBJECT_CATEGORIES: Record<string, string[]> = {
  "Math": [
    "Algebra I", "Algebra II", "Geometry", "Pre-Calculus", "Calculus",
    "Statistics", "AP Calculus AB", "AP Calculus BC", "Math Fundamentals"
  ],
  "Science": [
    "Biology", "Chemistry", "Physics", "Earth Science", "Environmental Science",
    "AP Biology", "AP Chemistry", "AP Physics", "Science Fundamentals"
  ],
  "English": [
    "English/Language Arts", "Reading Comprehension", "Writing", "Literature",
    "AP English Language", "AP English Literature", "Grammar", "Creative Writing"
  ],
  "History": [
    "World History", "US History", "Government", "Economics", "Geography",
    "AP World History", "AP US History", "AP Government", "Civics"
  ],
  "Computer Science": [
    "Computer Science", "Programming", "Web Development", "Python", "Java",
    "JavaScript", "AP Computer Science", "Data Structures"
  ],
  "Languages": [
    "Spanish", "French", "German", "Italian", "Latin", "Chinese", "Japanese",
    "AP Spanish", "AP French", "ESL/English as Second Language"
  ],
  "Other": [
    "Psychology", "Sociology", "Philosophy", "AP Psychology", "Art", "Music Theory",
    "Health", "Physical Education", "Study Skills", "Test Preparation", "SAT Prep", "ACT Prep"
  ]
};

export const ALL_SUBJECTS = Object.values(SUBJECT_CATEGORIES).flat();
