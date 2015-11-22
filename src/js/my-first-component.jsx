var React = require('react'),
    Layout = require('./layout'),
    Greeter = require('./greeter'),
    NameTaker = require('./name-taker');

var MyFirstComponent = React.createClass({
  render: function() {
    return (
      <Layout>
        <Greeter name={this.state.name} />
        <NameTaker name={this.state.name} 
                   onNameUpdate={this.onNameUpdate}/>
      </Layout>
    );
  },

  getInitialState: function() {
    return {name: 'World'};
  },

  onNameUpdate: function(e) {
    this.setState({name: e.target.value});
  }
});

module.exports = MyFirstComponent;

