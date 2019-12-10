pragma solidity ^0.5.0;

import "./../../src/market/Market.sol";
import "./../../src/market/IMarket.sol";
import "./../../src/allocator/Allocator.sol";

contract MarketTest1 is IMarket {
	string public schema = "[]";
	address public market;
	address public allocator;

	function setMarket(address _market) public {
		market = _market;
	}

	function setAllocator(address _allocator) public {
		allocator = _allocator;
	}

	function authenticate(
		address _prop,
		string memory,
		string memory,
		string memory,
		string memory,
		// solium-disable-next-line no-trailing-whitespace
		string memory
	) public returns (bool) {
		Market(market).authenticatedCallback(_prop);
		return true;
	}

	function calculate(address _prop, uint256, uint256) public returns (bool) {
		Allocator(allocator).calculatedCallback(_prop, 100);
		return true;
	}
}