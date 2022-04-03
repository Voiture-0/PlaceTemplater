import { UrlManager } from './modules/UrlManager.js';
import { ProgressManager } from './modules/ProgressManager.js';

(async function() {
    const TEST_MODE = false;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imgDim = document.getElementById('img-dimensions');
    const img = document.getElementById('img');
    const redditUrl = 'https://new.reddit.com/r/place/';

    const resetBtn = document.getElementById('reset');
    const imageSourceForm = document.getElementById('image-source-form');
    const urlInput = document.getElementById('url');
    const loadUrlBtn = document.getElementById('load');
    const fileInput = document.getElementById('file');
    const templateForm = document.getElementById('template-form');
    const xInput = document.getElementById('x');
    const yInput = document.getElementById('y');
    const scaleInput = document.getElementById('scale');

    const generateBtn = document.getElementById('btn');
    const generateProgressBar = document.getElementById('generate-progress-bar');
    const generateProgressLabel = document.getElementById('generate-progress-label');
    const templateLink = document.getElementById('template-link');
    const placeLink = document.getElementById('place-link');
    const randomPlaceLink = document.getElementById('random-place-link');
    const randomPixelColor = document.getElementById('random-pixel-color');
    const randomPixelCoords = document.getElementById('random-pixel-coords');

    const imageSourceCollapse = new bootstrap.Collapse(document.getElementById('image-source-accordian-body'), { toggle: true });
    const templateSettingsCollapse = new bootstrap.Collapse(document.getElementById('template-settings-accordian-body'), { toggle: false });
    const templateOutputCollapse = new bootstrap.Collapse(document.getElementById('template-output-accordian-body'), { toggle: false });
    const templateOutputCollapseBtn = document.getElementById('template-output-accordian-btn');

    const urlManager = new UrlManager();
    const progressManager = new ProgressManager(generateProgressBar, generateProgressLabel);

    img.crossOrigin = 'anonymous';
    img.onload = imageLoad;
    fileInput.onchange = loadImageFromFile;

    imageSourceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loadImageFromUrl();
    });
    templateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        draw();
    });

    resetBtn.addEventListener('click', function(e) {
        urlManager.resetUrl();
    });

    window.addEventListener('popstate', function (e) {
        // window.location.href = document.location.href;
        if (!progressManager.isIdle()) {
            cancelDraw = true;
        }
        loadUrlValues(true);
    });

    let cancelDraw = false;

    await loadTestDefaults();

    loadUrlValues();


    async function loadTestDefaults() {
        urlInput.value = 'https://i.imgur.com/fEs3kr1.png';
        if (TEST_MODE) {
            xInput.value = 334;
            yInput.value = 75;
            img.src = urlInput.value;
            img.onerror = err => {
                console.error('loadTestDefaults error', err);
                debugger;
            };
            // Skip normal loading process for default testing
            const oldOnload = img.onload;
            img.onload = () => img.onload = oldOnload;

            const actions = [
                () => loadUrlBtn.click(),
                () => generateBtn.click(),
            ];
            sleepBetweenActions(actions, 1000);
        }
    }

    async function loadUrlValues(fast = false) {
        if (window.location.search == null || window.location.search == '') return;

        // Show reset button
        resetBtn.classList.toggle('d-none', false);

        // Get values from url search
        const searchParams = urlManager.getUrlSearch();
        const imgUrl = searchParams.get('imgUrl');
        const x = searchParams.get('x');
        const y = searchParams.get('y');
        const scale = searchParams.get('scale');
        const skip = (searchParams.get('skip') === 'true') || fast;
        
        // load values
        const sleepTime = skip ? 0 : 300;
        const actions = [
            () => urlInput.focus(),
            () => urlInput.value = imgUrl,
            () => loadUrlBtn.focus(),
            () => loadUrlBtn.click(),
            () => sleep(500),
            () => xInput.focus(),
            () => xInput.value = x,
            () => yInput.focus(),
            () => yInput.value = y,
            () => scaleInput.focus(),
            () => scaleInput.value = scale,
            () => generateBtn.focus(),
            () => generateBtn.click(),
        ];
        
        await sleepBetweenActions(actions, sleepTime);
    }

    async function sleepBetweenActions(actions, sleepTime) {
        for(const action of actions) {
            await sleep(sleepTime);
            await action();
        }
    }


    function loadImageFromFile() {
        img.onerror = err => {
            console.warn('loadImageFromFile error', err);
            generateBtn.toggleAttribute('disabled', true);
        };
        try {
            const fileUrl = URL.createObjectURL(this.files[0]);
            img.removeAttribute('height');
            img.src = fileUrl;
        } catch(err) {
            // Probably cancelled file picker
            console.warn('Probably cancelled file picker', err);
        }
    }

    function loadImageFromUrl() {
        img.onerror = err => {
            console.error('loadImageFromUrl error', err);
            alert('URL didn\'t work lol. Try uploading to imgur and linking directly to the i.imgur.com/---.png image (not the album link) instead.');
            generateBtn.toggleAttribute('disabled', true);
        };
        img.removeAttribute('height');
        img.src = urlInput.value;
        fileInput.value = '';   // clear out file input
    }

    function imageLoad() {
        // Check image dimensions
        const width = img.width;
        const height = img.height;
        imgDim.innerText = `${width} x ${height}`;
        imgDim.title = `${width} pixels wide, ${height} pixels tall`;
        let warning = false;
        let error = false;
        if (width * height >= 500 * 500) {
            alert('Image too large! Trying to use this image will probably crash your tab. Remember this is the 1:1 scale source image and should probably be smaller than 100 X 100.');
            error = true;
        } else if (width * height >= 200 * 200) {
            alert('Be careful using large images! Generating a template for this larger image might crash your tab, or just lag for a bit.');
            warning = true;
        } else if (!width) {
            alert('No image loaded');
            error = true;
        }

        img.style.minHeight = null;

        error = error && !TEST_MODE;

        generateBtn.classList.toggle('btn-danger', (warning || error));
        generateBtn.toggleAttribute('disabled', error);
        
        if (error) return;

        progressManager.clear();

        // show next step
        templateSettingsCollapse.show();
        templateOutputCollapse.hide();
    }

    async function draw() {
        if (!img.width) {
            alert('Add an image first');
            return;
        }

        const startTime = performance.now();

        // Lock form
        toggleFormLocked(true);

        progressManager.begin(0, img.width);

        canvas.classList.add('hidden');
        
        const scale = Number.parseInt(scaleInput.value);
        const width = img.width * scale;
        const height = img.height * scale;
        const cnvWidth = width + 1
        const cnvHeight = height + 1;
        canvas.width = cnvWidth;
        canvas.height = cnvHeight;
        
        // Draw big image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, img.width, img.height, 1, 1, width, height);
        
        // draw grid lines
        ctx.fillStyle = 'grey';
        const maxLineX = img.width;
        const maxLineY = img.height;
        let line = 0;
        while (line < maxLineX) {
            ctx.fillRect(scale * line, 0, 1, cnvHeight);
            line++;
        }
        line = 0;
        while (line < maxLineY) {
            ctx.fillRect(0, scale * line, cnvWidth, 1);
            line++;
        }
        
        // Draw coordinates
        const offsetX = Number.parseInt(xInput.value);
        const offsetY = Number.parseInt(yInput.value);
        const lineHeight = Math.floor(scale * 0.4);
        ctx.font = `${lineHeight}px monospace`;
        ctx.direction = 'rtl';
        ctx.lineWidth = 2;
        const padding = Math.floor(scale * 0.12);
        const textMaxWidth = scale - (2 * padding);
        for (let x = 0; x < img.width; x++) {
            const tx = x * scale;
            for(let y = 0; y < img.height; y++) {
                const ty = y * scale;
                drawCoordinate(ctx, tx, ty, x, y, offsetX, offsetY, scale, padding, lineHeight, textMaxWidth);
            }
            progressManager.tickProgress();
            if (cancelDraw) {
                cancelDraw = false;
                toggleFormLocked(false);
                progressManager.cancel();
                return;
            }
            await nextFrame();
        }

        const endTime = performance.now();
        const duration = Math.floor(endTime - startTime);
        const minDuration = 400;
        if (duration < minDuration) {
            await sleep(minDuration - duration);
        }

        templateOutputCollapseBtn.disabled = false;
        templateOutputCollapse.show();
        
        if (img.src.startsWith('blob:')) {
            urlManager.clearUrlSearch();
            templateLink.href = '';
            templateLink.classList.toggle('d-none', true);
        } else {
            const searchParams = getInputsObject();
            const url = urlManager.createUrlSearch(searchParams);
            // console.log(url.search === window.location.search, `${url.search} === ${window.location.search}`);
            if (url.search !== window.location.search) {
                urlManager.setNewUrl(url);
            }
            templateLink.href = url;
            templateLink.classList.toggle('d-none', false);
        }

        // Get centered coordinates
        const cx = Math.round(offsetX + img.width/2);
        const cy = Math.round(offsetY + img.height/2);
        placeLink.href = `${redditUrl}?px=32&cx=${cx}&cy=${cy}`;
        placeLink.innerText = `${redditUrl}?px=32&cx=${cx}&cy=${cy}`;
        // Get random coordinates inside template
        const rx = randomNumber(offsetX, offsetX + img.width - 1);
        const ry = randomNumber(offsetY, offsetY + img.height - 1);
        randomPlaceLink.href = `${redditUrl}?px=10&cx=${rx}&cy=${ry}`;
        randomPlaceLink.title = `(${rx}, ${ry})`;
        randomPixelCoords.innerText = `(${rx}, ${ry})`;
        const randomPixel = ctx.getImageData(((rx - offsetX) * scale) + 1, ((ry - offsetY) * scale) + 1, 1, 1);
        randomPixelColor.style.backgroundColor = `rgba(${randomPixel.data[0]}, ${randomPixel.data[1]}, ${randomPixel.data[2]}, ${randomPixel.data[3]})`;

        canvas.classList.remove('hidden');

        await sleep(300);
        templateOutputCollapseBtn.scrollIntoView();
        toggleFormLocked(false);
        progressManager.complete();
    }
    
    function drawCoordinate(ctx, tx, ty, x, y, offsetX, offsetY, scale, padding, lineHeight, textMaxWidth) {
        const pixel = ctx.getImageData(tx + 1, ty + 1, 1, 1); // add 1 to avoid grid lines
        const isTransparent = (pixel.data[3] === 0);
        const isLight = (pixel.data[0] + pixel.data[1] + pixel.data[2] > 600);
        if (isLight) {
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'white';
        } else {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
        }
        if (!isTransparent) {
            const textX = x + offsetX;
            const textY = y + offsetY;
            const textPosX = tx + scale - padding;
            const textPosY = ty + scale - padding;
            ctx.strokeText(textX, textPosX, textPosY - lineHeight, textMaxWidth);
            ctx.strokeText(textY, textPosX, textPosY, textMaxWidth);
            ctx.fillText(textX, textPosX, textPosY - lineHeight, textMaxWidth);
            ctx.fillText(textY, textPosX, textPosY, textMaxWidth);
        }
    }

    function getInputsObject() {
        const imgUrl = urlInput.value;
        const x = xInput.value;
        const y = yInput.value;
        const scale = scaleInput.value;
        return {
            imgUrl,
            x,
            y,
            scale,
            skip: true,
        };
    }

    function toggleFormLocked(locked) {
        urlInput.disabled = locked;
        loadUrlBtn.disabled = locked;
        fileInput.disabled = locked;
        xInput.disabled = locked;
        yInput.disabled = locked;
        scaleInput.disabled = locked;
        generateBtn.disabled = locked;
    }

    function randomNumber(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    
    function nextFrame() { return new Promise(requestAnimationFrame); }

})();

