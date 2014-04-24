var InterludePlayerAPI = function(playerEl) {
	this.player = playerEl;
	this.fullsize = true;
}	

InterludePlayerAPI.prototype.play_video = function() {
	this.player.play_video();
}

InterludePlayerAPI.prototype.pause_video = function() {
	this.player.pause_video();
}

InterludePlayerAPI.prototype.toggle_play = function() {
	this.player.toggle_play();
}

InterludePlayerAPI.prototype.select_node = function(nodeId) {
	this.player.node_select(nodeId, 0);
}

InterludePlayerAPI.prototype.stop_video = function(param) {
	if(typeof param != 'undefined') {
		this.player.stop_video(param);    
	}        		
	else {
		this.player.stop_video();
	}    
}

InterludePlayerAPI.prototype.create_new_version = function() {
	this.player.create_new_version();
}

InterludePlayerAPI.prototype.replay_video = function() {        		
	this.player.replay_video();
}			

InterludePlayerAPI.prototype.toggle_mute = function() {
	this.player.toggle_mute();
}

InterludePlayerAPI.prototype.set_volume = function(value) {        		
	this.player.set_volume(value);
}

InterludePlayerAPI.prototype.share = function(method, url, target) {
	this.player.share(method,url,target);
}

InterludePlayerAPI.prototype.share_passive = function(method, url, target) {
	this.player.share_passive(method,url,target);
}

InterludePlayerAPI.prototype.set_property = function(property, value) {        		
	this.player.set_property(property,value);
}

InterludePlayerAPI.prototype.tween_to_state = function(state, component, time) {
	this.player.tween_to_state(state,component,time);
}

InterludePlayerAPI.prototype.apply_state = function(state, component) {
	this.player.apply_state(state,component);
}

InterludePlayerAPI.prototype.exit_fs = function() {
	this.player.exit_fs();
}

InterludePlayerAPI.prototype.resize_player = function() {
	if(this.fullsize) {
		resize(460,259);
		this.fullsize=false;
	}
	else {
		resize(854,480);
		this. fullsize=true;
	}
}

InterludePlayerAPI.prototype.resize = function(width, height) {
	this.player.resize_player(width, height);
	this.player.style.width = width+'px';
	this.player.style.height = height+'px';
	this.player.setAttribute('width', width+'px');
	this.player.setAttribute('height', height+'px');
	var playerDiv = this.player.parentNode;
	playerDiv.style.width = width+'px';
	playerDiv.style.height = height+'px';
}
