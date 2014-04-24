window.interludeLocalStorage = (function() {
    
    function getKey(name){
    	var result = "";
    	var nameKey = name+"=";
    	var allCookies = document.cookie.split(';');
    	for(var index = 0; index < allCookies.length; index++)
    	{
    		var trimmed = allCookies[index].trim();
    		if(trimmed.indexOf(nameKey) == 0)
    		{
    			result = trimmed.substring(nameKey.length, trimmed.length);
    			break;
    		}
    	}
    	return result;
    }

    function setKey(name, value){
    	var date = new Date();
    	date.setTime(date.getTime()+(1*24*60*60*1000));
    	document.cookie = name+"="+value+";expires="+date.toGMTString();
    }

    function keyExists(name){
    	return getKey(name) != "";
    }

    function getOrSetKey(name, defaultValue){
    	var value = getKey(name);
    	//cookies doesn't exist.
    	if(value == "")
    	{
            value = defaultValue;
            setKey(name, value);
    	}
    	return value;
    }

    function removeKey(name){
        var date = new Date();
        //setting expire date for yesterday.
    	date.setTime(date.getTime()-(1*24*60*60*1000));
    	document.cookie = name+"=;expires="+date.toGMTString();	
    }

	return {get: getKey, set: setKey, exists: keyExists, remove: removeKey, getOrSet: getOrSetKey}
}());
