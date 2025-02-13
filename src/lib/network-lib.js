//Vanilla J/S equivalent of jQuery's $.ajax
export function ajax(url, callback) { 
    var xhr = new XMLHttpRequest();
    xhr.open('GET', encodeURI(url));
    xhr.onload = function() {
        var data = JSON.parse(xhr.responseText);
        callback(data, xhr.status);			
    };
    xhr.send();
}

export function apiPost(url, params) { 
    var xhr = new XMLHttpRequest();
    xhr.open('POST', encodeURI(url), false); // The 'false' makes it synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');
    const paramStr = JSON.stringify(params);
    xhr.send(paramStr);
    if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);        
    } 
    else {
        return {status: false};
    }    
}