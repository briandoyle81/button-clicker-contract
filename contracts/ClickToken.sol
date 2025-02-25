// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClickToken is ERC20, ERC20Pausable, Ownable {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    EnumerableMap.AddressToUintMap private scores;

    struct Score {
        address user;
        uint256 value;
    }

    constructor() ERC20("ClickToken", "CTK") Ownable(msg.sender) {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mintTo(address _to) public whenNotPaused {
        // @dev: A real game should have some sort of anti-bot mechanism
        _mint(_to, 1 ether);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) whenNotPaused {
        if (from != address(0)) {
            // @dev: Assuming something else will handle `from` not having tokens
            uint fromPrevScore = scores.get(from);
            scores.set(from, fromPrevScore - value);
        }

        uint toPrevScore = 0;

        if (scores.contains(to)) {
            toPrevScore = scores.get(to);
        }

        scores.set(to, toPrevScore + value);

        super._update(from, to, value);
    }

    function getScore(address _address) public view returns (uint256) {
        if (!scores.contains(_address)) {
            return 0;
        }
        return scores.get(_address);
    }

    // WARNING: This might break if this gets popular
    function getAllScores() public view returns (Score[] memory) {
        uint256 length = scores.length();
        Score[] memory allScores = new Score[](length);

        for (uint256 i = 0; i < length; i++) {
            (address user, uint256 value) = scores.at(i);
            allScores[i] = Score(user, value);
        }

        return allScores;
    }
}
