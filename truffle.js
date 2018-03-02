require('babel-register');
require('babel-polyfill');

var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "5777"
    },
    live: {
        provider: function() {
            return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/TYZgtx1jed77FV5qKWfP", 3);
        },
        network_id: 1
    },
  }
};
