window.interlude = (function (messagingApi, localStorageApi, remoteStorageApi) {

	var VERSION='0.1.0.1';

	// Exceptions
	function _badParamsException(message) {
	   this.message = message;
	   this.name = "BadParamsException";
	}
	function _networkException(message) {
	   this.message = message;
	   this.name = "NetworkException";
	}
	function _internalException(message) {
	   this.message = message;
	   this.name = "InternalException";
	}	
	
	// Settings
	var defaults = {
		role: undefined,
		playerEl: undefined,
		config: undefined,
		filters: {
			send: '*',
			receive: '*'
		},
		projectName: undefined,
		sessionId: undefined,
		
		listeners: {
			scope: this,
			onInit: function(e) {
			}
		}
	};
	var settings = {};
	
	var sessionState = {
		projectData: {},
		states: {}
	};
	
	
	// Events Handling
	var triggers = {
		server: {
			'playback.event': function(event, playerId) {
				// send event to remote clients
				_sendPlayerEvent.apply(this, arguments);
				// call local listeners
				_callListeners('playback.event.local', event);
			},
			'playback.select.start': function(nodeId, playerId) {
				settings.select = { node: nodeId, playerId: playerId };
				messagingApi.send('startSelect', settings.select).error(function() {
		        	throw new _networkException('startSelect failed');
		        });
			},
			'playback.select.end': function(playerId) {
				if (settings.select === undefined) {
					throw new _internalException('endSelect is not allowed at this time');
				}
				messagingApi.send('endSelect', settings.select).error(function() {
		        	throw new _networkException('startSelect failed');
		        });
				settings.select = undefined;
			},
			'playback.vote.start': function(nodeId, allowReVote, playerId) {
				settings.votes = { 
					node: nodeId,
					revote: (allowReVote === 'true' || allowReVote === true),
					leader: '',
					leaderVotes: 0,
					usersVoted: 0,
					options: {},
					playerId: playerId
				};
				var options = (settings.players[playerId].project[nodeId] !== undefined) ? settings.players[playerId].project[nodeId] : {};        
				for(var index = 0; index < options.length; index++) {             
					var currentOptionNode = options[index].node;        	
					settings.votes.options[currentOptionNode] = {
						users: {},
						votes: 0
					}
				}
				
				// init the vote queue handling
				if (settings.votesQueue.timer === null) {
					settings.votesQueue.timer = setInterval(settings.votesQueue.handler, settings.votesQueue.interval);
				}
				else {
					console.error('playback.vote.start --- queue timer already running');
				}
		
				// send messages to clients
				messagingApi.send('startVote', {node: nodeId, revote: allowReVote, playerId: playerId}).error(function() {
		        	throw new _networkException('startVote failed');
		        });
			},
			'playback.vote.end': function(playerId) {
				if (settings.votes === undefined) {
					throw new _internalException('endVote is not allowed at this time');
				}
				
				// clear the votes queue handling interval and call the handler to handle last pending vote messages 
				if (settings.votesQueue.timer !== null) {
					clearInterval(settings.votesQueue.timer);
					settings.votesQueue.timer = null;
					settings.votesQueue.handler();
				}
				
				// notify clients 
				messagingApi.send('endVote', {node: settings.votes.node, playerId: playerId}).error(function() {
		        	throw new _networkException('endVote failed');
		        });
		        
		        // send event to the session
				messagingApi.send('voteStatistics', settings.votes).error(function() {
		        	throw new _networkException('voteStatistics failed');
		        });
				
				settings.votes = undefined;
			},
			'session.refresh': function() {
				messagingApi.send('sessionEnd', {sessionId: settings.sessionId}).done(function() {
					settings.sessionId = undefined;
					settings.users = undefined;
					settings.votes = undefined;
					settings.select = undefined;

					messagingApi.disconnect();
					
					localStorageApi.remove('interlude.session.server.users');
					localStorageApi.remove('interlude.session.id');
					
					var options = settings;
					settings = {};
					_init(options);
				}).error(function() {
		        	throw new _networkException('sessionEnd failed');
		        });
			}
		},
		client: {
			'session.signin': function() {
				messagingApi.send('signin', settings.user).done(function() {
					_callListeners('session.signin');
		        }).error(function() {
		        	throw new _networkException('signin failed');
		        });
			},
			'session.signout': function() { 
				messagingApi.send('signout', settings.user.id).done(function() {
					_callListeners('session.signout');
					// TODO: should we call messagingApi.disconnect()?
		        }).error(function() {
		        	throw new _networkException('signout failed');
		        });
			},
			'playback.select': function(nodeId, optionId, playerId) { 
				messagingApi.send('select', {
					user_id: settings.user.id, 
					playing_node: nodeId, 
					chosen_next_node: optionId,
					playerId: playerId
				});
			},
			'playback.vote': function(nodeId, optionId, playerId) { 
				if (!settings.vote) {
					throw new _internalException('voting is not allowed at this time');
				}
				if(
					settings.vote.numberOfVotes == 0 ||
				   	settings.vote.numberOfVotes > 0 && settings.vote.revoteAllowed
				) {
					settings.vote.numberOfVotes++;	
					messagingApi.send('vote', {
						user_id: settings.user.id, 
						playing_node: nodeId, 
						chosen_next_node: optionId,
						playerId: playerId
					});
				}
				else {
					console.log("ignoring revote of user "+ settings.user.id+" for node "+nodeId);
				}	
			},
			'playback.control.play': function(playerId) { _sendPlayerEvent('play_video', playerId); },
			'playback.control.pause': function(playerId) { _sendPlayerEvent('pause_video', playerId); },
			'playback.control.stop': function(playerId) { _sendPlayerEvent('stop_video', playerId); },
			'playback.control.replay': function(playerId) { _sendPlayerEvent('create_new_version', playerId); },			
			'playback.event': function(event, playerId) { _sendPlayerEvent.apply(this, arguments); }		
		}
	}
	var listeners = {};
	

	// private methods
	function _makeid() {
		var text = "";
		var possible = "0123456789";

		for( var i=0; i < 6; i++ ) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}
	
	function _getParameterFromQueryString(name, queryString) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(queryString);
		return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	
	
	function _getProjectData(data) {
    	return $.parseJSON(xml2json(data, ""));
    }

    function _getProjectStructure(data) {
    
		function __getInterludeProjectButtonsInfo(containers){
			var buttonsInfo = {};
			for(var index = 0; index < containers.length; index++) {    		
				if(containers[index]['@type'] == 'decisionGui' && typeof containers[index]['button'] != 'undefined') {    	
					for(var buttonsIndex = 0; buttonsIndex < containers[index]['button'].length; buttonsIndex++) {    		
						buttonsInfo[containers[index]['button'][buttonsIndex]['@id']] = containers[index]['button'][buttonsIndex]['@text'];
					}
				}
			}
			return buttonsInfo;
		}
		
    	var projectData = _getProjectData(data);
		var structure = {};
		var groups = projectData.project.playlist.group;
		var nodes = {};
		var buttonsInfo = __getInterludeProjectButtonsInfo(projectData.project.gui.container);		
		//looking for the tree structure nodes.
		for(var index = 0; index < groups.length; index++) {
			if(groups[index]['@groupName'] == 'TREE STRUCTURE') {
	            nodes = groups[index]['node'];
	            break;
			}
		}
		//looping through all structuer nodes.
		for(var index = 0; index < nodes.length; index++) {
			//handling only nodes with decisions.
	        if(typeof nodes[index]['decision'] != 'undefined') {
	        	var currentDecisionChildren = [];
	        	if(typeof nodes[index]['decision']['child'] != 'undefined') {
	        	    for(var childrenIndex = 0; childrenIndex < nodes[index]['decision']['child'].length; childrenIndex++) {
		                var currentChild = {};
		                currentChild['node'] = nodes[index]['decision']['child'][childrenIndex]['@target'];
		                currentChild['display'] = "";
		                if(typeof nodes[index]['decision']['child'][childrenIndex]['decisionButton'] != 'undefined') {		                	
		                    currentChild['display'] = buttonsInfo[nodes[index]['decision']['child'][childrenIndex]['decisionButton']['@id']];	
		                }
		                
		                currentDecisionChildren.push(currentChild);
		            }	
	        	}
	            
	            structure[nodes[index]['@id']] = currentDecisionChildren;
	        }
		}
		return structure;
	}
	
	
	function _isBuiltinEvent(event) {
		if (typeof event != 'string') {
			return false;
		}
		
		var eventComponents = event.split('.');
		return (
			eventComponents.length > 0 && 
			(eventComponents[0] == 'playback' || eventComponents[0] == 'session')
		) 
	}
	

	function _checkFilter(type, event) {
		return (
			settings.filters[type] !== undefined && 
			(
				settings.filters[type] == '*' ||
				settings.filters[type][event] !== undefined
			)
		);
	}
	
	function _sendPlayerEvent(event, playerId) {
		if (_checkFilter('send', event)) {
			messagingApi.send(
				'playerEvent', 
				{
					eventName: event, 
					playerId: playerId,
					userId: (settings.user !== undefined ? settings.user.id : settings.sessionId), // clients use the users id, while the server uses the session id
					params: Array.prototype.slice.call(arguments, 1)
				}
			);
		}
	}
	
	function _getPlayerAPI(message) {
		var playerId = message.playerId;
		if (playerId===undefined) {
			for (var prop in settings.players) {
				playerId = prop;
				break;
			}
		}
		return settings.players[playerId].api;
	}
	
	function _hasSettings(requiredFields) {
		$.each(requiredFields, function(index, field) {
			if (!(field in settings)) {
				return false;
			}
		});
		return true;
	}
	
	function _callListeners(event, data) {
		console.log('_callListeners: '+event);
		console.log(data);
		if (event in listeners) {
			$.each(listeners[event], function(index, listener) {
				listener.call(listener, data);
			});
		}
	}
	
		
	function _registerClientCallbacks() {
			
		messagingApi.on('sessionEnd', function(data) {
			_callListeners('session.signout');
			// TODO: should we call messagingApi.disconnect()?
		});
	
		messagingApi.on('playerEvent', function(data) {
			// make sure we handle only events from the server.
			if(data.message.userId == settings.sessionId) {
				console.log('received '+data.message.eventName+' player event');
				
				if(_checkFilter('receive', data.message.eventName)) {
					var event = 'playback.event.remote';
					switch (data.message.eventName) {
						case 'videoCreateNew' :
							event = 'playback.replay';
							break;
						case 'videoEnded' :
							event = 'playback.end';
							break;
						case 'play_video' :
							event = 'playback.control.play';
							break;
						case 'pause_video' :
							event = 'playback.control.pause';
							break;
						case 'toggle_play' :
							event = 'playback.control.toggle';
							break;
						case 'stop_video' :
							event = 'playback.control.stop';
							break;
					}
					_callListeners(event, { message: data.message });
				}
			} 
		}, this);
		
		
		messagingApi.on('projectData_'+settings.user.id, function(data) {
			console.log('received project '+settings.user.id);
			settings.players = data.message.projectData;
			_callListeners('playback.project', { project: data.message.projectData });      
		}, this);
	

		messagingApi.on('startSelect', function(data) {
			var message = data.message;
			var playerId = message.playerId;
			var options = (settings.players[playerId][message.node] != undefined) ? settings.players[playerId][message.node] : {};
			// call local listeners
			_callListeners('playback.select.start', { node: message.node, options: options });
		}, this);

		messagingApi.on('endSelect', function(data) {
			_callListeners('playback.select.end');      
		}, this);
		

		messagingApi.on('startVote', function(data) {
			var message = data.message;  
			var playerId = message.playerId;
			settings.vote = {
				revoteAllowed: message.revote,
				numberOfVotes: 0
			}
			var options = (settings.players[playerId][message.node] != undefined) ? settings.players[playerId][message.node] : {};
			// call local listeners
			_callListeners('playback.vote.start', { node: message.node, options: options, revoteAllowed: message.revote });
		}, this);
		
		messagingApi.on('endVote', function(data) {
			settings.vote = undefined;
			_callListeners('playback.vote.end');      
		}, this);
		
		messagingApi.on('voteStatistics', function(data) {
			var message = data.message;
			// call local listeners
			_callListeners('playback.vote.stats', message);
		}, this);
	}
	
	
	
	function _registerServerCallbacks() {
	
		// what should the server do on user's signin
		messagingApi.on('signin', function(data) {
			var message = data.message;
			var user = {
				id: message.id, 
				name: message.name, 
				category: message.category, 
				subcategory: message.subcategory
			}
			       
			// adding the user only if he doesn't already exist.
			if(settings.users[user.id] === undefined) {
				settings.users[user.id] = user;
				localStorageApi.set('interlude.session.server.users', JSON.stringify(settings.users));
			}
			
			// send the project data to the new user
			console.log('sending project data to '+user.id);
			console.log(settings.project);
			messagingApi.send(
				'projectData_'+user.id, 
				{projectData: sessionState.projectData}
			);
			
			// call local listeners
			_callListeners('session.signin', message);
		}, this);
		
		// what should the server do on user's signout
		messagingApi.on('signout', function(data) {
			var message = data.message;        
			if(settings.users[message.id] !== undefined) {
				delete settings.users[message.id];
				localStorageApi.set('interlude.session.server.users', JSON.stringify(settings.users));	
			}  
			
			// call local listeners
			_callListeners('session.signout', message); 								
		}, this);
		
		
		// what should the server do on remote player event
		messagingApi.on('playerEvent', function(data) {
			//console.log('playerEventDefaultCallback', data);
			var message = data.message;
			//making sure it's not an event this page had raised.
			if(message.userId != settings.sessionId) {
				//making sure a singed in user has sent the event.
				if(settings.users[message.userId] !== undefined) {
					//making sure the event is in the events white list.
					if(_checkFilter('receive', message.eventName)) {
						//console.log('Handling player event '+message.eventName);
						
						var playerAPI = _getPlayerAPI(message);
						if (playerAPI !== undefined) {
							// if it's an event the player can handle - pass it on 
							eventFunction = playerAPI[message.eventName];
							if(typeof eventFunction === 'function') {
								paramsArr = [];
								if(message.params != 'undefined') {
									for(var key in message.params) {
										paramsArr.push(message.params[key]);
									}
								}
								eventFunction.apply(playerAPI, paramsArr);
							
								// call local listeners
								_callListeners('playback.event.remote', message);
							}
							else {
								console.log('Unknown player event '+message.eventName);
							}
						}    
						else {
							console.error('player not found at '+playerId);
						}	
					}
					else {
						console.log('Player event '+message.eventName+' is blocked in this session');
					}				            
				}
				else {
					console.log('Player event from a user with ID: '+message.userId+' is ignored because the user is not signed in to the current session.');
				}
			}				    
		}, this);


	
		// what should happen on selection
		messagingApi.on('select', function(data) {
			var message = data.message;
			
			if (settings.select === undefined) {
				throw new _internalException('select is not allowed at this time');
			}
			if (settings.select.node != message.playing_node) {
				throw new _internalException('select is not valid');
			}
			
			var playerAPI = _getPlayerAPI(message);
			if (playerAPI !== undefined) {
				playerAPI.select_node(message.chosen_next_node);
				_callListeners('playback.select', message);
			}
			else {
				console.error('player not found at '+playerId);
			}		
		}, this);
		
		
		// what should happen on vote
		messagingApi.on('vote', function(data) {
			var message = data.message;
			
			if (settings.votes === undefined) {
				console.log('vote is not allowed at this time');
				return false;
			}
			if (settings.votes.node != message.playing_node) {
				console.log('vote is not valid');
				return false;
			}
			
			// push the message to the queue for future handling
			settings.votesQueue.queue.push(message);
			
			// call local listeners
			_callListeners('playback.vote', message);
		});
	}



	// API
	function _on(event, listener) {
		if (!$.isFunction(listener)) {
			throw new _badParamsException('listener must be a function');
		}
		
		if (_isBuiltinEvent(event)) {
			console.log('interlude.on [builtin] '+event);
			// if we don't have listeners for this event we create the initial listeners array
			if (!(event in listeners)) {
				listeners[event] = [];
			}
			// add the listener to the array if it's not already there
			if ($.inArray(listener, listeners[event]) == -1) {
				listeners[event].push(listener);
			}		
		}
		// this is a custom event - no  known trigger found - bind as direct message
		else {
			console.log('interlude.on [custom] '+event);
			messagingApi.on(event, function(data) {
				var message = data.message;
				listener.apply(listener, message); 
			});
		}
	}


	function _off(event, listener) {
		if (_isBuiltinEvent(event)) {
			// if we don't have listeners for this event we create the initial listeners array
			if (!(event in listeners)) {
				return;
			}
			// if we where not provided a specific listener to remove we remove them all
			if (listener === undefined) {
				delete listeners[event];
			}
			// otherwise we remove the specific listener
			else {
				listeners[event] = $.grep(listeners[event], function(l) {
					return (l !== listener);
				});
			}
		}
		// this is a custom event - no  known trigger found - bind as direct message
		else {
			// TODO: implement 'off' for the messagingApi
		}
	}

	

	function _trigger(event) {
		// built is triggers
		if ($.isFunction(triggers[settings.role][event])) {
			triggers[settings.role][event].apply(
				settings.listeners.scope,
				Array.prototype.slice.call(arguments, 1)
			);
		}
		// in case we dont know this trigger we assume it is a custom event and send it as-is
		else {
			messagingApi.send(event, Array.prototype.slice.call(arguments, 1));
		}
	}
	
	function _state(event) {
		// save the event in the remote storage
		var args = Array.prototype.slice.call(arguments, 1);
		if (args.length == 0) {
			delete sessionState.states[event];
		}
		else {
			sessionState.states[event] = args
		}
		remoteStorageApi.put(sessionState);
	}

	
	function _init(options) {
		// merge given options and the defaults into the settings object
		$.extend(settings, defaults, options);
		
		switch (settings.role) {
			case 'server' : {
				// verify that the required settings for server role were given
				if (!_hasSettings(['projectName', 'players'])) {
					throw new _badParamsException('params are missing');
				}
				
				// init server session with the project name				
				settings.projectName = localStorageApi.getOrSet('interlude.session.project_name', settings.projectName);
				settings.sessionId = localStorageApi.getOrSet('interlude.session.id', _makeid());

				var users = localStorageApi.getOrSet('interlude.session.server.users', '');
				if(users != null && users != '') {
					settings.users = $.parseJSON(users);
				}
				else {
					settings.users = {};
				}

				// init remote storage
				remoteStorageApi.init({
					sessionId: settings.sessionId
				});
				
				// init votes queue
				settings.votesQueue = {
					queue: [],
					interval: settings.votesQueuePollingInterval !== undefined ? settings.votesQueuePollingInterval : 100,
					timer: null,
					handler: function() {
						if (settings.votesQueue.queue.length == 0) {
							return true;
						}
			
						var playerAPI = null;
						var voteLeaderNode = null;
						
						console.log('settings.votesQueue.handler --- handling '+settings.votesQueue.queue.length+' pending votes');
						// iterate over the pending vote messages in the queue and handle them
						$.each(settings.votesQueue.queue, function(index, message) {
							if(
								settings.votes.usersVoted[message.user_id] === undefined ||
								(
									settings.votes.usersVoted[message.user_id] > 0 &&
									settings.votes.revoteAllowed
								)
							) {
								if(settings.votes.usersVoted[message.user_id] === undefined) {
									settings.votes.usersVoted[message.user_id] = 1;	
								}
								else {
									settings.votes.usersVoted[message.user_id]++;		
								}
				
								if(settings.votes.options[message.chosen_next_node].users[message.user_id] === undefined) { 
									settings.votes.options[message.chosen_next_node].users[message.user_id] = 1;
								}
								else {
									settings.votes.options[message.chosen_next_node].users[message.user_id]++;	
								}

								//update the option's votes.
								settings.votes.options[message.chosen_next_node].votes++;
			
								//update leader and his votes if needed.
								if(settings.votes.options[message.chosen_next_node].votes > settings.votes.leaderVotes) {
									settings.votes.leaderVotes = settings.votes.options[message.chosen_next_node].votes;

									settings.votes.leader = message.chosen_next_node;
									
									playerAPI = _getPlayerAPI(message);
									voteLeaderNode = message.chosen_next_node;
								}
							}
						});
						
						// we have a new leader - let's update the relevant player
						if (playerAPI && voteLeaderNode) {
							playerAPI.set_property('playerAPI.variables.voteLeaderNode', voteLeaderNode);
						}
						

						// call local listeners
						_callListeners('playback.vote.stats', settings.votes);
						
						// clear the queue
						settings.votesQueue.queue.length = 0;
						return true;
					}
				};

				// create players objects
				var playersIDs = settings.players;
				settings.players = {};
				$.each(playersIDs, function(index, id) {
					var flashVarsEl = $('object[type="application/x-shockwave-flash"] > param[name="flashVars"][value*="'+id+'"]');
					if (flashVarsEl.length != 1) {
						throw new _badParamsException('failed finding flash object for id: '+id);
					}
					var flashVars = flashVarsEl.attr('value');
					if (!flashVars) {
						throw new _badParamsException('failed finding flashVars param for flash object id: '+id);
					}
					var configURL = _getParameterFromQueryString('project_url', '?'+flashVars);
					if (!configURL) {
						throw new _badParamsException('failed finding config URL in flashVars for flash object id: '+id);
					}
					
					settings.players[id] = {
						api: new InterludePlayerAPI(flashVarsEl.parent().get(0)),
						configURL: configURL
					};
				});
				
				// init the messaging infrastructure
				messagingApi.init({
					engine: 'pusher',
					projectName: settings.projectName,
					sessionId: settings.sessionId,
					listeners: {
						scope: this,
						onInit: function() {
							// this is where is connects with the rest of the SDK
							_registerServerCallbacks();
								
							// build array of config load ajax promises for all players 
							var configLoadPromises = [];
							$.each(settings.players, function(id, obj) {
								configLoadPromises.push(
									$.get(
										obj.configURL, 
										function (data) {
											obj.rawProjectData = _getProjectData(data);
											obj.project = _getProjectStructure(data);
										},
										'text'
									)
								);
							});
							
							// when all deferred  objects are resolved we can call onInit (or fail)
							$.when.apply($, configLoadPromises).done(function() {
								// save state to remote storage
								var projectData = {};
								$.each(settings.players, function(id, obj) {
									sessionState.projectData[id] = obj.project
								});
								remoteStorageApi.put(sessionState);
							
								// build client URLs
								var baseURL = window.location.href.replace(/\main.html/, '');

								// call onInit once we read of the config file
								if ($.isFunction(settings.listeners.onInit)) {
									settings.listeners.onInit.call(
										settings.listeners.scope, 
										{
											projectName: settings.projectName,
											sessionId: settings.sessionId,
											clientURLs: {
												base: baseURL,
												direct: baseURL+'?project_name='+settings.projectName+'&session_id='+settings.sessionId 
											} 
										}
									);
								}
							}).fail(function() {
								throw new _badParamsException('failed loading config files');
							}); 
						}
					}
				});
				
				break;
			}
			case 'client' : {
				// verify that the required settings for client role were given
				if (!_hasSettings(['sessionId', 'projectName'])) {
					throw new _badParamsException('projectName or sessionId is missing');
				}
								
				// init the user's object
				settings.user = {};
				settings.user.id = localStorageApi.getOrSet('interlude.session.client.user.id', _makeid());
				settings.user.name = localStorageApi.getOrSet('interlude.session.client.user.name', "defaultName");
				settings.user.category = localStorageApi.getOrSet('interlude.session.client.user.category', "defaultcategory");
				settings.user.subcategory = localStorageApi.getOrSet('interlude.session.client.user.subcategory', "defaultSubcategory");

				// init remote storage
				remoteStorageApi.init({
					sessionId: settings.sessionId
				});

				messagingApi.init({
					engine: 'pusher',
					projectName: settings.projectName,
					sessionId: settings.sessionId,
					listeners: {
						scope: this,
						onInit: function() {
							
							// this is where is connects with the rest of the SDK
							_registerClientCallbacks();
				
							// delay the signin due to pusher bind issues - ugly hack
							var delay = new $.Deferred(); 
							// Resolve after a random interval
							setTimeout(function() {
								delay.resolve("");
							}, 3000);
				
							$.when(
								remoteStorageApi.get(), // read the current session state (in case we've missed important messages)
								delay.promise()			// make sure we wait at least 3 secs
							).done(function(sessionState, delayResolved) {
								// update the local state with the info received from the session state
								if (sessionState.projectData !== undefined) {
									settings.players = sessionState.projectData;
								}

								// trigger signin event
								_trigger('session.signin');
							
								// call onInit
								if ($.isFunction(settings.listeners.onInit)) {
									settings.listeners.onInit.call(
										settings.listeners.scope, 
										{
											projectName: settings.projectName,
											sessionId: settings.sessionId,
											state: sessionState.states
										}
									);
								}
							});
						}
					}
				});
				break;
			}
			default: {
				throw new _badParamsException('role is missing, or not a valid value');
			}
		}
		
	}



    return {
        init: _init,
        on: _on,
        off: _off,
        trigger: _trigger,
        state: _state,
		settings: settings,
        
        exception: {
        	BadParams: _badParamsException,
        	NetworkException: _networkException,
        	InternalException: _internalException
        }
    }
})(window.interludeMessaging, window.interludeLocalStorage, window.interludeRemoteStorage);