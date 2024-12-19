const sqlite3 = require('sqlite3').verbose();

// 데이터베이스 파일 생성 또는 열기
const db = new sqlite3.Database('./db.sqlite');

// 데이터베이스 초기화
db.serialize(() => {
  // 단어 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      day INTEGER NOT NULL
    )
  `);
});

db.close();
console.log('Database initialized!');
