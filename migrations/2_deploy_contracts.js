var Legolas = artifacts.require("./Legolas.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Legolas);
};
