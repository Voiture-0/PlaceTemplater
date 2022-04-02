const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
const img = document.getElementById('img');
img.crossOrigin = 'anonymous';

const imageSourceForm = document.getElementById('image-source-form');
const urlInput = document.getElementById('url');
const fileInput = document.getElementById('file');
const templateForm = document.getElementById('template-form');
const xInput = document.getElementById('x');
const yInput = document.getElementById('y');
const scaleInput = document.getElementById('scale');

const imageSourceCollapse = new bootstrap.Collapse(document.getElementById('image-source-accordian-body'), { toggle: true });
const templateSettingsCollapse = new bootstrap.Collapse(document.getElementById('template-settings-accordian-body'), { toggle: false });
const templateOutputCollapse = new bootstrap.Collapse(document.getElementById('template-output-accordian-body'), { toggle: false });


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

loadTestDefaults();


function loadTestDefaults() {
    img.src = 'https://i.imgur.com/fEs3kr1.png';
    urlInput.value = img.src;
    img.onerror = err => {
        console.error('loadTestDefaults error', err);
        alert('URL didn\'t work lol. Try uploading to imgur instead.');
    };

    // Skip normal loading process for default testing
    const oldOnload = img.onload;
    img.onload = () => img.onload = oldOnload;
        
}


function loadImageFromFile() {
    img.onerror = err => {
        console.error('loadImageFromFile error', err);
        alert('Whoopies something went wrong lol ¯\\_(ツ)_/¯ or maybe you screwed up.  If you didn\'t, then open an issue on github pl0x');
    };
    const fileUrl = URL.createObjectURL(this.files[0]);
    // img.onload = imageLoad;
    img.removeAttribute('height');
    img.src = fileUrl;
}

function loadImageFromUrl() {
    img.onerror = err => {
        console.error('loadImageFromUrl error', err);
        alert('URL didn\'t work lol. Try uploading to imgur instead.');
    };
    // img.onload = imageLoad;
    img.removeAttribute('height');
    img.src = urlInput.value;
}

function imageLoad() {

    const width = img.width;
    const height = img.height;
    let warning = false;
    if (width * height > 200 * 200) {
        alert('Be careful using large images! Generating a template for this larger image might crash your tab, or just lag for a bit.');
        warning = true;
    }
    
    templateSettingsCollapse.show();
    templateOutputCollapse.hide();
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
        ctx.fillRect(scale * line++, 0, 1, cnvHeight);
    }
    line = 0;
    while (line < maxLineY) {
        ctx.fillRect(0, scale * line++, cnvWidth, 1);
    }
    
    // Draw coordinates
    const offsetX = Number.parseInt(xInput.value);
    const offsetY = Number.parseInt(yInput.value);
    ctx.lineWidth = 2;
    const lineHeight = Math.floor(scale * 0.4);
    ctx.font = `${lineHeight}px monospace`;
    ctx.direction = 'rtl';
    const padding = Math.floor(scale * 0.12);
    const dblPadding = 2 * padding;
    for (let x = 0; x < img.width; x++) {
        const tx = x * scale;
        for(let y = 0; y < img.height; y++) {
            const ty = y * scale;
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
                ctx.strokeText(x + offsetX, tx + scale - padding, ty + scale - padding - lineHeight, scale - dblPadding);
                ctx.strokeText(y + offsetY, tx + scale - padding, ty + scale - padding, scale - dblPadding);
                ctx.fillText(x + offsetX, tx + scale - padding, ty + scale - padding - lineHeight, scale - dblPadding);
                ctx.fillText(y + offsetY, tx + scale - padding, ty + scale - padding, scale - dblPadding);
            }
        }
    }

    templateOutputCollapse.show();
}