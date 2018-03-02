import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration, snapshot, revert } from './helpers/increaseTime';
import expectThrow from './helpers/expectThrow';

require('lodash');
require('chai')
  .use(require('chai-as-promised'))
  .should();

const Legolas = artifacts.require('Legolas')
const accountCount = 9;
const UNIT = (10**8);

contract('Legolas@claimBonus', function(accounts) {

  beforeEach(async function() {
    this.token = await Legolas.new();
    this.BONUS_DATES = [1534291200, 1550188800, 1565827200, 1581724800];
    this.BONUS_AMOUNT    =  20 * 181415052000000;

    const accountsID = (Array.from(Array(accountCount + 1).keys())).splice(1, accountCount);
    this.HOLDERS = accountsID.map(i => accounts[i]);

    this.BALANCES = {};
  });

  async function checkBalances(context) {
      for (var i = 1; i <= accountCount; i++) {
          const balance = await context.token.balanceOf.call(accounts[i]);
          console.log(i, context.BALANCES[i], balance.toNumber());
          context.BALANCES[i].should.be.equal(balance.toNumber());
      }
  }

  async function checkUnspentAmount(bonusDate, expectedUnspentAmount, context) {
      const unspentAmount = await context.token.unspentAmounts.call(bonusDate);
      console.log('unspentAmount', unspentAmount);
      unspentAmount.toNumber().should.be.equal(expectedUnspentAmount);
  }

  async function transfer(_from, _to, _amount, context) {
      await context.token.transfer(accounts[_to], _amount, {from: accounts[_from]});
      context.BALANCES[_from] -= _amount;
      context.BALANCES[_to] += _amount;
  }

  it('claim bonus on the first date', async function() {

      // allocations
      for (var i = 1; i <= accountCount; i++) {
          var userType = 0; // advisor
          if (i <= 5) userType = 2; // holder
          else if (i <= 7) userType = 1; // founder
          await this.token.allocate(accounts[i], 1000 * UNIT, userType);
          this.BALANCES[i] = 1000 * UNIT;
      }

      await checkBalances(this);
      for (var i = 0; i < 4; i++) {
          await checkUnspentAmount(this.BONUS_DATES[i], 9000 * UNIT, this);
      }

      // holder_5 sends 50 to holder_3
      await transfer(5, 3, 50 * UNIT, this);
      // holder_4 sends 100 to holder_5
      await transfer(4, 5, 100 * UNIT, this);
      // holder_3 sends 50 to holder_5
      await transfer(3, 5, 50 * UNIT, this);

      await checkBalances(this);
      for (var i = 0; i < 4; i++) {
          await checkUnspentAmount(this.BONUS_DATES[i], 7000 * UNIT, this);
      }

      // can't claim bonus before the time
      await expectThrow(this.token.claimBonus(accounts[1], this.BONUS_DATES[0]), "Error");

      // Time travel to first bonus date
      await increaseTimeTo(this.BONUS_DATES[0] + 1);

      const bonusByLgo1 = Math.trunc((this.BONUS_AMOUNT / 4) / (7000 * UNIT));

      // account 1 claims bonus
      await this.token.claimBonus(accounts[1], this.BONUS_DATES[0]);
      this.BALANCES[1] += bonusByLgo1 * 1000 * UNIT;
      // can't claim twice
      await expectThrow(this.token.claimBonus(accounts[1], this.BONUS_DATES[0]), "Error");

      // account 2 claims bonus
      await this.token.claimBonus(accounts[2], this.BONUS_DATES[0]);
      this.BALANCES[2] += bonusByLgo1 * 1000 * UNIT;
      // can't claim twice
      await expectThrow(this.token.claimBonus(accounts[2], this.BONUS_DATES[0]), "Error");

      // account 3 claims bonus
      await this.token.claimBonus(accounts[3], this.BONUS_DATES[0]);
      this.BALANCES[3] += bonusByLgo1 * 1000 * UNIT;
      // can't claim twice
      await expectThrow(this.token.claimBonus(accounts[3], this.BONUS_DATES[0]), "Error");

      // account 4 and 5 can't claim bonus
      await expectThrow(this.token.claimBonus(accounts[4], this.BONUS_DATES[0]), "Error");
      await expectThrow(this.token.claimBonus(accounts[5], this.BONUS_DATES[0]), "Error");

      await checkBalances(this);

      // holder_3 sends 1000 to holder_5
      await transfer(3, 5, 50, this);

      await checkBalances(this);
      await checkUnspentAmount(this.BONUS_DATES[0], 7000 * UNIT, this);
      for (var i = 1; i < 4; i++) {
          await checkUnspentAmount(this.BONUS_DATES[i], 6000 * UNIT, this);
      }

      // Time travel to second bonus date
      await increaseTimeTo(this.BONUS_DATES[1] + 1);

      const bonusByLgo2 = Math.trunc((this.BONUS_AMOUNT / 4) / (6000 * UNIT));

      // account 3, 4 and 5 can't claim bonus
      await this.token.claimBonus(accounts[1], this.BONUS_DATES[1]);
      this.BALANCES[1] += 1000 * UNIT * bonusByLgo2;
      await this.token.claimBonus(accounts[2], this.BONUS_DATES[1]);
      this.BALANCES[2] += 1000 * UNIT * bonusByLgo2;
      await expectThrow(this.token.claimBonus(accounts[3], this.BONUS_DATES[1]), "Error");
      await expectThrow(this.token.claimBonus(accounts[4], this.BONUS_DATES[1]), "Error");
      await expectThrow(this.token.claimBonus(accounts[5], this.BONUS_DATES[1]), "Error");

      await checkBalances(this);

      // holder_2 sends 1000 to holder_1
      await transfer(2, 1, 50, this);

      await checkBalances(this);
      await checkUnspentAmount(this.BONUS_DATES[0], 7000 * UNIT, this);
      await checkUnspentAmount(this.BONUS_DATES[1], 6000 * UNIT, this);
      for (var i = 2; i < 4; i++) {
          await checkUnspentAmount(this.BONUS_DATES[i], 5000 * UNIT, this);
      }

      // Time travel to third bonus date
      await increaseTimeTo(this.BONUS_DATES[2] + 1);

      // holder_1 sends evrything to holder_2
      await transfer(1, 2, this.BALANCES[1], this)

      const bonusByLgo3 = Math.trunc((this.BONUS_AMOUNT / 4) / (5000 * UNIT));

      // account 2, 3, 4 and 5 can't claim bonus
      await expectThrow(this.token.claimBonus(accounts[2], this.BONUS_DATES[2]), "Error");
      await expectThrow(this.token.claimBonus(accounts[3], this.BONUS_DATES[2]), "Error");
      await expectThrow(this.token.claimBonus(accounts[4], this.BONUS_DATES[2]), "Error");
      await expectThrow(this.token.claimBonus(accounts[5], this.BONUS_DATES[2]), "Error");

      await checkBalances(this);

      // Time travel to third bonus date
      await increaseTimeTo(this.BONUS_DATES[3] + 1);

      await this.token.claimBonus(accounts[1], this.BONUS_DATES[2]);
      this.BALANCES[1] += 1000 * UNIT * bonusByLgo3;

      await expectThrow(this.token.claimBonus(accounts[1], this.BONUS_DATES[3], {from: accounts[1]}), "Error");
      await expectThrow(this.token.claimBonus(accounts[2], this.BONUS_DATES[3], {from: accounts[1]}), "Error");
      await expectThrow(this.token.claimBonus(accounts[3], this.BONUS_DATES[3]), "Error");
      await expectThrow(this.token.claimBonus(accounts[4], this.BONUS_DATES[3]), "Error");
      await expectThrow(this.token.claimBonus(accounts[5], this.BONUS_DATES[3]), "Error");

      await this.token.claimBonus(accounts[6], this.BONUS_DATES[2]);
      this.BALANCES[6] += 1000 * UNIT * bonusByLgo3;

      await checkBalances(this);
  });


});
