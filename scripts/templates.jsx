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
        <h1>Two Strangers Meet in a Bar</h1>
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
      <div className="container credits centered-text">
        <h1>Two Strangers Meet in a Bar</h1>

        <div className="credit-block">
          <h4>Written and Directed by</h4>
          <h2>Máté Bede-Fazekas</h2>
          <h2>Nolan Funk</h2>
        </div>

        <div className="credit-block">
          <h4>Producer</h4>
          <h2>Julia Saubier</h2>
        </div>

        <div className="credit-block">
          <h4>Executive Producers</h4>
          <h2>Alon Benari</h2>
          <h2>Szilvia Viczián</h2>
        </div>


        <div className="credit-block cast-list">
          <h1>Cast</h1>

          <h4>Allison</h4>
          <h2>Allison Brown</h2>

          <h4>William</h4>
          <h2>Máté Bede-Fazekas</h2>

          <h4>Bartender</h4>
          <h2>Attilio Rigotti</h2>

          <h4>Boyfriend</h4>
          <h2>Yannick Trapman-O'brien</h2>

          <h4>Wife</h4>
          <h2>Megan Vincent</h2>

          <h4>Mistress</h4>
          <h2>Julia Saubier</h2>

          <h4>Concierge</h4>
          <h2>Shivram Giri</h2>
        </div>

        <div className="credit-block">
          <h4>Director of Photography</h4>
          <h2>Matthew Mendelson</h2>
        </div>

        <div className="credit-block">
          <h4>Production Design</h4>
          <h2>Adam Pivirotto</h2>
        </div>

        <div className="credit-block">
          <h4>Edited by</h4>
          <h2>Máté Bede-Fazekas</h2>
          <h2>Nolan Funk</h2>
        </div>

        <div className="credit-block">
          <h4>Associate Producer</h4>
          <h2>Adam Pivirotto</h2>
        </div>

        <div className="credit-block">
          <h4>Costume and Make-up</h4>
          <h2>Adam Pivirotto</h2>
          <h2>Megan Vincent</h2>
        </div>

        <div className="credit-block">
          <h4>Unit Production Manager</h4>
          <h2>Yi Yi Yeap</h2>
        </div>

        <div className="credit-block">
          <h4>Line Producer</h4>
          <h2>Chani Gatto</h2>
        </div>

        <div className="credit-block">
          <h4>Assistant Director</h4>
          <h2>Amani Alsaied</h2>
        </div>

        <div className="credit-block">
          <h4>Gaffer/Key Grip</h4>
          <h2>David Woolner</h2>
        </div>

        <div className="credit-block">
          <h4>Assistant Camera</h4>
          <h2>Jess Dela Merced</h2>
        </div>

        <div className="credit-block">
          <h4>Sound Mixer</h4>
          <h2>Ashley Hoban</h2>
        </div>

        <div className="credit-block">
          <h4>Programmer</h4>
          <h2>Lingliang Zhang</h2>
        </div>

        <div className="credit-block">
          <h4>Production Assistants</h4>
          <h2>Robson Beaudry</h2>
          <h2>Joi Lee</h2>
          <h2>Cain Mathis</h2>
          <h2>Attilio Rigotti</h2>
          <h2>Laura Waltje</h2>
        </div>

        <div className="credit-block">
          <h4>Special Thanks</h4>
          <h2>Hilah Almog</h2>
          <h2>Alana Barraj</h2>
          <h2>Eric Baukhages</h2>
          <h2>Laura Cazeaux</h2>
          <h2>Douglas Choi</h2>
          <h2>Scandar Copti</h2>
          <h2>Scott Fitzgerald</h2>
          <h2>Alexis Gambis</h2>
          <h2>Dale Hudson</h2>
          <h2>Seung-Hoon Jeong</h2>
          <h2>Amos Ezra Katz</h2>
          <h2>Nikolai Kozak</h2>
          <h2>Joi Lee</h2>
          <h2>Richard Lennon</h2>
          <h2>Debra Levine</h2>
          <h2>Oscar Lozano</h2>
          <h2>Laila Rihawi</h2>
          <h2>Lihu Roter</h2>
          <h2>Jennifer Roth</h2>
          <h2>Lamar Sanders</h2>
          <h2>Jim Savio</h2>
          <h2>Joanne Savio</h2>
          <h2>Gail Segal</h2>
          <h2>Omar Shoukri</h2>
          <h2>Sandi Sissel</h2>
        </div>

        <div className="credit-block">
          <h4>Supported by</h4>
          <h2>INTERLUDE STUDIOS</h2>
          <h2>EASTERN MANGROVES HOTEL &amp; SPA</h2>
          <h2>ST. REGIS ABU DHABI</h2>
          <h2>NEW YORK UNIVERSITY ABU DHABI</h2>
        </div>

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
      vote: -1
    };
  },
  vote: function(choice) {
    var self = this;
    return function() {
      self.setState({vote: choice});
      interlude.trigger('playback.vote', self.props.event.node, self.props.event.options[choice].node, currentPlayerId);
    };
  },
  componentDidMount: function() {
    var self = this;
    var loader = document.getElementById('loader'),
      alpha = 0,
      pi = Math.PI,
      t = 15;
      //if ($.inArray(this.props.event.node,
        //["node_beginning_c761",
         //"node_william_c783",
         //"node_boyfriend_c832",
         //"node_allison_c790",
          //]) > 0)
      //t = 15;

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
      case "node_ring_c818":
        image = "/img/4.png";
        break;
      case "node_no_ring_c825":
        image = "img/5.png";
        break;
      case "node_boyfriend_c832":
        image = "/img/6.png";
        break;
      case "node_no_boyfriend_c839":
        image = "/img/7.png";
        break;
    }
    var backgroundImage = {
      "background-image": "url(" + image +")"
    };
    var leftVoteStyle = {};
    var rightVoteStyle = {};
    switch (this.state.vote) {
      case 0:
        rightVoteStyle.opacity = 0.7;
        break;
      case 1:
        leftVoteStyle.opacity = 0.7;
        break;
    }
    var voteTimer = 
      <svg className="timeout" width="50" height="50" viewbox="0 0 50 50">
        <path id="loader" transform="translate(25, 25) scale(.84)"/>
      </svg>;
    return(
      <div className="container vote-image" style={backgroundImage}>
        <div className="vote-first vote" onClick={this.vote(0)} style={leftVoteStyle}>
        </div>
        <div className="vote-right vote" onClick={this.vote(1)} style={rightVoteStyle}>
        </div>
        {this.state.vote == - 1 ? voteTimer : null}
      </div>
    );
  }
});

