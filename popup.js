// popup.js
const display = document.getElementById("timerDisplay");
const minutesInput = document.getElementById("minutesInput");
const messageInput = document.getElementById("messageInput");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

// --- 【修改点1】初始化：仅在打开插件时加载一次数据 ---
chrome.storage.local.get(
  ["endTime", "isRunning", "customMessage", "customMinutes"],
  (data) => {
    if (data.customMessage) {
      messageInput.value = data.customMessage;
    }
    if (data.customMinutes) {
      minutesInput.value = data.customMinutes;
    }
    // 初次打开时刷新一次UI
    refreshDisplay();
  },
);

// --- 【修改点2】实时保存：用户输入时立即存入 storage，不再等点击开始 ---
messageInput.addEventListener("input", () => {
  chrome.storage.local.set({ customMessage: messageInput.value });
});

minutesInput.addEventListener("input", () => {
  chrome.storage.local.set({ customMinutes: minutesInput.value });
});

// --- 【修改点3】精简 updateUI：只处理倒计时显示和按钮状态 ---
function refreshDisplay() {
  chrome.storage.local.get(["endTime", "isRunning"], (data) => {
    if (data.isRunning) {
      const remaining = Math.round((data.endTime - Date.now()) / 1000);
      if (remaining > 0) {
        updateDisplay(remaining);
        // 运行中，禁用输入和开始按钮
        startBtn.disabled = true;
        minutesInput.disabled = true;
        messageInput.disabled = true;
      } else {
        stopUI();
      }
    } else {
      stopUI();
    }
  });
}

function stopUI() {
  startBtn.disabled = false;
  minutesInput.disabled = false;
  messageInput.disabled = false;
  // 停止状态下，显示输入框设置的时间
  const mins = parseInt(minutesInput.value) || 40;
  updateDisplay(mins * 60);
}

function updateDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  display.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// 每 500ms 刷新一次显示即可（比1000ms更平滑）
setInterval(refreshDisplay, 500);
// 定义默认消息常量，方便多处使用
const DEFAULT_MESSAGE = "主人，该站起来活动活动了！";

// --- 按钮逻辑 ---

startBtn.addEventListener("click", () => {
  const mins = parseInt(minutesInput.value) || 40;
  const seconds = mins * 60;
  const msg = messageInput.value.trim() || "主人，该站起来活动活动了！";

  // 确保开始时保存最新的设置
  chrome.storage.local.set(
    {
      customMessage: msg,
      customMinutes: mins,
    },
    () => {
      chrome.runtime.sendMessage({ type: "START", time: seconds });
    },
  );
});

pauseBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "PAUSE" });
});

// 【重点修改部分】重置按钮
resetBtn.addEventListener("click", () => {
  // 1. 将输入框文字恢复为默认值
  messageInput.value = DEFAULT_MESSAGE;

  // 2. 将本地存储中的消息也同步重置
  chrome.storage.local.set({ customMessage: DEFAULT_MESSAGE }, () => {
    const mins = parseInt(minutesInput.value) || 40;

    // 3. 通知后台停止计时并重置状态
    chrome.runtime.sendMessage({ type: "RESET", time: mins * 60 });

    // 4. 立即刷新倒计时显示
    updateDisplay(mins * 60);
  });
});
