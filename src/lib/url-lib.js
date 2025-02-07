var nonVolatileHashChange = false;
var hashChangedFn;
	
export function init(onHashChanged) {
    hashChangedFn = onHashChanged;
    window.onhashchange = onHashChangedManager;
}


export function setHashNonVolatile(val) {
    if (window.location.hash.replace('#') != val) {
        nonVolatileHashChange = true;
        window.location.hash = val; //This will trigger a hash event
    }
}


export function getQueryString(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return true;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
    

function onHashChangedManager(e) {		
    //Non-volatile
    if (nonVolatileHashChange) {
        nonVolatileHashChange = false;
        e.preventDefault();
        e.stopPropagation();
        
    }
    else hashChangedFn(e); //Regularly scheduled hash event		
}