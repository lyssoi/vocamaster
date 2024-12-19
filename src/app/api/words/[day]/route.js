import sqlite3 from 'sqlite3';
import { NextResponse } from 'next/server';

const DB_PATH = process.cwd() + '/db.sqlite'; // 절대 경로로 설정

export async function DELETE(request, context) {
  const db = new sqlite3.Database('./db.sqlite');
  const params = await context.params;
  const { day } = params; // URL에서 day 추출
  const { id } = await request.json(); // 요청 본문에서 id 추출

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM words WHERE id = ? AND day = ?';
    db.run(query, [id, Number(day)], function (err) {
      if (err) {
        reject(NextResponse.json({ error: 'Failed to delete word', details: err.message }, { status: 500 }));
      } else if (this.changes === 0) {
        resolve(NextResponse.json({ error: 'Word not found' }, { status: 404 }));
      } else {
        resolve(NextResponse.json({ success: true }, { status: 200 }));
      }
    });
  }).finally(() => {
    db.close();
  });
}

export async function PATCH(request, context) {
  const db = new sqlite3.Database('./db.sqlite');
  const params = await context.params;
  const { day } = params; // URL에서 day 추출  const body = await request.json(); // 요청 본문에서 값 추출
  const body = await request.json(); // 요청 본문에서 값 추출
  const { id, word, meaning, star } = body;

  // 유효성 검사: id와 하나 이상의 업데이트 필드 필요
  if (!id || (!word && !meaning && typeof star !== 'boolean')) {
    return NextResponse.json(
      { error: 'ID and at least one field (word, meaning, or star) are required' },
      { status: 400 }
    );
  }

  const updates = [];
  const values = [];

  // 업데이트할 컬럼 추가
  if (word) {
    updates.push('word = ?');
    values.push(word);
  }
  if (meaning) {
    updates.push('meaning = ?');
    values.push(meaning);
  }
  if (typeof star === 'boolean') {
    updates.push('star = ?');
    values.push(star ? 1 : 0); // boolean 값을 1 또는 0으로 변환
  }

  // SQL 업데이트 쿼리 생성
  const query = `UPDATE words SET ${updates.join(', ')} WHERE id = ? AND day = ?`;
  values.push(id, Number(day)); // id와 day 값을 추가

  return new Promise((resolve, reject) => {
    db.run(query, values, function (err) {
      if (err) {
        console.error('Database error:', err.message);
        reject(
          NextResponse.json(
            { error: 'Failed to update word', details: err.message },
            { status: 500 }
          )
        );
      } else if (this.changes === 0) {
        resolve(NextResponse.json({ error: 'Word not found' }, { status: 404 }));
      } else {
        resolve(NextResponse.json({ success: true }, { status: 200 }));
      }
    });
  }).finally(() => {
    db.close();
  });
}


export async function GET(request, context) {
  const db = new sqlite3.Database('./db.sqlite');
  const params = await context.params;
  const { day } = params; // URL에서 day 값 추출
  const numericDay = Number(day);

  const url = new URL(request.url);
  const showStarred = url.searchParams.get('starred') === 'true'; // "starred=true" 쿼리 파라미터 확인

  const query = showStarred
    ? 'SELECT * FROM words WHERE day = ? AND star = 1' // star = 1 필터링
    : 'SELECT * FROM words WHERE day = ?';

  return new Promise((resolve, reject) => {
    db.all(query, [numericDay], (err, rows) => {
      if (err) {
        reject(NextResponse.json({ error: 'Database query failed' }, { status: 500 }));
      } else {
        resolve(NextResponse.json(rows || [], { status: 200 }));
      }
    });
  }).finally(() => {
    db.close();
  });
}


export async function POST(request, { params }) {
  const db = new sqlite3.Database('./db.sqlite'); // DB 파일 경로
  const { day } = params; // URL에서 day 추출
  const numericDay = Number(day); // 숫자로 변환

  if (isNaN(numericDay)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { word, meaning } = body;

    if (!word || !meaning) {
      return NextResponse.json(
        { error: 'Word and meaning are required' },
        { status: 400 }
      );
    }

    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO words (word, meaning, day) VALUES (?, ?, ?)';
      db.run(query, [word, meaning, numericDay], function (err) {
        if (err) {
          console.error('Database error:', err.message);
          reject(NextResponse.json({ error: 'Failed to add word', details: err.message }, { status: 500 }));
        } else {
          resolve(
            NextResponse.json({ success: true, id: this.lastID }, { status: 201 })
          );
        }
      });
    });
  } catch (error) {
    console.error('Request processing error:', error.message);
    return NextResponse.json(
      { error: 'Server error occurred', details: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
