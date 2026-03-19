document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // LOGIN PAGE HANDLER
  // ==========================
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      const users = JSON.parse(localStorage.getItem("users")) || {};
      if (!users[email]) {
        showNotification("No account found for this email", true);
        return;
      }
      if (users[email].password !== password) {
        showNotification("Incorrect password", true);
        return;
      }

      localStorage.setItem("currentUser", email);
      showNotification("✅ Login successful! Redirecting...", false);
      setTimeout(() => {
        window.location.href = "game.html";
      }, 2000);
    });
  }

  // ==========================
  // REGISTRATION PAGE HANDLER
  // ==========================
  const registrationForm = document.getElementById("registration-form");
  if (registrationForm) {
    registrationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const gender = document.getElementById("gender").value;
      const password = document.getElementById("password").value.trim();

      if (!username || !email || !password) {
        showNotification("Please fill all required fields", true);
        return;
      }

      const users = JSON.parse(localStorage.getItem("users")) || {};
      if (users[email]) {
        showNotification("Email already registered!", true);
        return;
      }

      users[email] = { username, phone, gender, password, highScore: 0 };
      localStorage.setItem("users", JSON.stringify(users));

      showNotification("🎉 Registration successful! Redirecting...", false);
      setTimeout(() => (window.location.href = "login.html"), 2000);
    });
  }

  // ==========================
  // GAME PAGE HANDLER
  // ==========================
  if (window.location.pathname.includes("game.html")) {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Load images
    const bird = new Image();
    bird.src = "images/bird.jpeg";
    
    const topPipeImg = new Image();
    topPipeImg.src = "images/top.jpeg";
    
    const bottomPipeImg = new Image();
    bottomPipeImg.src = "images/bottom.jpeg";
    
    let birdY = 150,
      birdX = 100,
      velocity = 0,
      gravity = 0.5,
      jump = -8,
      score = 0,
      pipes = [],
      gameOver = false,
      gameStarted = false;

    document.addEventListener("keydown", (e) => {
      if (!gameStarted) return;
      if (e.code === "ArrowUp") velocity = jump;
    });

    function createPipe() {
      if (!gameStarted) return;
      let gap = 150;
      let minTopHeight = 50;
      let maxTopHeight = 300; // This ensures bottom pipe starts at max 450, giving 150px height to bottom
      let pipeHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight)) + minTopHeight;
      pipes.push({ x: canvas.width, top: pipeHeight, bottom: pipeHeight + gap, scored: false });
    }

    function update() {
      if (gameOver) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!gameStarted) {
        ctx.drawImage(bird, birdX, birdY, 40, 40);
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Get Ready!", canvas.width/2 - 60, canvas.height/2);
        return requestAnimationFrame(update);
      }

      birdY += velocity;
      velocity += gravity;
      
      // Check if bird hits ground or goes off screen
      if (birdY + 40 >= canvas.height || birdY <= 0) {
        gameOver = true;
        handleGameOver(score);
        return;
      }
      
      ctx.drawImage(bird, birdX, birdY, 40, 40);

      pipes.forEach((p) => {
        p.x -= 2;
        
        // Draw top pipe
        ctx.drawImage(topPipeImg, p.x, 0, 50, p.top);
        
        // Draw bottom pipe - simple approach
let bottomY = p.bottom;
let bottomHeight = canvas.height - p.bottom;       
 ctx.drawImage(bottomPipeImg, p.x, p.bottom, 50, bottomHeight);

        // Collision detection with pipes
        if (
          birdX < p.x + 50 &&
          birdX + 40 > p.x &&
          (birdY < p.top || birdY + 40 > p.bottom)
        ) {
          gameOver = true;
          handleGameOver(score);
          return;
        }

        // Score counting - when bird passes the pipe
        if (!p.scored && p.x + 50 < birdX) {
          score++;
          p.scored = true;
          document.getElementById("scoreLabel").textContent = score;
        }
      });

      pipes = pipes.filter((p) => p.x > -50);

      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText("Score: " + score, 10, 25);

      requestAnimationFrame(update);
    }

    setTimeout(() => {
      gameStarted = true;
      setInterval(createPipe, 2000);
    }, 3000);
    update();
  }

  // ==========================
  // RANKING PAGE HANDLER
  // ==========================
  if (window.location.pathname.includes("ranking.html")) {
    const rankingsList = document.getElementById("rankingsList");
    const users = JSON.parse(localStorage.getItem("users")) || {};

    const sortedUsers = Object.values(users).sort(
      (a, b) => (b.highScore || 0) - (a.highScore || 0)
    );

    if (sortedUsers.length === 0) {
      rankingsList.innerHTML = '<p style="text-align: center; padding: 20px;">No players yet. Register and play to see rankings!</p>';
    } else {
      rankingsList.innerHTML = sortedUsers
        .slice(0, 5)
        .map(
          (u, i) => `
        <div class="ranking-item">
          <span class="rank">#${i + 1}</span>
          <span class="username">${u.username || 'Player'}</span>
          <span class="score">${u.highScore || 0}</span>
        </div>`
        )
        .join("");
    }
  }
});

// ==========================
// SHARED FUNCTIONS
// ==========================
function handleGameOver(score) {
  const email = localStorage.getItem("currentUser");
  const users = JSON.parse(localStorage.getItem("users")) || {};
  if (email && users[email]) {
    if (score > users[email].highScore) users[email].highScore = score;
    localStorage.setItem("users", JSON.stringify(users));
  }
  showNotification(`💥 Game Over! Your Score: ${score}`, true);
  setTimeout(() => (window.location.href = "ranking.html"), 2000);
}

// ==========================
// NOTIFICATION FUNCTION
// ==========================
function showNotification(message, isError = false) {
  const old = document.getElementById("notif");
  if (old) old.remove();

  const box = document.createElement("div");
  box.id = "notif";
  box.textContent = message;
  box.style.position = "fixed";
  box.style.top = "20px";
  box.style.left = "50%";
  box.style.transform = "translateX(-50%)";
  box.style.padding = "15px 30px";
  box.style.borderRadius = "8px";
  box.style.color = "white";
  box.style.background = isError ? "#e74c3c" : "#2ecc71";
  box.style.zIndex = 1000;
  document.body.appendChild(box);

  setTimeout(() => box.remove(), 4000);
}
