// Функція для завантаження JSON-файлу з перекладами
function loadJSON(fileName, callback) {
    fetch(fileName)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Помилка завантаження JSON-файлу:', error));
}

// Функція для завантаження перекладів
function loadLocales(language) {
    const localesFile = `locales/${language}/messages.json`;
    const translationsFile = `translations/${language}/messages.json`;

    loadJSON(localesFile, (localesData) => {
        loadJSON(translationsFile, (translationsData) => {
            document.getElementById('appName').textContent = localesData.appName.message;
            document.getElementById('legend-select-document').textContent = translationsData.legendSelectDocument;
            document.getElementById('upload-pdf-button').textContent = translationsData.uploadPDF;
            document.getElementById('drop-zone').textContent = translationsData.dropZone;
            document.getElementById('select-signature-type').textContent = translationsData.selectSignatureType;
            document.getElementById('using-mouse-cursor').textContent = translationsData.usingMouseCursor;
            document.getElementById('color-mouse').textContent = translationsData.textColors;
            document.getElementById('mouse-signature-field').textContent = translationsData.mouseSignatureField;
            document.getElementById('clear-mouse-signature-field').textContent = translationsData.clearButton;
            document.getElementById('add-mouse-signature').textContent = translationsData.addMouseSignature;
            document.getElementById('label-image-overlay').textContent = translationsData.labelImageOverlay;
            document.getElementById('image-upload').textContent = translationsData.imageUpload;
            document.getElementById('overlaying-entered-text').textContent = translationsData.overlayingEnteredText;
            document.getElementById('text-overlay').placeholder = translationsData.textOverlay;
            document.getElementById('font').textContent = translationsData.font;
            document.getElementById('color').textContent = translationsData.textColors;
            document.getElementById('process-text-button').textContent = translationsData.processTextButton;
            document.getElementById('clear-button').textContent = translationsData.clearButton;
            document.getElementById('save-button').textContent = translationsData.saveButton;

            document.getElementById('requestFeatureLink').textContent = translationsData.requestFeature;
            document.getElementById('requestFeatureLink').href = translationsData.requestURL;

            document.getElementById('aboutURL').href = translationsData.aboutURL;
            document.getElementById('rateUsButton').textContent = translationsData.rateUs;
            document.getElementById('modalRateUsTitle').textContent = translationsData.rateUs;
            document.getElementById('modalRateUsText').textContent = translationsData.rateUsText;

            rate123URL = translationsData.rate123URL;
            rate45URL = translationsData.rate45URL;
        });
    });
}

// Функція для завантаження доступних мов
function loadLanguages() {
    loadJSON('/translations/full_languages.json', (data) => {
        const languages = Object.entries(data).map(([code, label]) => ({ code, label }));

        const defaultLanguage = localStorage.getItem("language") || "en";
        const selectedLanguageElement = document.getElementById("selectedLanguage");
        selectedLanguageElement.textContent = languages.find(lang => lang.code === defaultLanguage)?.label || "English";

        if (!localStorage.getItem("language")) {
            localStorage.setItem("language", defaultLanguage);
        }

        const dropdownList = document.getElementById("dropdownList");
        dropdownList.innerHTML = languages.map(lang => `
            <div class="dropdown-item" data-code="${lang.code}">${lang.label}</div>
        `).join("");

        document.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                const selectedCode = e.target.dataset.code;
                localStorage.setItem("language", selectedCode);
                selectedLanguageElement.textContent = e.target.textContent;
                loadLocales(selectedCode);
                dropdownList.style.display = "none";
            });
        });
    });
}

// Завантаження мови при відкритті сторінки
document.addEventListener("DOMContentLoaded", function() {
    const defaultLanguage = localStorage.getItem("language") || "en";
    loadLocales(defaultLanguage);
    loadLanguages();
});

// Відкривання/закривання випадаючого списку
document.getElementById("languageDropdown").addEventListener("click", () => {
    const dropdownList = document.getElementById("dropdownList");
    dropdownList.style.display = dropdownList.style.display === "block" ? "none" : "block";
});
