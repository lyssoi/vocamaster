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

  // 샘플 데이터 삽입
  const stmt = db.prepare('INSERT INTO words (word, meaning, day) VALUES (?, ?, ?)');
  stmt.run('replenish', '다시 가득 채우다, 보충하다', 1);
  stmt.run('confront', '직면하다, 처하다; (위험 따위에) 맞서다', 1);
  stmt.run('sterilize', '소독하다, 살균하다', 1);
  stmt.finalize();
});

db.close();
console.log('Database initialized!');
