# LegolasToken

ERC20 contract for Legolas Token.

Based on https://github.com/ConsenSys/Tokens/tree/master/contracts/eip20

## Features added to standard ERC20

### Lock-Up

The LGO Tokens attributed to the founders, advisors of the ICO will be blocked in the following conditions so that they will not be in a position to use or exchange their LGO Tokens just following the end of the ICO.

Founders: blocked 1 year, then released the second year, 1/12 per month.
Advisors: progressively released during 1 year, 1/12 per month.

### LGO 2-Year Holding Bonus

Every 6 months during 2 years (4 times), 5% of additional LGO Tokens will be distributed, proportionally, only to the Users whose LGO Tokens bought in the pre-sale will never have been moved from their initial address.

## Test coverage

### Prepare environment:

1. Download and install [Ganache](http://truffleframework.com/docs/ganache/using) (GUI version strictly)
2. Install truffle `npm install truffle -g`
3. Run Ganache
4. Clone this repo and `npm install`

### Usage

Important! Please run tests separately. Like

`truffle test --network ganache test/distributeHolderBonus.test.js`

This is because a lot of test cases included business logic tightly connected with time in future. We can increase time in blockchain by `evm_increaseTime`, but cannot decrease. So please restart Ganache before test running (until the run test script is ready).
