var React = require('react');

var NameTaker = React.createClass({
  render: function() {
    return (
      <input type="text" 
             onChange={this.props.onNameUpdate}
             value={this.props.name}/>
    );
  }
});

module.exports = NameTaker;