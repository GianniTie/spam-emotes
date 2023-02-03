const URL = 'https://meet.google.com/'
var buttons, tab, mood;
let breakProcess = false;

let menuState = { emojis: [], iterations: 100, sleepTime: 250 }

// DOM Elements
const errorSection = document.querySelector('#errorSection');
const exitButton = document.querySelector('#exitButton');
const form = document.querySelector('#formEmotes');
const iterations = document.querySelector('input[name=qClicks]');
const iterationsOutput = document.querySelector('#qClicks');
const loadingSection = document.querySelector('#loadingSection');
const queryOptions = { active: true, currentWindow: true };
const rowEmotes = document.querySelector('#rowEmotes');
const sleepTime = document.querySelector('input[name=time]');
const sleepTimeOutput = document.querySelector('#time');
const stopButton = document.querySelector('#stopButton');
const submitButton = document.querySelector('#submitButton');

// Listeners
iterations.addEventListener('input', (e) => {
    iterationsOutput.innerHTML = e.target.value;
    menuState = { ...menuState, iterations: e.target.value }
    saveData(menuState);
});

sleepTime.addEventListener('input', (e) => {
    sleepTimeOutput.innerHTML = e.target.value;
    menuState = { ...menuState, sleepTime: e.target.value }
    saveData(menuState);
});

stopButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    hideLoading({ form, loadingSection, stopButton, submitButton });
    breakProcess = true;
})

exitButton.addEventListener('click', (e) => {
    e.stopPropagation();
    window.close();
})

// Functions
const sleep = (sleepTime = 250, f = null, args = []) => new Promise(resolve => {
    if (f) f(...args);
    setTimeout(() => resolve(), sleepTime);
})

const getEmotesSelected = () => {
    const emojis = document.querySelectorAll('input[name="emotes[]"]');
    return [...emojis].filter(e => e.checked).map(e => e.value);
}

const setEmotesSelected = (emotes) => {
    const emojis = document.querySelectorAll('input[name="emotes[]"]');
    emojis.forEach(e => { e.checked = emotes.includes(e.value); console.log({ val: emotes.includes(e.value) }) });
}

const hideElements = (elements) => {
    elements.forEach(e => e.classList.add('d-none'))
}

const showElements = (elements) => {
    elements.forEach(e => e.classList.remove('d-none'))
}

const showLoading = ({ form, loadingSection, stopButton, submitButton }) => {
    hideElements([form, submitButton]);
    showElements([loadingSection, stopButton]);
}

const hideLoading = ({ form, loadingSection, stopButton, submitButton }) => {
    hideElements([loadingSection, stopButton]);
    showElements([form, submitButton]);
}

const showErrorSection = ({ submitButton, form, errorSection }) => {
    hideElements([submitButton, form]);
    showElements([errorSection]);
}

const removeUndefined = (obj) => {
    for (let k in obj) if (obj[k] === undefined) delete obj[k];
    return obj;
}

const saveData = (data) => {
    chrome.storage.sync.set(data, function () {
        console.log('Settings saved');
    });
}

const loadData = () => {
    chrome.storage.sync.get(['emojis', 'iterations', 'sleepTime'], function (items) {
        menuState = { ...removeUndefined(items) };
        iterations.value = menuState.iterations;
        iterations.dispatchEvent(new Event('input'));

        sleepTime.value = menuState.sleepTime;
        sleepTime.dispatchEvent(new Event('input'));

        setEmotesSelected(menuState.emojis);
    });
}

// Add emotes to the row of emotes in the DOM.
const addEmotes = (rowEmotes, emotes) => {
    return emotes.forEach(e => {
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.name = 'emotes[]';
        input.type = 'checkbox';
        input.value = e;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.innerHTML = e;

        const formCheck = document.createElement('div');
        formCheck.className = 'form-check';
        formCheck.appendChild(input);
        formCheck.appendChild(label);

        const col = document.createElement('div');
        col.className = 'col-4 d-flex justify-content-center';
        col.appendChild(formCheck);

        rowEmotes.appendChild(col);
    });
}

const clickMoodButton = (tab) => {
    chrome.tabs.sendMessage(
        tab[0].id,
        { action: 'click_mood' },
        ({ done }) => !!done
    );
}

const clickEmoteButton = (emote) => {
    chrome.tabs.sendMessage(
        tab[0].id,
        { action: 'click_button', emote },
        ({ done }) => console.log(done)
    );
}

const getEmoteButtons = async (tab) => new Promise((resolve) => {
    chrome.tabs.sendMessage(
        tab[0].id,
        { action: 'get_buttons' },
        ({ data }) => { resolve(data); }
    );
})

// main function
async function init() {
    tab = await chrome.tabs.query(queryOptions);
    if (!tab[0].url.includes(URL)) {
        showErrorSection({ submitButton, form, errorSection });
        return;
    }

    buttons = await getEmoteButtons(tab);
    while (!buttons?.length) {
        await sleep(250, clickMoodButton, [tab]);
        buttons = await getEmoteButtons();
    };

    addEmotes(rowEmotes, buttons);
    loadData();
    document.querySelectorAll('input[name="emotes[]"]').forEach(emote => {
        emote.addEventListener('change', (_) => {
            menuState = { ...menuState, emojis: getEmotesSelected() }
            saveData(menuState);
        })
    })

    submitButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        const emojisSelected = getEmotesSelected();
        breakProcess = false;
        showLoading({ form, loadingSection, stopButton, submitButton });
        await spam(emojisSelected.length ? emojisSelected : buttons, iterations.value, sleepTime.value);
    })

    async function spam(buttons, iterations = 100, sleepTime = 250) {
        if (!buttons.length) return;

        const click = async () => {
            const emote = buttons[Math.floor(Math.random() * buttons.length)];
            await sleep(sleepTime, clickEmoteButton, [emote]);
        }

        for (let i = 0; i < iterations; i++) {
            if (breakProcess) break;
            await click()
        };
        hideLoading({ form, loadingSection, stopButton, submitButton });
    }
}

init();

