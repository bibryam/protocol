pragma solidity ^0.5.0;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {UsingConfig} from "contracts/src/common/config/UsingConfig.sol";
import {UsingValidator} from "contracts/src/common/validate/UsingValidator.sol";
import {VoteCounterStorage} from "contracts/src/vote/VoteCounterStorage.sol";
import {IPolicy} from "contracts/src/policy/IPolicy.sol";
import {ILockup} from "contracts/src/lockup/ILockup.sol";
import {IMarket} from "contracts/src/market/IMarket.sol";
import {IVoteCounter} from "contracts/src/vote/IVoteCounter.sol";
import {IPolicySet} from "contracts/src/policy/IPolicySet.sol";
import {IPolicyFactory} from "contracts/src/policy/IPolicyFactory.sol";

contract VoteCounter is
	IVoteCounter,
	UsingConfig,
	UsingValidator,
	VoteCounterStorage
{
	using SafeMath for uint256;

	// solium-disable-next-line no-empty-blocks
	constructor(address _config) public UsingConfig(_config) {}

	function voteMarket(
		address _market,
		address _property,
		bool _agree
	) external {
		addressValidator().validateGroup(_market, config().marketGroup());
		IMarket market = IMarket(_market);
		require(market.enabled() == false, "market is already enabled");
		require(
			block.number <= market.votingEndBlockNumber(),
			"voting deadline is over"
		);
		uint256 count = ILockup(config().lockup()).getValue(
			_property,
			msg.sender
		);
		require(count != 0, "vote count is 0");
		bool alreadyVote = getStorageAlreadyVoteMarket(
			msg.sender,
			_market,
			_property
		);
		require(alreadyVote == false, "already vote");
		vote(_market, count, _agree);
		setStorageAlreadyVoteMarket(msg.sender, _market, _property);
		bool result = IPolicy(config().policy()).marketApproval(
			getStorageAgreeCount(_market),
			getStorageOppositeCount(_market)
		);
		if (result == false) {
			return;
		}
		market.toEnable();
	}

	function isAlreadyVoteMarket(address _target, address _property)
		external
		view
		returns (bool)
	{
		return getStorageAlreadyVoteMarket(msg.sender, _target, _property);
	}

	function votePolicy(
		address _policy,
		address _property,
		bool _agree
	) external {
		addressValidator().validateGroup(_policy, config().policyGroup());
		require(config().policy() != _policy, "this policy is current");
		IPolicySet policySet = IPolicySet(config().policySet());
		require(policySet.voting(_policy), "voting deadline is over");

		uint256 votingGroupIndex = policySet.getVotingGroupIndex();
		bool alreadyVote = getStorageAlreadyUseProperty(
			msg.sender,
			_property,
			votingGroupIndex
		);
		require(alreadyVote == false, "already use property");
		alreadyVote = getStorageAlreadyVotePolicy(
			msg.sender,
			_policy,
			votingGroupIndex
		);
		require(alreadyVote == false, "already vote policy");

		uint256 count = ILockup(config().lockup()).getValue(
			_property,
			msg.sender
		);
		require(count != 0, "vote count is 0");
		vote(_policy, count, _agree);
		setStorageAlreadyUseProperty(
			msg.sender,
			_property,
			votingGroupIndex,
			true
		);
		setStorageAlreadyVotePolicy(
			msg.sender,
			_policy,
			votingGroupIndex,
			true
		);
		setStoragePolicyVoteCount(msg.sender, _policy, _agree, count);
		bool result = IPolicy(config().policy()).policyApproval(
			getStorageAgreeCount(_policy),
			getStorageOppositeCount(_policy)
		);
		if (result == false) {
			return;
		}
		IPolicyFactory policyFactory = IPolicyFactory(config().policyFactory());
		policyFactory.convergePolicy(_policy);
	}

	function cancelVotePolicy(address _policy, address _property) external {
		IPolicySet policySet = IPolicySet(config().policySet());
		uint256 votingGroupIndex = policySet.getVotingGroupIndex();
		bool alreadyVote = getStorageAlreadyUseProperty(
			msg.sender,
			_property,
			votingGroupIndex
		);
		require(alreadyVote, "not use property");
		alreadyVote = getStorageAlreadyVotePolicy(
			msg.sender,
			_policy,
			votingGroupIndex
		);
		require(alreadyVote, "not vote policy");
		bool agree = true;
		uint256 count = getStoragePolicyVoteCount(msg.sender, _policy, agree);
		if (count == 0) {
			agree = false;
			count = getStoragePolicyVoteCount(msg.sender, _policy, agree);
			require(count != 0, "not vote policy");
		}
		cancelVote(_policy, count, agree);
		setStoragePolicyVoteCount(msg.sender, _policy, agree, 0);
		setStorageAlreadyUseProperty(
			msg.sender,
			_property,
			votingGroupIndex,
			false
		);
		setStorageAlreadyVotePolicy(
			msg.sender,
			_policy,
			votingGroupIndex,
			false
		);
	}

	function vote(
		address _target,
		uint256 count,
		bool _agree
	) private {
		if (_agree) {
			addAgreeCount(_target, count);
		} else {
			addOppositeCount(_target, count);
		}
	}

	function cancelVote(
		address _target,
		uint256 count,
		bool _agree
	) private {
		if (_agree) {
			subAgreeCount(_target, count);
		} else {
			subOppositeCount(_target, count);
		}
	}

	function addAgreeCount(address _target, uint256 _voteCount) private {
		uint256 agreeCount = getStorageAgreeCount(_target);
		agreeCount = agreeCount.add(_voteCount);
		setStorageAgreeCount(_target, agreeCount);
	}

	function addOppositeCount(address _target, uint256 _voteCount) private {
		uint256 oppositeCount = getStorageOppositeCount(_target);
		oppositeCount = oppositeCount.add(_voteCount);
		setStorageOppositeCount(_target, oppositeCount);
	}

	function subAgreeCount(address _target, uint256 _voteCount) private {
		uint256 agreeCount = getStorageAgreeCount(_target);
		agreeCount = agreeCount.sub(_voteCount);
		setStorageAgreeCount(_target, agreeCount);
	}

	function subOppositeCount(address _target, uint256 _voteCount) private {
		uint256 oppositeCount = getStorageOppositeCount(_target);
		oppositeCount = oppositeCount.sub(_voteCount);
		setStorageOppositeCount(_target, oppositeCount);
	}
}
