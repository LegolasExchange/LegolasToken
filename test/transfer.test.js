import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';


require('chai')
  .use(require('chai-as-promised'))
  .should();

const Legolas = artifacts.require('Legolas');

// Release dates for adviors: one twelfth released each month.
// uint256[12] ADVISORS_LOCK_DATES = [1521072000, 1523750400, 1526342400,
//                                    1529020800, 1531612800, 1534291200,
//                                    1536969600, 1539561600, 1542240000,
//                                    1544832000, 1547510400, 1550188800];
// // Release dates for founders: After one year, one twelfth released each month.
// uint256[12] FOUNDERS_LOCK_DATES = [1552608000, 1555286400, 1557878400,
//                                    1560556800, 1563148800, 1565827200,
//                                    1568505600, 1571097600, 1573776000,
//                                    1576368000, 1579046400, 1581724800];

contract('Legolas@transfer', function(accounts) {
  beforeEach(async function() {
    this.token = await Legolas.new();

    this.advisors = [1,2,3].map(i => accounts[i]);
    this.founders = [4,5,6].map(i => accounts[i]);
    this.holders = [7,8,9].map(i => accounts[i]);
    this.amounts = [10000,20000,30004].map(a => a*(10**8));

    await Promise.all(this.advisors.map(async (advisor, i) =>
        await this.token.allocate(advisor, this.amounts[i], 0)));
    await Promise.all(this.founders.map(async (founder, i) =>
        await this.token.allocate(founder, this.amounts[i], 1)));
  });


  it('regular transfer', async function() {
    const transferAmount = 129999 * (10**8);
    const holder = this.holders[0];

    await this.token.transfer(holder, transferAmount);
    const balance = await this.token.balanceOf.call(holder);

    balance.toNumber().should.be.equal(transferAmount);
  });

  it('advisor transfers 1/12 unlocked amount', async function() {
    const advisor = this.advisors[0];
    const initialBalance = await this.token.balanceOf.call(advisor);
    const allocation = await this.token.allocations.call([advisor]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 0));
    const transferAmount = allocation.toNumber() - lockedAmount;

    await increaseTimeTo(Math.round(Date.now()/1000 + 20000) + duration.weeks(7));
    await this.token.transfer(this.advisors[1], transferAmount, {from: advisor});

    const expectedBalance = initialBalance.toNumber() - transferAmount;
    const finalBalance = await this.token.balanceOf.call(advisor);

    expectedBalance.should.be.equal(finalBalance.toNumber());
  });

  it('advisor transfers 2/12 locked amount', async function() {
    const advisor = this.advisors[1];
    const initialBalance = await this.token.balanceOf.call(advisor);
    const allocation = await this.token.allocations.call([advisor]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 1));
    const transferAmount = (allocation.toNumber() - lockedAmount) + 5000*(10**8);


    await this.token.transfer(this.advisors[2], transferAmount, {from: advisor});

    const expectedBalance = initialBalance.toNumber();
    const finalBalance = await this.token.balanceOf.call(advisor);

    expectedBalance.should.be.equal(finalBalance.toNumber());
  });

  it('advisor transfers 3/12 unlocked amount and loses bonuses', async function() {
    const advisor = this.advisors[2];
    const initialBalance = await this.token.balanceOf.call(advisor);
    const allocation = await this.token.allocations.call([advisor]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 2));
    const transferAmount = allocation.toNumber() - lockedAmount;

    await increaseTimeTo(Math.round(Date.now()/1000 + 200000) + duration.weeks(15));
    await this.token.transfer(this.advisors[1], transferAmount, {from: advisor});

    const expectedBalance = initialBalance.toNumber() - transferAmount;
    const finalBalance = await this.token.balanceOf.call(advisor);
    const eligibleForBonus = await this.token.eligibleForBonus.call(advisor);

    expectedBalance.should.be.equal(finalBalance.toNumber());
    eligibleForBonus.should.be.false;
  });

  it('founder transfers 4/12 unlocked amount', async function() {
    const founder = this.founders[0];
    const initialBalance = await this.token.balanceOf.call(founder);
    const allocation = await this.token.allocations.call([founder]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 3));
    const transferAmount = allocation.toNumber() - lockedAmount;

    await increaseTimeTo(Math.round(Date.now()/1000 + 20000) + duration.weeks(7+15+4) + duration.years(1));
    await this.token.transfer(this.advisors[1], transferAmount, {from: founder});

    const expectedBalance = initialBalance.toNumber() - transferAmount;
    const finalBalance = await this.token.balanceOf.call(founder);

    expectedBalance.should.be.equal(finalBalance.toNumber());
  });

  it('founder transfers 5/12 locked amount', async function() {
    const founder = this.founders[1];
    const initialBalance = await this.token.balanceOf.call(founder);
    const allocation = await this.token.allocations.call([founder]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 4));
    const transferAmount = (allocation.toNumber() - lockedAmount) + 5000*(10**8);

    await increaseTimeTo(Math.round(Date.now()/1000 + 20000) + duration.weeks(7+15+5) + duration.years(1));
    await this.token.transfer(this.founders[2], transferAmount, {from: founder});

    const expectedBalance = initialBalance.toNumber();
    const finalBalance = await this.token.balanceOf.call(founder);

    expectedBalance.should.be.equal(finalBalance.toNumber());
  });

  it('founder transfers 6/12 unlocked amount and loses bonuses', async function() {
    const founder = this.founders[2];
    const initialBalance = await this.token.balanceOf.call(founder);
    const allocation = await this.token.allocations.call([founder]);
    const lockedAmount = Math.round((allocation.toNumber() / 12) * (11 - 5));
    const transferAmount = allocation.toNumber() - lockedAmount;

    await increaseTimeTo(Math.round(Date.now()/1000 + 20000) + duration.weeks(7+15+4+4) + duration.years(1));
    await this.token.transfer(this.founders[1], transferAmount, {from: founder});

    const expectedBalance = initialBalance.toNumber() - transferAmount;
    const finalBalance = await this.token.balanceOf.call(founder);
    const eligibleForBonus = await this.token.eligibleForBonus.call(founder);

    expectedBalance.should.be.equal(finalBalance.toNumber());
    eligibleForBonus.should.be.false;
  });
});
