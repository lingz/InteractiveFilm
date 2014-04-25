/** @jsx React.DOM */

var WelcomeScreen = React.createClass({
  componentDidMount: function() {
    var loader = document.getElementById('loader'),
      alpha = 0,
      pi = Math.PI,
      t = 10;

    (function draw() {
      alpha++;
      alpha %= 360;
      var r = ( alpha * pi / 180 ),
        x = Math.sin( r ) * 125,
        y = Math.cos( r ) * - 125,
        mid = ( alpha > 180 ) ? 1 : 0,
        anim = 'M 0 0 v -125 A 125 125 1 ' +
               mid + ' 1 ' +
               x  + ' ' +
               y  + ' z';
      loader.setAttribute( 'd', anim );
      
      if (alpha < 359)
        setTimeout(draw, t); // Redraw
      else
        $(".timeout").css({display: "none"});
    })();
  },
  render: function() {

    var connected = this.props.connected;
    var status = connected ? "Connected" : "Connecting";
    var classes = React.addons.classSet({
      "connecting": !connected,
      "connected": connected
    });
    return(
      <div className="container welcome centered-text">
        <h1>Two Strangers</h1>
        <p>Use your device to influence the path of the film.</p>
        <p>Your device will automatically display options when a choice is to be made.</p>
        <p>Tap the left or right half of the screen to guide the characters.</p>
        <p>We recommend you disable your lock screen for the best experience.</p>
        <svg className="timeout" width="250" height="250" viewbox="0 0 250 250">
          <path id="loader" transform="translate(125, 125) scale(.84)"/>
        </svg>
        <div className={classes}>{status}</div>
      </div>
    );
  }

});

var IdleScreen = React.createClass({
  render: function() {
    return(
      <div className="container">
        <div className="spinner"><div></div></div>
      </div>
    );
  }
});

var VoteScreen = React.createClass({
  voteFirst: function() {
    interlude.trigger('playback.vote', e.node, e.options[0].node, currentPlayerId);
  },
  voteSecond: function() {
    interlude.trigger('playback.vote', e.node, e.options[1].node, currentPlayerId);
  },
  render: function() {
    var image = null;
    var style = {
      "background-image": "url(" + image +")"
    };
    return(
      <div className="container vote-image" style={style}>
      </div>
    );
  }
});

