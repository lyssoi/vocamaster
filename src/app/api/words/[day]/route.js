import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function DELETE(request, context) {
  const { params } = context;
  const { day } = params;
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const query = 'DELETE FROM words WHERE id = $1 AND day = $2';
    const result = await pool.query(query, [id, Number(day)]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Database error:', error.message);
    return NextResponse.json({ error: 'Failed to delete word', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  const { params } = context;
  const { day } = params;
  const body = await request.json();
  const { id, word, meaning, star } = body;

  if (!id || (!word && !meaning && typeof star !== 'boolean')) {
    return NextResponse.json(
      { error: 'ID and at least one field (word, meaning, or star) are required' },
      { status: 400 }
    );
  }

  const updates = [];
  const values = [];

  if (word) {
    updates.push('word = $' + (updates.length + 1));
    values.push(word);
  }
  if (meaning) {
    updates.push('meaning = $' + (updates.length + 1));
    values.push(meaning);
  }
  if (typeof star === 'boolean') {
    updates.push('star = $' + (updates.length + 1));
    values.push(star);
  }

  values.push(id, Number(day));
  const query = `UPDATE words SET ${updates.join(', ')} WHERE id = $${updates.length + 1} AND day = $${updates.length + 2}`;

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Database error:', error.message);
    return NextResponse.json({ error: 'Failed to update word', details: error.message }, { status: 500 });
  }
}

export async function GET(request, context) {
  const { params } = context;
  const { day } = params;
  const numericDay = Number(day);

  const url = new URL(request.url);
  const showStarred = url.searchParams.get('starred') === 'true';

  const query = showStarred
    ? 'SELECT * FROM words WHERE day = $1 AND star = TRUE'
    : 'SELECT * FROM words WHERE day = $1';

  try {
    const result = await pool.query(query, [numericDay]);
    return NextResponse.json(result.rows || [], { status: 200 });
  } catch (error) {
    console.error('Database query error:', error.message);
    return NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { day } = params;
  const numericDay = Number(day);

  if (isNaN(numericDay)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 });
  }

  const body = await request.json();
  const { word, meaning } = body;

  if (!word || !meaning) {
    return NextResponse.json(
      { error: 'Word and meaning are required' },
      { status: 400 }
    );
  }

  try {
    const query = 'INSERT INTO words (word, meaning, day) VALUES ($1, $2, $3) RETURNING id';
    const result = await pool.query(query, [word, meaning, numericDay]);

    return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Database error:', error.message);
    return NextResponse.json({ error: 'Failed to add word', details: error.message }, { status: 500 });
  }
}
