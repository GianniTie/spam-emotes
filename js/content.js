const getButtons = (name = null) => document.querySelectorAll(name ? `button[data-emoji=${name}]` : 'button[data-emoji]');
const getMoodButton = () => [...document.querySelectorAll('i')].find(el => el.textContent === 'mood');

chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
    if (response.action === 'get_buttons') {
        const buttons = [...getButtons()].map(b => b.getAttribute('data-emoji'));
        sendResponse({ data: buttons });
        return;
    }
    if (response.action === 'click_button') {
        const button = getButtons(response.emote);
        if (button.length) button[0].click();
        sendResponse({ done: true });
        return;
    }
    if (response.action === 'click_mood') {
        const mood = getMoodButton();
        if (mood) { mood.click(); }
        sendResponse({ done: !!mood })
        return;
    }
});