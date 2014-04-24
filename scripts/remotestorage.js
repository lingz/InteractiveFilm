window.interludeRemoteStorage = (function() {
    
    // Settings
	var defaults = {
		sessionId: undefined,
		apiURL: 'http://api.interlude.fm/broadcast/v1/sessioninfo'
	};
	var settings = {};
    
    function _put(obj) {
    	return $.ajax({    
			type: "POST",
			url: settings.apiURL,
			data: { 
				session_id: settings.sessionId, 
				info: JSON.stringify(obj) 
			},
		});
    }

    function _get() {
    	var dfd = new $.Deferred(); 
		
		$.ajax({    
			type: "GET",
			url: settings.apiURL,
			data: { 
				session_id: settings.sessionId 
			}
		}).done(function(objStr) {
			dfd.resolve(JSON.parse(objStr));
		}).fail(function() {
			dfd.resolve({});
		});
		
		return dfd.promise();    	
    }

    function _init(options) {
		// merge given options and the defaults into the settings object
		$.extend(settings, defaults, options);
    }

	return {
		get: _get, 
		put: _put, 
		init: _init
	}
}());
