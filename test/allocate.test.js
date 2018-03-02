import expectThrow from './helpers/expectThrow';

require('chai')
  .use(require('chai-as-promised'))
  .should();

const Legolas = artifacts.require('Legolas');

/// @param _address The address of the recipient
/// @param _amount Amount of the allocation
/// @param _type Type of the recipient. 0 for advisor, 1 for founders.
/// @return Whether the allocation was successful or not
contract('Legolas@allocate', function(accounts) {
  beforeEach(async function() {
    this.token = await Legolas.new();

  });

  it('allocate valid amount for one advisor ', async function() {
    const amount = (8750000 - 4000) * (10**8);
    const advisor = accounts[1];

    await this.token.allocate(advisor, amount, 0);

    const allocatedForAdvisor = await this.token.advisors.call(advisor);
    const advisorBalance = await this.token.balanceOf.call(advisor);


    allocatedForAdvisor.should.to.be.true;
    advisorBalance.toNumber().should.be.equal(amount);
  });

  it('allocate more then limit amount for one advisor ', async function() {
    const amount = (8750000 + 400) * (10**8);
    const advisor = accounts[1];

    await expectThrow(this.token.allocate(advisor, amount, 0), "StatusError");

    const allocatedForAdvisor = await this.token.advisors.call(advisor);
    const advisorBalance = await this.token.balanceOf.call(advisor);

    allocatedForAdvisor.should.to.be.false;
    advisorBalance.toNumber().should.be.equal(0);
  });

  it('allocate valid amount for one founder ', async function() {
    const amount = (26250000 - 4000) * (10**8);
    const founder = accounts[1];

    await this.token.allocate(founder, amount, 1);

    const allocatedForFounder = await this.token.founders.call(founder);
    const founderBalance = await this.token.balanceOf.call(founder);

    allocatedForFounder.should.to.be.true;
    founderBalance.toNumber().should.be.equal(amount);
  });

  it('allocate more then limit amount for one founder ', async function() {
    const amount = (26250000 + 200) * (10**10) * (10**8);
    const founder = accounts[1];

    await expectThrow(this.token.allocate(founder, amount, 1), "StatusError");

    const allocatedForFounder = await this.token.founders.call(founder);
    const founderBalance = await this.token.balanceOf.call(founder);

    allocatedForFounder.should.to.be.false;
    founderBalance.toNumber().should.be.equal(0);
  });

  it('allocate valid bonus amount for one holder with existing balance', async function() {
    const balance = 5000;
    const amount = (105000000 - 1000000) * (10**8);
    const holder = accounts[1];

    await this.token.transfer(holder, balance);
    await this.token.allocate(holder, amount, 2);

    //const eligibleForBonus = await this.token.eligibleForBonus.call(1534291200).call(holder);
    const holderBalance = await this.token.balanceOf.call(holder);
    const allocations = await this.token.allocations.call(holder);

    //eligibleForBonus.should.to.be.true;
    holderBalance.toNumber().should.be.equal(amount + balance);
    allocations.toNumber().should.be.equal(amount);
  });

  it('allocate more then limit amount for one founder ', async function() {
    const balance = 4000 * 10**8;
    const amount = (105000000 - 3000) * (10**8);
    const founder = accounts[1];

    await expectThrow(this.token.allocate(founder, amount, 1), "StatusError");

    const allocatedForFounder = await this.token.founders.call(founder);
    const founderBalance = await this.token.balanceOf.call(founder);

    allocatedForFounder.should.to.be.false;
    founderBalance.toNumber().should.be.equal(0);
  });

  it('allocate not from owner ', async function() {
    const amount = 130000 * (10**8);
    const founder = accounts[1];

    await expectThrow(this.token.allocate(founder, amount, 1, {from: accounts[4]}), "StatusError");

    const allocatedForFounder = await this.token.founders.call(founder);
    const founderBalance = await this.token.balanceOf.call(founder);

    allocatedForFounder.should.to.be.false;
    founderBalance.toNumber().should.be.equal(0);
  });
});
