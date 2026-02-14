(function () {
  "use strict";

  const API_ENDPOINT = "/api_submit";
  const pathCategory = window.location.pathname.replace(/\//g, "").trim();
  const defaultCategory = pathCategory || "leetcode";

  let startTimestamp = null;
  let timerInterval = null;

  function formatSeconds(totalSeconds) {
    return Number(totalSeconds).toFixed(2);
  }

  function getElapsedSeconds() {
    if (!startTimestamp) {
      return 0;
    }
    return (Date.now() - startTimestamp) / 1000;
  }

  function ensureStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .api-controls {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2000;
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(15, 15, 15, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 10px 12px;
        color: #fff;
        font-family: Arial, sans-serif;
      }
      .api-controls button {
        border: 0;
        border-radius: 8px;
        padding: 8px 10px;
        font-weight: 600;
        cursor: pointer;
      }
      .api-start-btn {
        background: #1db954;
        color: #fff;
      }
      .api-open-btn {
        background: #2563eb;
        color: #fff;
      }
      .api-timer-label {
        min-width: 82px;
        font-size: 13px;
      }
      .api-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2500;
      }
      .api-modal-backdrop.is-open {
        display: flex;
      }
      .api-modal {
        width: min(92vw, 420px);
        background: #111827;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 14px;
        color: #fff;
        font-family: Arial, sans-serif;
      }
      .api-modal h3 {
        margin: 0 0 10px;
        font-size: 18px;
      }
      .api-modal label {
        display: block;
        margin: 10px 0 6px;
        font-size: 13px;
      }
      .api-modal input {
        width: 100%;
        box-sizing: border-box;
        border-radius: 8px;
        border: 1px solid #374151;
        background: #0f172a;
        color: #fff;
        padding: 8px;
      }
      .api-modal .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
      .api-modal .send-btn {
        background: #16a34a;
        color: #fff;
        border: 0;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 600;
      }
      .api-modal .close-btn {
        background: #6b7280;
        color: #fff;
        border: 0;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .api-msg {
        margin-top: 8px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    ensureStyles();

    const controls = document.createElement("div");
    controls.className = "api-controls";
    controls.innerHTML = `
      <button class="api-start-btn" type="button">Start Timer</button>
      <span class="api-timer-label">Time: 0.00s</span>
      <button class="api-open-btn" type="button" title="Open form (Space)">Submit (Space)</button>
    `;

    const modalBackdrop = document.createElement("div");
    modalBackdrop.className = "api-modal-backdrop";
    modalBackdrop.innerHTML = `
      <div class="api-modal" role="dialog" aria-modal="true" aria-label="Submit API data">
        <h3>Send Game Data</h3>
        <label for="api-player">Player</label>
        <input id="api-player" type="text" placeholder="John" />
        <label for="api-timing">Timing (seconds)</label>
        <input id="api-timing" type="number" step="0.01" min="0" placeholder="42.5" />
        <label for="api-category">Category</label>
        <input id="api-category" type="text" placeholder="leetcode" />
        <div class="row">
          <button class="close-btn" type="button">Close</button>
          <button class="send-btn" type="button">Send</button>
        </div>
        <div class="api-msg" id="api-msg"></div>
      </div>
    `;

    document.body.appendChild(controls);
    document.body.appendChild(modalBackdrop);

    const startBtn = controls.querySelector(".api-start-btn");
    const timerLabel = controls.querySelector(".api-timer-label");
    const openBtn = controls.querySelector(".api-open-btn");
    const closeBtn = modalBackdrop.querySelector(".close-btn");
    const sendBtn = modalBackdrop.querySelector(".send-btn");
    const playerInput = modalBackdrop.querySelector("#api-player");
    const timingInput = modalBackdrop.querySelector("#api-timing");
    const categoryInput = modalBackdrop.querySelector("#api-category");
    const msg = modalBackdrop.querySelector("#api-msg");

    categoryInput.value = defaultCategory;

    function refreshTimerLabel() {
      timerLabel.textContent = "Time: " + formatSeconds(getElapsedSeconds()) + "s";
    }

    function openPopup() {
      timingInput.value = formatSeconds(getElapsedSeconds());
      if (!categoryInput.value.trim()) {
        categoryInput.value = defaultCategory;
      }
      msg.textContent = "";
      modalBackdrop.classList.add("is-open");
      playerInput.focus();
    }

    function closePopup() {
      modalBackdrop.classList.remove("is-open");
    }

    startBtn.addEventListener("click", function () {
      startTimestamp = Date.now();
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      timerInterval = setInterval(refreshTimerLabel, 100);
      refreshTimerLabel();
      startBtn.textContent = "Restart Timer";
    });

    openBtn.addEventListener("click", openPopup);
    closeBtn.addEventListener("click", closePopup);
    modalBackdrop.addEventListener("click", function (event) {
      if (event.target === modalBackdrop) {
        closePopup();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.code === "Space" && !modalBackdrop.classList.contains("is-open")) {
        const target = event.target;
        const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
        if (!isTyping) {
          event.preventDefault();
          openPopup();
        }
      }
    });

    sendBtn.addEventListener("click", async function () {
      const payload = {
        player: playerInput.value.trim(),
        timing: Number(timingInput.value),
        category: categoryInput.value.trim(),
      };

      if (!payload.player) {
        msg.textContent = "Player is required.";
        return;
      }
      if (!Number.isFinite(payload.timing)) {
        msg.textContent = "Timing must be a number.";
        return;
      }
      if (!payload.category) {
        msg.textContent = "Category is required.";
        return;
      }

      msg.textContent = "Sending...";
      sendBtn.disabled = true;

      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }
        msg.textContent = "Sent successfully.";
      } catch (error) {
        msg.textContent = "Send failed: " + (error.message || "Unknown error");
      } finally {
        sendBtn.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
