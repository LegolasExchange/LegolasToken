import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration, snapshot, revert } from './helpers/increaseTime';
import expectThrow from './helpers/expectThrow';

require('lodash');
require('chai')
  .use(require('chai-as-promised'))
  .should();

const Legolas = artifacts.require('Legolas')

/// @notice Expensive. TODO: determine gas price for x holders
/// @param _bonusDate Date of the bonus to distribute.
/// @return Whether the bonus distribution was successful or not
//
// bonusNotDistributed[1534291200] = true; // Wed, 15 Aug 2018 00:00:00 +0000
// bonusNotDistributed[1550188800] = true; // Fri, 15 Feb 2019 00:00:00 +0000
// bonusNotDistributed[1565827200] = true; // Thu, 15 Aug 2019 00:00:00 +0000
// bonusNotDistributed[1581724800] = true; // Sat, 15 Feb 2020 00:00:00 +0000
contract('Legolas@distributeHolderBonus', function(accounts) {
  beforeEach(async function() {
    this.token = await Legolas.new();
    this.bonusDates = [
      1534291200,
      1550188800,
      1565827200,
      1581724800
    ];
    this.BONUS_AMOUNT = 35000000 * (10**8);

    var accountsID = Array.from(Array(6).keys());
    accountsID.shift();

    this.HOLDERS = accountsID.map(i => accounts[i]);
    this.ORIGINAL_BALANCES = accountsID.map(x => 1000 * (10**8));
    this.ORIGINAL_UNSPENT = 1000 * accountsID.length * (10**8);


    this.BONUS_COEF = 1 + Math.round(Math.round(this.BONUS_AMOUNT / 4) / this.ORIGINAL_UNSPENT);

    await Promise.all(this.HOLDERS.map(async (holder, i) =>
      await this.token.allocate(holder, this.ORIGINAL_BALANCES[i], 2)));

    // this.snapshotResult = await snapshot();
  });

  // afterEach(async function() {
  //   await revert(this.snapshotResult.result);
  // });


  it('disrtibute bonus on the first date', async function() {

    await increaseTimeTo(this.bonusDates[0] + 1);
    await this.token.distributeHolderBonus(this.bonusDates[0]);

    const updatedBalances = await Promise.all(this.HOLDERS.map(async holder =>
        await this.token.balanceOf.call(holder)));

    updatedBalances.map((balance, i) =>
      balance.toNumber().should.be.equal(this.ORIGINAL_BALANCES[i] * this.BONUS_COEF)
    );

  });

  //3 -> 44490
  //6 -> 91368

  // it('disrtibute bonus on the invalid date', async function() {
  //
  //   await expectThrow(this.token.distributeHolderBonus(this.bonusDates[1]), "StatusError");
  //
  //   const updatedBalances = await Promise.all(this.HOLDERS.map(async holder =>
  //       await this.token.balanceOf.call(holder)));
  //
  //   updatedBalances.map((balance, i) =>
  //       balance.toNumber().should.be.equal(this.ORIGINAL_BALANCES[i])
  //   );
  // });
  //
  // it('disrtibute bonus not from owner', async function() {
  //
  //   await increaseTimeTo(this.bonusDates[1] + 1);
  //
  //   this.token.distributeHolderBonus(this.bonusDates[1], {from: accounts[5]});
  //
  //   const updatedBalances = await Promise.all(this.HOLDERS.map(async holder =>
  //       await this.token.balanceOf.call(holder)));
  //
  //   updatedBalances.map((balance, i) =>
  //     balance.toNumber().should.be.equal(this.ORIGINAL_BALANCES[i] * this.BONUS_COEF)
  //   );
  // });
  //
  // it('double disrtibute bonus on the second date', async function() {
  //
  //   await increaseTimeTo(this.bonusDates[2] + 1);
  //
  //   await this.token.distributeHolderBonus(this.bonusDates[2]);
  //
  //   const updatedBalances = await Promise.all(this.HOLDERS.map(async holder =>
  //       await this.token.balanceOf.call(holder)));
  //
  //   updatedBalances.map((balance, i) =>
  //     balance.toNumber().should.be.equal(this.ORIGINAL_BALANCES[i] * this.BONUS_COEF)
  //   );
  //
  //   await expectThrow(this.token.distributeHolderBonus(this.bonusDates[2]), "StatusError");
  //
  //   const finalBalances = await Promise.all(this.HOLDERS.map(async holder =>
  //       await this.token.balanceOf.call(holder)))
  //
  //   finalBalances.map((balance, i) =>
  //     balance.toNumber().should.be.equal(updatedBalances[i].toNumber())
  //   );
  //
  // });

});
