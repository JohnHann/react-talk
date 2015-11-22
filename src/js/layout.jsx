var React = require('react');

var Layout = React.createClass({
  render: function() {
    return (
      <div>
        <div className="header" />
          <div className="content">
            {this.props.children}
          </div>
        <div className="footer" />
      </div>
    );
  }
});

module.exports = Layout;