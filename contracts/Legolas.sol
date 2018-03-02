pragma solidity ^0.4.18;

import "./EIP20.sol";


contract Legolas is EIP20 {

    // Standard ERC20 information
    string  constant NAME = "LGO Token Test";
    string  constant SYMBOL = "LGO";
    uint8   constant DECIMALS = 8;
    uint256 constant UNIT = 10**uint256(DECIMALS);

    uint256 constant onePercent = 181415052000000;

    // 5% for advisors
    uint256 constant ADVISORS_AMOUNT =   5 * onePercent;
    // 15% for founders
    uint256 constant FOUNDERS_AMOUNT =  15 * onePercent;
    // 60% sold in pre-sale
    uint256 constant HOLDERS_AMOUNT  =  60 * onePercent;
    // 20% reserve
    uint256 constant RESERVE_AMOUNT  =  20 * onePercent;
    // ADVISORS_AMOUNT + FOUNDERS_AMOUNT + HOLDERS_AMOUNT +RESERVE_AMOUNT
    uint256 constant INITIAL_AMOUNT  = 100 * onePercent;
    // 20% for holder bonus
    uint256 constant BONUS_AMOUNT    =  20 * onePercent;
    // amount already allocated to advisors
    uint256 public advisorsAllocatedAmount = 0;
    // amount already allocated to funders
    uint256 public foundersAllocatedAmount = 0;
    // amount already allocated to holders
    uint256 public holdersAllocatedAmount = 0;
    // list of all initial holders
    address[] initialHolders;
    // not distributed because the defaut value is false
    mapping (uint256 => mapping(address => bool)) bonusNotDistributed;

    event Allocate(address _address, uint256 _value);

    function Legolas() EIP20( // EIP20 constructor
        INITIAL_AMOUNT + BONUS_AMOUNT,
        NAME,
        DECIMALS,
        SYMBOL
    ) public {}

    /// @param _address The address of the recipient
    /// @param _amount Amount of the allocation
    /// @param _type Type of the recipient. 0 for advisor, 1 for founders.
    /// @return Whether the allocation was successful or not
    function allocate(address _address, uint256 _amount, uint8 _type) public onlyOwner returns (bool success) {
        // one allocations by address
        require(allocations[_address] == 0);

        if (_type == 0) { // advisor
            // check allocated amount
            require(advisorsAllocatedAmount + _amount <= ADVISORS_AMOUNT);
            // increase allocated amount
            advisorsAllocatedAmount += _amount;
            // mark address as advisor
            advisors[_address] = true;
        } else if (_type == 1) { // founder
            // check allocated amount
            require(foundersAllocatedAmount + _amount <= FOUNDERS_AMOUNT);
            // increase allocated amount
            foundersAllocatedAmount += _amount;
            // mark address as founder
            founders[_address] = true;
        } else {
            // check allocated amount
            require(holdersAllocatedAmount + _amount <= HOLDERS_AMOUNT + RESERVE_AMOUNT);
            // increase allocated amount
            holdersAllocatedAmount += _amount;
        }
        // set allocation
        allocations[_address] = _amount;
        initialAllocations[_address] = _amount;

        // increase balance
        balances[_address] += _amount;

        // update variables for bonus distribution
        for (uint8 i = 0; i < 4; i++) {
            // increase unspent amount
            unspentAmounts[BONUS_DATES[i]] += _amount;
            // initialize bonus eligibility
            eligibleForBonus[BONUS_DATES[i]][_address] = true;
            bonusNotDistributed[BONUS_DATES[i]][_address] = true;
        }

        // add to initial holders list
        initialHolders.push(_address);

        Allocate(_address, _amount);

        return true;
    }

    /// @param _address Holder address.
    /// @param _bonusDate Date of the bonus to distribute.
    /// @return Whether the bonus distribution was successful or not
    function claimBonus(address _address, uint256 _bonusDate) public returns (bool success) {
        /// bonus date must be past
        require(_bonusDate <= now);
        /// disrtibute bonus only once
        require(bonusNotDistributed[_bonusDate][_address]);
        /// disrtibute bonus only if eligible
        require(eligibleForBonus[_bonusDate][_address]);

        // calculate the bonus for one holded LGO
        uint256 bonusByLgo = (BONUS_AMOUNT / 4) / unspentAmounts[_bonusDate];

        // distribute the bonus
        uint256 holderBonus = initialAllocations[_address] * bonusByLgo;
        balances[_address] += holderBonus;
        allocations[_address] += holderBonus;

        // set bonus as distributed
        bonusNotDistributed[_bonusDate][_address] = false;
        return true;
    }
}
