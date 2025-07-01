import store from '../modules/store.js';

export function init(element) {
    let lastNoticeId = null;

    store.subscribe(() => {
        const { notice } = store.getState();
        if (notice && notice.id !== lastNoticeId) {
            lastNoticeId = notice.id;
            const noticeEl = document.createElement('div');
            noticeEl.className = 'notice';
            noticeEl.textContent = notice.message;
            element.appendChild(noticeEl);

            setTimeout(() => {
                element.removeChild(noticeEl);
            }, 3000); // The notice will disappear after 3 seconds (matching CSS animation)
        }
    });
}
