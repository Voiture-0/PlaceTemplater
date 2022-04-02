(async function() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d');
    const imgDim = document.getElementById('img-dimensions');
    const img = document.getElementById('img');
    img.crossOrigin = 'anonymous';

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
    const templateLink = document.getElementById('template-link')

    const imageSourceCollapse = new bootstrap.Collapse(document.getElementById('image-source-accordian-body'), { toggle: true });
    const templateSettingsCollapse = new bootstrap.Collapse(document.getElementById('template-settings-accordian-body'), { toggle: false });
    const templateOutputCollapse = new bootstrap.Collapse(document.getElementById('template-output-accordian-body'), { toggle: false });
    const templateOutputCollapseBtn = document.getElementById('template-output-accordian-btn');


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
        const url = new URL(window.location);
        url.search = '';
        window.history.pushState({}, document.title, url);
        window.location.href = window.location.href;
    });

    loadTestDefaults();

    loadUrlValues();


    function loadTestDefaults(testing = false) {
        urlInput.value = 'https://i.imgur.com/fEs3kr1.png';
        if (testing) {
            xInput.value = 334;
            yInput.value = 75;
            // img.src = urlInput.value;
            // img.onerror = err => {
            //     console.error('loadTestDefaults error', err);
            //     // alert('URL didn\'t work lol. Try uploading to imgur instead.');
            // };
            // // Skip normal loading process for default testing
            // const oldOnload = img.onload;
            // img.onload = () => img.onload = oldOnload;

            setTimeout(() => {
                loadUrlBtn.click();
                setTimeout(() => {
                    generateBtn.click();
                }, 1000);
            }, 1000);
        }
    }

    async function loadUrlValues() {
        if (window.location.search == null || window.location.search == '') return;

        // Show reset button
        resetBtn.classList.toggle('d-none', false);

        // Get values from url search
        const searchParams = new URLSearchParams(window.location.search);
        const imgUrl = searchParams.get('imgUrl');
        const x = searchParams.get('x');
        const y = searchParams.get('y');
        const scale = searchParams.get('scale');
        const skip = (searchParams.get('skip') === 'true');
        
        // load values
        const sleepTime = skip ? 0 : 300;
        const actions = [
            () => urlInput.focus(),
            () => urlInput.value = imgUrl,
            () => loadUrlBtn.focus(),
            () => loadUrlBtn.click(),
            () => sleep(sleepTime),
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
            console.error('loadImageFromFile error', err);
            alert('Whoopies something went wrong lol, or maybe you screwed up.  If you didn\'t, then open an issue on github pl0x');
        };
        try {
            const fileUrl = URL.createObjectURL(this.files[0]);
            img.removeAttribute('height');
            img.src = fileUrl;
        } catch(err) {
            // Probably cancelled file picker
            console.warn(err);
        }
    }

    function loadImageFromUrl() {
        img.onerror = err => {
            console.error('loadImageFromUrl error', err);
            alert('URL didn\'t work lol. Try uploading to imgur and linking directly to the i.imgur.com/---.png image (not the album link) instead.');
        };
        img.removeAttribute('height');
        img.src = urlInput.value;
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
        }

        img.style.minHeight = null;

        generateBtn.classList.toggle('btn-danger', (warning || error));
        generateBtn.toggleAttribute('disabled', error)
        
        if (error) return;

        // show next step
        setTimeout(() => {
            templateSettingsCollapse.show();
            templateOutputCollapse.hide();
        }, 300);
        
    }

    function draw() {
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
        }

        templateOutputCollapseBtn.disabled = false;
        templateOutputCollapse.show();
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, document.title, url);
        if (img.src.startsWith('blob:')) {
            templateLink.href = '';
            templateLink.classList.toggle('d-none', true);
        } else {
            const url = createUrl(true);
            // window.history.pushState({}, document.title, url);
            templateLink.href = url;
            templateLink.classList.toggle('d-none', false);
        }
        setTimeout(() => templateOutputCollapseBtn.scrollIntoView(), 300);

    }
    
    function drawCoordinate(ctx, tx, ty, x, y, offsetX, offsetY, scale, padding, lineHeight, textMaxWidth) {
        const pixel = ctx.getImageData(tx + 1, ty + 1, 1, 1); // add 1 to avoid grid lines
        const isTransparent = (pixel.data[3] === 0);
        const isLight = (pixel.data[0] + pixel.data[1] + pixel.data[2] > 640);
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

    function createUrl() {
        const imgUrl = urlInput.value;
        const x = xInput.value;
        const y = yInput.value;
        const scale = scaleInput.value;
        const url = new URL(window.location);
        url.searchParams.set('imgUrl', imgUrl);
        url.searchParams.set('x', x);
        url.searchParams.set('y', y);
        url.searchParams.set('scale', scale);
        return url;
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

})();

