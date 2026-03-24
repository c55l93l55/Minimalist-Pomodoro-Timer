chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoroAlarm") {
    // 【修改】先从存储中获取自定义消息，再弹出通知
    chrome.storage.local.get(["customMessage"], (data) => {
      const msg = data.customMessage || "主人，该站起来活动活动了！";
      showNotification(msg);
    });

    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.set({ isRunning: false });
  }
});

// 【修改】接收消息参数
function showNotification(messageText) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "番茄钟结束",
    message: messageText, // 使用用户定义的文字
    priority: 2,
    requireInteraction: true,
  });
}

// 消息监听逻辑保持不变 (START/PAUSE/RESET)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START") {
    const delayInMinutes = message.time / 60;
    chrome.alarms.create("pomodoroAlarm", { delayInMinutes });
    const endTime = Date.now() + message.time * 1000;
    chrome.storage.local.set({ endTime, isRunning: true });
  } else if (message.type === "PAUSE" || message.type === "RESET") {
    chrome.alarms.clear("pomodoroAlarm");
    chrome.storage.local.set({ isRunning: false });
    chrome.action.setBadgeText({ text: "" });
  }
});
