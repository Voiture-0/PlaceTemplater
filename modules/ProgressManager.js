export { ProgressManager };

class ProgressManager {
    constructor(progressBar, progressLabel) {
        this.bar = progressBar;
        this.label = progressLabel;
        this.tick = 0;
        this.maxTick = 1;
        this.progress = this.getProgress();
        this.idle = true;
    }

    begin(tick, maxTick) {
        if (!this.idle) {
            console.error('Progress is in progress');
            return;
        }
        this.idle = false;
        this.tick = tick;
        this.maxTick = maxTick;
        this.progress = this.getProgress();
        this.setProgress(this.progress);
        this.startAnimating();
    }
    tickProgress(amount = 1) {
        this.tick += amount;
        this.progress = this.getProgress();
        this.setProgress(this.progress);
    }
    setProgress(progress) {
        const percent = progress * 100;
        this.bar.style.width = percent + '%';
        this.label.innerText = Math.floor(percent) + '%';
    }
    getProgress() {
        return this.tick/this.maxTick;
    }
    cancel() {
        this.idle = true;
        this.label.innerText = 'Cancelled';
        this.stopAnimating();
    }
    complete() {
        this.idle = true;
        this.label.innerText = 'Completed';
        this.stopAnimating();
    }
    startAnimating() {
        this.bar.classList.add('progress-bar-animated');
    }
    stopAnimating() {
        if (this.idle) {
            this.bar.classList.remove('progress-bar-animated');
        }
    }
    clear() {
        this.idle = true;
        this.bar.style.width = '0%';
        this.label.innerText = '';
    }
    isIdle() {
        return (this.idle === true);
    }
}