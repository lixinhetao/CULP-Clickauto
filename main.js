// ==UserScript==
// @name         智慧法治平台-自动点赞脚本
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  自动点赞 -> 新标签页打开上一篇 -> 自动关闭当前旧标签页
// @author       GYY (Optimized)
// @match        *://*.lawplatform.chinaunicom.cn/*
// @grant        window.close
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        READ_DELAY: 3500,     // 进入页面后的基础停留时间（毫秒）
        RANDOM_DELAY: 1500,   // 随机增加的延迟上限（毫秒）
        STEP_DELAY: 1500,     // 点赞后、打开新标签页后的缓冲时间（毫秒）
        WAIT_TIMEOUT: 10000   // 等待元素加载的最大超时时间（毫秒）
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getRandomDelay = () => CONFIG.READ_DELAY + Math.floor(Math.random() * CONFIG.RANDOM_DELAY);

    function safeClick(element) {
        if (!element) return false;
        if (typeof element.click === 'function') {
            element.click();
            return true;
        }
        element.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
        return true;
    }

    async function waitForElement(selector, timeout = CONFIG.WAIT_TIMEOUT) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(300);
        }
        return null;
    }

    function getPrevArticleLink() {
        const items = document.querySelectorAll('.review-content-change-item');
        for (const item of items) {
            if (item.firstChild?.textContent?.trim() === '上一篇：') {
                return item.lastElementChild || item.lastChild;
            }
        }
        return null;
    }

    async function runRelayLike() {
        console.log('🚀 [智慧法治助手] 开始处理当前文章');

        // 1. 等待点赞按钮加载（若不在详情页则直接退出，防止误关列表页）
        const likeBtn = await waitForElement('.review-content-bottom-item');
        if (!likeBtn) {
            console.log('⚠️ [智慧法治助手] 未找到点赞按钮，停止执行');
            return;
        }

        // 2. 模拟阅读停留
        await sleep(getRandomDelay());

        // 3. 判断并执行点赞
        const btnText = likeBtn.lastChild?.textContent?.trim();
        if (btnText === '点赞') {
            safeClick(likeBtn);
            console.log('👍 [智慧法治助手] 已点击点赞');
        } else {
            console.log(`⏭️ [智慧法治助手] 状态为「${btnText || '已点赞'}」，跳过点赞`);
        }

        // 等待点赞接口完成
        await sleep(CONFIG.STEP_DELAY);

        // 4. 点击“上一篇”在新标签页打开下一篇
        const prevLink = getPrevArticleLink();
        if (prevLink) {
            console.log('➡️ [智慧法治助手] 新标签页打开上一篇...');
            safeClick(prevLink);
            // 关键缓冲：确保新标签页已成功弹出并接管，再关闭当前页
            await sleep(CONFIG.STEP_DELAY);
        } else {
            console.log('🎉 [智慧法治助手] 已到达最后一篇，全部完成！');
        }

        // 5. 关闭当前已处理完的标签页
        console.log('❌ [智慧法治助手] 关闭当前页面');
        window.close();
    }

    runRelayLike();
})();
