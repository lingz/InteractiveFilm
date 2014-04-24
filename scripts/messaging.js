window.interludeMessaging = (function() {
	
	// Exceptions
	function _badParamsException(message) {
	   this.message = message;
	   this.name = "BadParamsException";
	}
	function _networkException(message) {
	   this.message = message;
	   this.name = "NetworkException";
	}
	
	// Settings
	var defaults = {
		engine: 'pusher',
		projectName: undefined,
		sessionId: undefined,
		keyURL: 'http://api.interlude.fm/broadcast/v1/projectkeys',
		sendURL: 'http://api.interlude.fm/broadcast/v1/broadcast',
		
		listeners: {
			scope: this,
			onInit: function() {
			}
		}
	};
	var settings = {};
	
	// Pusher objects
	var connection = null;
	var channel = null;
	
	
	// Private functions 
	function _hasSettings(requiredFields) {
		$.each(requiredFields, function(index, field) {
			if (!(field in settings)) {
				return false;
			}
		});
		return true;
	}
	
	function _connect() {
		if (connection) {
			return true;
		}

		// connect to pusher		
		connection = new Pusher(settings.projectKey);
		channel = connection.subscribe(settings.sessionId);
		if (channel) {
			if ($.isFunction(settings.listeners.onInit)) {
				settings.listeners.onInit.call(
					settings.listeners.scope, 
					{
						projectName: settings.projectName,
						sessionId: settings.sessionId
					}
				);
			}
		}

		// throw some exceptions when things go bad
		connection.bind('unavailable', function() {
			throw new _networkException('failed connecting to pusher, probably an internet connection issue');
		});
		connection.bind('failed', function() {
			throw new _networkException('failed connecting to pusher, device is not supported');
		});  
		
		return true;         
	}
	
	
	function _disconnect() {
		if (connection) {
			connection.unsubscribe(channel);
			connection.disconnect();
			connection = null;
			channel = null;
		}
	}
	
	
	function _on(event, listener, scope) {
		if (!$.isFunction(listener)) {
			throw new _badParamsException('listener must be a function');
		}
		
		if (!connection || !channel) {
			throw new _badParamsException('connection must be established before registration of listeners');
		}

		console.log('interludemessaging.on: '+event);
		channel.bind(event, function(data) {
			var parsedMessage =  jQuery.parseJSON(data.message);       
			var obj = { sessionId: data.sessionId, message: parsedMessage };                                

			listener.call(scope, obj);
		});
	}


	function _init(options) {
		// merge given options and the defaults into the settings object
		$.extend(settings, defaults, options);
		
		if (!_hasSettings(['engine', 'projectName', 'sessionId'])) {
			throw new _badParamsException('engine, projectName and sessionId must be provided');
		}
		
		if (settings.engine !== 'pusher') {
			throw new _badParamsException('pusher is the only engine supported');
		}
		
		// fetch the pusher key from the API and use is to connect
		$.ajax({    
			type: "GET",
			url: settings.keyURL,
			data: { projectName: settings.projectName},
			dataType: "text",
			success: function(response) {
				var res = jQuery.parseJSON(response);                
				settings.projectKey = res.key;
				_connect();
			},
			error: function(xhr, ajaxOptions, thrownError) { 
				throw new _networkException('failed fetching pusher key');
			}
		});
	}
	
	function _send(eventName, data) {
		console.log('interludemessaging.send: '+eventName, data);
		var post_data = {
			project_name: settings.projectName,
			event_type: settings.sessionId,
			event_name: eventName,
			session_id: settings.sessionId,
			data: JSON.stringify(data)
		};

		return $.ajax({    
			type: "POST",
			url: settings.sendURL,
			data: post_data,
			dataType: "text",
			processdata : false
		});
	}       

    return {
    	init: _init,
    	connect: _connect,
    	disconnect: _disconnect,
    	send: _send, 
    	on: _on,
    	
    	exception: {
        	BadParams: _badParamsException,
        	NetworkException: _networkException
        }
    };                     
}());
