'use client';

import React, { useState, useEffect,use, useRef } from 'react';

export default function VocabularyPage({params}) {
  const { day } = use(params);
  const [words, setWords] = useState([]); // 현재 날짜의 단어 데이터
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 단어 인덱스
  const [isFlipped, setIsFlipped] = useState(false); // 카드 뒤집힘 상태
  // const [day, setDay] = useState(1); // 현재 날짜
  const [selectedDay, setSelectedDay] = useState(day); // 단어 추가에 사용할 날짜
  const [newWord, setNewWord] = useState(''); // 새 단어 입력
  const [newMeaning, setNewMeaning] = useState(''); // 새 뜻 입력
  const [showAddForm, setShowAddForm] = useState(false); // 단어 추가 폼 표시 여부
  const [filterStarred, setFilterStarred] = useState(false);
  const isSubmitting = useRef(false);


  useEffect(() => {
    async function fetchWords() {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${day}?starred=${filterStarred}` // 필터 상태에 따라 API 호출
      );
      const data = await response.json();
      setWords(data);
      setCurrentIndex(0);
    }
  
    fetchWords();
  }, [day, filterStarred]);
  // 서버에서 단어 데이터를 가져오기
  useEffect(() => {
    async function fetchWords() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${day}`); // 동적 API 호출
      const data = await response.json();
      setWords(data);
      setCurrentIndex(0); // 인덱스 초기화
    }
  
    fetchWords();
  }, [day]);
  const currentWord = words[currentIndex] || { word: '', meaning: '' };
  const toggleStar = async (id, newStarState) => {
    try {
      // 요청 URL에 day 포함
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${day}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, star: newStarState }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text(); // 서버 응답 메시지 확인
        console.error('Server Error:', errorMessage);
        alert('별 상태 업데이트에 실패했습니다.');
        return;
      }
  
      // 단어 리스트 갱신
      setWords((prevWords) =>
        prevWords.map((word) =>
          word.id === id ? { ...word, star: newStarState } : word
        )
      );
    } catch (error) {
      console.error('별 상태 업데이트 중 오류:', error);
      alert('별 상태 업데이트 중 문제가 발생했습니다.');
    }
  };

  // 카드 뒤집기
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  function shuffleArray(array) {
    return array
      .map((item) => ({ ...item, sortKey: Math.random() })) // 임시 키 생성
      .sort((a, b) => a.sortKey - b.sortKey) // 임시 키 기준으로 정렬
      .map(({ sortKey, ...item }) => item); // 임시 키 제거 후 반환
  }

  // 이전 단어로 이동
  const prevWord = () => {
    if (isFlipped) {
      // 카드가 뒤집혀 있으면 원래 상태로 복귀 후 이동
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === 0 ? words.length - 1 : prev - 1));
      }, 600); // 0.6초 뒤에 이동
    } else {
      setCurrentIndex((prev) => (prev === 0 ? words.length - 1 : prev - 1));
    }
  };

  // 다음 단어로 이동
  const nextWord = () => {
    if (isFlipped) {
      // 카드가 뒤집혀 있으면 원래 상태로 복귀 후 이동
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
      }, 600); // 0.6초 뒤에 이동
    } else {
      setCurrentIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
    }
  };
  // 새 단어 추가
  const addWord = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = false;
    if (!newWord || !newMeaning) {
      alert('단어와 뜻을 모두 입력하세요.');
      return;
    }
  
    // API 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${selectedDay}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word: newWord, meaning: newMeaning }),
    });
  
    if (!response.ok) {
      alert('단어 추가에 실패했습니다.');
      return;
    }
  
    const addedWord = await response.json();
    alert('단어가 성공적으로 추가되었습니다.');
  
    // 현재 보고 있는 날짜와 동일한 날짜에 추가 시 즉시 업데이트
    if (selectedDay === day) {
      setWords((prevWords) => [...prevWords, { id: addedWord.id, word: newWord, meaning: newMeaning }]);
    }
  
    // 폼 초기화 및 숨기기
    setNewWord('');
    setNewMeaning('');
    setShowAddForm(false);
    setTimeout(()=>{
      isSubmitting.current = true;
    },1200);
  };

  const updateWord = async (id, updatedWord, updatedMeaning) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${day}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, word: updatedWord, meaning: updatedMeaning }),
      });
  
      if (!response.ok) {
        alert('단어 수정에 실패했습니다.');
        return;
      }
  
      alert('단어가 성공적으로 수정되었습니다.');
      setWords((prevWords) =>
        prevWords.map((word) =>
          word.id === id
            ? { ...word, word: updatedWord || word.word, meaning: updatedMeaning || word.meaning }
            : word
        )
      );
    } catch (error) {
      console.error('단어 수정 중 오류:', error);
      alert('단어 수정 중 문제가 발생했습니다.');
    }
  };

  const deleteWord = async (id) => {
    const confirmDelete = window.confirm('이 단어를 삭제하시겠습니까?');
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/words/${day}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
  
      if (!response.ok) {
        alert('단어 삭제에 실패했습니다.');
        return;
      }
  
      alert('단어가 성공적으로 삭제되었습니다.');
      setWords((prevWords) => prevWords.filter((word) => word.id !== id));
    } catch (error) {
      console.error('단어 삭제 중 오류:', error);
      alert('단어 삭제 중 문제가 발생했습니다.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevWord(); // <- 화살표 키 동작
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextWord(); // -> 화살표 키 동작
      } else if (e.key === 'ArrowDown'){
        e.preventDefault();
        flipCard();
      } 
      else if (e.key === 'Enter' && !showAddForm) {
        e.preventDefault();
        setShowAddForm(true);
      } 
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        toggleStar(currentWord?.id, !currentWord.star);
      }
    };

    // 키보드 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown);

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [prevWord, nextWord, addWord]); // 의존성 배열에 함수 포함

  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
        Day {day} Vocabulary Cards
      </h1>
      {/* 카드 UI */}
      <div>
        <button
          onClick={() => toggleStar(currentWord.id, !currentWord.star)}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: currentWord?.star ? 'gold' : '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {currentWord?.star ? '★' : '☆'}
        </button>
        <button
          onClick={() => {
            const updatedWord = prompt('새 단어를 입력하세요:', currentWord.word);
            const updatedMeaning = prompt('새 뜻을 입력하세요:', currentWord.meaning);
            if (updatedWord || updatedMeaning) {
              updateWord(currentWord.id, updatedWord, updatedMeaning);
            }
          }}
          style={{
            margin: '10px',
            padding: '5px 10px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          수정
        </button>
        <button
          onClick={() => deleteWord(currentWord.id)}
          style={{
            margin: '10px',
            padding: '5px 10px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          삭제
        </button>
      </div>

      <div
        onClick={flipCard}
        style={{
          position: 'relative',
          width: '400px',
          height: '250px',
          margin: '30px auto',
          perspective: '1000px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            padding : '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '4px solid #333',
            borderRadius: '15px',
            backgroundColor: '#333',
            color: '#fff',
            fontSize: '3rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {currentWord.word}
          
        </div>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            padding : '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '4px solid #333',
            borderRadius: '15px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            fontSize: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
          }}
        >
          {currentWord.meaning}
        </div>
        
      </div>
      {/* 이전/다음 단어 버튼 */}
      <div>
      <button
          onClick={prevWord}
          style={{
            margin: '10px',
            padding: '10px 30px',
            fontSize: '1.2rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a6268')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#6c757d')}
        >
          Previous
        </button>
        <button
          onClick={nextWord}
          style={{
            margin: '10px',
            padding: '10px 30px',
            fontSize: '1.2rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a6268')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#6c757d')}
        >
          Next
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
      </div>

     
      <button
  onClick={() => setFilterStarred((prev) => !prev)}
  style={{
    margin: '20px',
    padding: '10px 20px',
    backgroundColor: filterStarred ? '#4CAF50' : '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }}
>
  {filterStarred ? '전체 보기' : '★만 보기'}
</button>
<button
    onClick={() => setWords(shuffleArray(words))} // 랜덤으로 섞기
    style={{
      margin: '20px',
      padding: '10px 20px',
      backgroundColor: '#FFA500', // 오렌지 색상
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    }}
  >
    랜덤으로 섞기
  </button>
  <button
          onClick={() => setShowAddForm((prev) => !prev)}
          style={{
            margin: '10px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {showAddForm ? 'x' : '+'}
        </button>
         {/* 단어 추가 폼 */}
      {showAddForm && (
        <div style={{ marginTop: '20px' }}>
          <form
        onSubmit={(e) => {
          e.preventDefault(); // 기본 새로고침 방지
          addWord(); // 추가 버튼 클릭과 동일한 동작 수행
        }}
        style={{ display: 'flex', alignItems: 'center', justifyContent : 'center' }}
      >
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="selectedDay">날짜 선택:</label>
            <select
              id="selectedDay"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              style={{ marginLeft: '10px', padding: '5px', fontSize: '1rem' }}
            >
              {[...Array(30).keys()].map((day) => (
                <option key={day + 1} value={day + 1}>
                  Day {day + 1}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="단어"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            style={{ margin: '10px', padding: '10px', fontSize: '1rem', width: '200px' }}
          />
          <input
            type="text"
            placeholder="뜻"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            style={{ margin: '10px', padding: '10px', fontSize: '1rem', width: '300px' }}
          />
          <button
            type="submit"
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              fontSize: '1rem',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            추가
          </button>
        </form>
        </div>
      )}
    </div>
    
  );
}
