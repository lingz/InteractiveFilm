/** @jsx React.DOM */

$(document).ready(function() {

  $('#slides').interludeslideshow();

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.href);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function showMessage(message) {
    console.log("Showing Message");
    console.log(message);
  }

  // try to get the session and project from the query string
  var sessionId = "696830";
  var projectName = getParameterByName('project_name');
  var currentPlayerId;
  var connected = false;

  function init() {
    // try to init the interlude SDK
    interlude.init({
      role: 'client',
      projectName: projectName,
      sessionId: sessionId,
      filters: {
        receive: {
          'videoCreateNew': 1, 
          'videoEnded': 1, 
          'play_video': 1, 
          'pause_video': 1, 
          'toggle_play': 1, 
          'stop_video': 1
        },
        send: {
          'create_new_version': 1, 
          'play_video': 1, 
          'pause_video': 1, 
          'toggle_play': 1, 
          'stop_video': 1
        }
      },
      listeners: {
        onInit: function(e) {

          interlude.on('playback.project', function(e) {
            console.log(e);
            showMessage('got the player data');
          });
        
          interlude.on('playback.select.start', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('time to select');
            console.log(e);
          });
      
          interlude.on('playback.select.end', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('no more selection');
          });

          interlude.on('playback.vote.start', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('time to vote');
            console.log(e);
            React.renderComponent(
              <WelcomeScreen voteFirst={voteFirst} voteSecond={voteSecond} node={e.node} />,
              document.getElementById("main")
            );

          });
      
          interlude.on('playback.vote.end', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('no more to voting allowed');
          });
        
          interlude.on('playback.vote.stats', function(e) {
            // do something interesting with the DOM with e.something
            //showMessage('here is what we got', e);
          });
          interlude.on('session.signin', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('you are in the game!');
            connected = true;
            React.renderComponent(
              <WelcomeScreen connected={true} />,
              document.getElementById("main")
            );
          });
          interlude.on('session.signout', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('no soup for you today!');
          });
          interlude.on('playback.start', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('video started');
          });
          interlude.on('playback.resume', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('video resuming');
          });
          interlude.on('playback.end', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('video got to its end');
          });
          interlude.on('playback.replay', function(e) {
            // do something interesting with the DOM with e.something
            showMessage('here we go again');
          });
        
                        
          interlude.on('slideshow.move', function(slideIndex) {
            switch (slideIndex) {
              case 0:
                React.renderComponent(
                  <WelcomeScreen connected={connected} />,
                  document.getElementById("main")
                );
                break;
              case 1:
                React.renderComponent(
                  <IdleScreen />,
                  document.getElementById("main")
                );
                break;
            }
            
            console.log('slideshow.move', slideIndex);
          });	
          
        }
      }
    });

  }

  if (!projectName) {
    projectName='develop';
  }

  React.renderComponent(
    <WelcomeScreen connected={connected} />,
    document.getElementById("main")
  );
  init();


});

