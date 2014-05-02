/** @jsx React.DOM */

var WelcomeScreen = React.createClass({
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
        <div className={classes}>{status}</div>
      </div>
    );
  }

});
var EndScreen = React.createClass({
  render: function() {
    return(
      <div className="container welcome centered-text">
        <h1 className="absolute-center">Two Strangers</h1>
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
  getInitialState: function() {
    return {
      voted: false
    };
  },
  vote: function(choice) {
    var self = this;
    return function() {
      interlude.trigger('playback.vote', self.props.event.node, self.props.event.options[choice].node, currentPlayerId);
      React.renderComponent(
        <IdleScreen />,
        document.getElementById("main")
      );
    };
  },
  componentDidMount: function() {
    var self = this;
    var loader = document.getElementById('loader'),
      alpha = 0,
      pi = Math.PI,
      t = 10;

    (function draw() {
      alpha++;
      var r = ( alpha * pi / 180 ),
        x = Math.sin( r ) * 25,
        y = Math.cos( r ) * - 25,
        mid = ( alpha > 180 ) ? 1 : 0,
        anim = 'M 0 0 v -25 A 25 25 1 ' +
               mid + ' 1 ' +
               x  + ' ' +
               y  + ' z';
      loader.setAttribute( 'd', anim );
      
      if (alpha < 359)
        setTimeout(draw, t); // Redraw
      else {
        //React.renderComponent(
          //<IdleScreen />,
          //document.getElementById("main")
        //);
      }
    })();
  },
  render: function() {
    var image;
    switch (this.props.event.node) {
      case "node_beginning_c761":
        image = "/img/1.png";
        break;
      case "node_william_c783":
        image = "/img/2.png"; 
        break;
      case "node_allison_c790":
        image = "/img/3.png";
        break;
      case "node_no_ring_c832": // please swap
        image = "img/4.png";
        break;
      case "node_ring_c825": // please swap
        image = "/img/5.png";
        break;
      case "node_boyfriend_c839":
        image = "/img/6.png";
        break;
      case "node_no_boyfriend_c846":
        image = "/img/7.png";
        break;
    }
    var style = {
      "background-image": "url(" + image +")"
    };
    return(
      <div className="container vote-image" style={style}>
        <div className="vote-first vote" onClick={this.vote(0)}>
          <h2 className="button">{this.props.event.options[0].display}</h2>
        </div>
        <div className="vote-right vote" onClick={this.vote(1)}>
          <h2 className="button">{this.props.event.options[1].display}</h2>
        </div>
        <svg className="timeout" width="50" height="50" viewbox="0 0 50 50">
          <path id="loader" transform="translate(25, 25) scale(.84)"/>
        </svg>
      </div>
    );
  }
});

