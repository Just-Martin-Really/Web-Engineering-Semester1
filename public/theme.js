/*
 * Theme handling for Kursforum.
 * The initial block runs synchronously in <head> to set the colour mode before
 * first paint (avoids a flash of the wrong theme). The rest wires up the toggle
 * button once the DOM is ready.
 */
(function () {
    const STORAGE_KEY = 'theme';

    function preferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }

    // Run immediately to avoid a flash of the wrong theme.
    applyTheme(preferredTheme());

    document.addEventListener('DOMContentLoaded', function () {
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const current = document.documentElement.getAttribute('data-bs-theme') === 'dark'
                    ? 'dark'
                    : 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                localStorage.setItem(STORAGE_KEY, next);
                applyTheme(next);
            });
        });
    });
})();
