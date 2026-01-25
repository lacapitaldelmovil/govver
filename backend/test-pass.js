const bcrypt = require("bcryptjs");
const hash = "$2a$10$XuhoUcceffYy24wvKDM3h.q1GxJe5y6LqsmupY7ijOTK54sx5Bq9a";
console.log("admin123:", bcrypt.compareSync("admin123", hash));
console.log("SuperAdmin2024!:", bcrypt.compareSync("SuperAdmin2024!", hash));
console.log("superadmin:", bcrypt.compareSync("superadmin", hash));
