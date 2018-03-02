pragma solidity ^0.4.18;

import "./Ownable.sol";

contract LegolasBase is Ownable {

    mapping (address => uint256) public balances;

    // Initial amount received from the pre-sale (doesn't include bonus)
    mapping (address => uint256) public initialAllocations;
    // Initial amount received from the pre-sale (includes bonus)
    mapping (address => uint256) public allocations;
    // False if part of the allocated amount is spent
    mapping (uint256 => mapping(address => bool)) public eligibleForBonus;
    // unspent allocated amount by period
    mapping (uint256 => uint256) public unspentAmounts;
    // List of founders addresses
    mapping (address => bool) public founders;
    // List of advisors addresses
    mapping (address => bool) public advisors;

    // Release dates for adviors: one twelfth released each month.
    uint256[12] public ADVISORS_LOCK_DATES = [1521072000, 1523750400, 1526342400,
                                       1529020800, 1531612800, 1534291200,
                                       1536969600, 1539561600, 1542240000,
                                       1544832000, 1547510400, 1550188800];
    // Release dates for founders: After one year, one twelfth released each month.
    uint256[12] public FOUNDERS_LOCK_DATES = [1552608000, 1555286400, 1557878400,
                                       1560556800, 1563148800, 1565827200,
                                       1568505600, 1571097600, 1573776000,
                                       1576368000, 1579046400, 1581724800];

    // Bonus dates: each 6 months during 2 years
    uint256[4] public BONUS_DATES = [1534291200, 1550188800, 1565827200, 1581724800];

    /// @param _address The address from which the locked amount will be retrieved
    /// @return The amount locked for _address.
    function getLockedAmount(address _address) internal view returns (uint256 lockedAmount) {
        // Only founders and advisors have locks
        if (!advisors[_address] && !founders[_address]) return 0;
        // Determine release dates
        uint256[12] memory lockDates = advisors[_address] ? ADVISORS_LOCK_DATES : FOUNDERS_LOCK_DATES;
        // Determine how many twelfths are locked
        for (uint8 i = 11; i >= 0; i--) {
            if (now >= lockDates[i]) {
                return (allocations[_address] / 12) * (11 - i);
            }
        }
        return allocations[_address];
    }

    function updateBonusEligibity(address _from) internal {
        if (now < BONUS_DATES[3] &&
            initialAllocations[_from] > 0 &&
            balances[_from] < allocations[_from]) {
            for (uint8 i = 0; i < 4; i++) {
                if (now < BONUS_DATES[i] && eligibleForBonus[BONUS_DATES[i]][_from]) {
                    unspentAmounts[BONUS_DATES[i]] -= initialAllocations[_from];
                    eligibleForBonus[BONUS_DATES[i]][_from] = false;
                }
            }
        }
    }
}
