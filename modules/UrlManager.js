export { UrlManager };

class UrlManager {
    constructor() {
        
    }
    clearUrlSearch() {
        const url = new URL(window.location);
        url.search = '';
        this.setNewUrl(url);
    }
    resetUrl() {
        this.clearUrlSearch();
        window.location.href = window.location.href;
    }
    createUrlSearch(search) {
        const url = new URL(window.location);
        for(let prop in search) {
            url.searchParams.set(prop, search[prop]);
        }
        return url;
    }
    replaceUrl(url) {
        window.history.replaceState({}, document.title, url);
    }
    setNewUrl(url) {
        window.history.pushState({}, document.title, url);
    }
    getUrlSearch() {
        return new URLSearchParams(window.location.search);
    }
}