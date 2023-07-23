document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const masterPassword = document.getElementById('masterPassword').value;
  
    if (masterPassword === 'URla26@0548446005') {
      // TODO: פתח את היישום או העבר לדף הבא
      alert('סיסמה נכונה!');
    } else {
      alert('סיסמה שגויה, נסה שוב');
    }  
  });