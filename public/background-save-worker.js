// 백그라운드 저장 Web Worker
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  if (type === 'SAVE_KEYWORDS') {
    const { keywords, onProgress, onComplete } = data;
    
    // 백그라운드에서 키워드 저장
    saveKeywordsInBackground(keywords, onProgress, onComplete);
  }
};

async function saveKeywordsInBackground(keywords, onProgress, onComplete) {
  let completed = 0;
  let failed = 0;
  
  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    
    try {
      // 서버로 키워드 저장 요청
      const response = await fetch('/api/keywords/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyword),
      });
      
      const result = await response.json();
      
      if (result.success) {
        completed++;
        console.log(`백그라운드 저장 완료: ${keyword.keyword}`);
      } else {
        failed++;
        console.error(`백그라운드 저장 실패: ${keyword.keyword}`, result.error);
      }
    } catch (error) {
      failed++;
      console.error(`백그라운드 저장 오류: ${keyword.keyword}`, error);
    }
    
    // 진행 상황 전송
    self.postMessage({
      type: 'PROGRESS',
      data: {
        current: i + 1,
        total: keywords.length,
        completed,
        failed,
      }
    });
    
    // 저장 간격
    if (i < keywords.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // 완료 알림
  self.postMessage({
    type: 'COMPLETE',
    data: {
      completed,
      failed,
      total: keywords.length,
    }
  });
}
