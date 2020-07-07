import {Contract, Wallet, providers} from 'ethers'
import {deployContract} from 'ethereum-waffle'
import {ContractJSON} from 'ethereum-waffle/dist/esm/ContractJSON'
import * as AddressConfig from '../../build/contracts/AddressConfig.json'
import * as Allocator from '../../build/contracts/Allocator.json'
import * as Dev from '../../build/contracts/Dev.json'
import * as Lockup from '../../build/contracts/Lockup.json'
import * as PropertyFactory from '../../build/contracts/PropertyFactory.json'
import * as VoteCounter from '../../build/contracts/VoteCounter.json'
import * as VoteCounterStorage from '../../build/contracts/VoteCounterStorage.json'
import * as VoteTimes from '../../build/contracts/VoteTimes.json'
import * as VoteTimesStorage from '../../build/contracts/VoteTimesStorage.json'
import * as PropertyGroup from '../../build/contracts/PropertyGroup.json'
import * as PolicyFactory from '../../build/contracts/PolicyFactory.json'
import * as PolicySet from '../../build/contracts/PolicySet.json'
import * as PolicyGroup from '../../build/contracts/PolicyGroup.json'
import * as MarketFactory from '../../build/contracts/MarketFactory.json'
import * as MarketGroup from '../../build/contracts/MarketGroup.json'
import * as MetricsFactory from '../../build/contracts/MetricsFactory.json'
import * as MetricsGroup from '../../build/contracts/MetricsGroup.json'
import * as Withdraw from '../../build/contracts/Withdraw.json'
import * as WithdrawStorage from '../../build/contracts/WithdrawStorage.json'
import * as Market from '../../build/contracts/Market.json'
import * as Property from '../../build/contracts/Property.json'
import * as Policy from '../../build/contracts/Policy.json'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class NonceProvider {
	private static readonly instance = new Map<string, Nonce>()
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	static getInstance(provider: providers.Web3Provider, address: string) {
		if (!NonceProvider.instance.has(address)) {
			NonceProvider.instance.set(address, Nonce.getInstance(provider, address))
		}

		return NonceProvider.instance.get(address)
	}
}

class Nonce {
	private static instance: Nonce
	private readonly _provider: providers.Web3Provider
	private readonly _address: string
	private _nonce: number
	private constructor(provider: providers.Web3Provider, address: string) {
		this._provider = provider
		this._address = address
		this._nonce = 0
	}

	static getInstance(provider: providers.Web3Provider, address: string): Nonce {
		if (!Nonce.instance) {
			Nonce.instance = new Nonce(provider, address)
		}

		return Nonce.instance
	}

	public async setNonce(): Promise<void> {
		this._nonce = await this._provider.getTransactionCount(this._address)
	}

	public getNonce(): number {
		return this._nonce++
	}
}

export class DevProtocolInstance {
	private readonly _provider: providers.Web3Provider
	private readonly _deployer: Wallet
	private readonly _policy: PolicyProvider
	private readonly _market: MarketProvider
	private readonly _property: PropertyProvider
	private readonly _nonce: Nonce
	private _addNonceToOption = false
	private _addressConfig!: Contract
	private _allocator!: Contract
	private _dev!: Contract
	private _lockup!: Contract
	private readonly _lockupStorage!: Contract
	private _propertyFactory!: Contract
	private _voteCounter!: Contract
	private _voteCounterStorage!: Contract
	private _voteTimes!: Contract
	private _voteTimesStorage!: Contract
	private _propertyGroup!: Contract
	private _policyFactory!: Contract
	private _policySet!: Contract
	private _policyGroup!: Contract
	private _marketFactory!: Contract
	private _marketGroup!: Contract
	private _metricsFactory!: Contract
	private _metricsGroup!: Contract
	private _withdraw!: Contract
	private _withdrawStorage!: Contract

	constructor(provider: providers.Web3Provider, wallet: Wallet) {
		this._provider = provider
		this._deployer = wallet
		this._policy = new PolicyProvider(this)
		this._market = new MarketProvider(this)
		this._property = new PropertyProvider(this)
		this._nonce = NonceProvider.getInstance(provider, wallet.address)!
	}

	public get provider(): providers.Web3Provider {
		return this._provider
	}

	public get deployer(): Wallet {
		return this._deployer
	}

	public get policy(): PolicyProvider {
		return this._policy
	}

	public get market(): MarketProvider {
		return this._market
	}

	public get property(): PropertyProvider {
		return this._property
	}

	public get addressConfig(): Contract {
		return this._addressConfig
	}

	public get allocator(): Contract {
		return this._allocator
	}

	public get dev(): Contract {
		return this._dev
	}

	public get lockup(): Contract {
		return this._lockup
	}

	public get propertyFactory(): Contract {
		return this._propertyFactory
	}

	public get voteCounter(): Contract {
		return this._voteCounter
	}

	public get voteCounterStorage(): Contract {
		return this._voteCounterStorage
	}

	public get voteTimes(): Contract {
		return this._voteTimes
	}

	public get voteTimesStorage(): Contract {
		return this._voteTimesStorage
	}

	public get propertyGroup(): Contract {
		return this._propertyGroup
	}

	public get policyFactory(): Contract {
		return this._policyFactory
	}

	public get policySet(): Contract {
		return this._policySet
	}

	public get policyGroup(): Contract {
		return this._policyGroup
	}

	public get marketFactory(): Contract {
		return this._marketFactory
	}

	public get marketGroup(): Contract {
		return this._marketGroup
	}

	public get metricsFactory(): Contract {
		return this._metricsFactory
	}

	public get metricsGroup(): Contract {
		return this._metricsGroup
	}

	public get withdraw(): Contract {
		return this._withdraw
	}

	public get withdrawStorage(): Contract {
		return this._withdrawStorage
	}

	public async startToAddNonceOption(): Promise<void> {
		await this._nonce.setNonce()
		this._addNonceToOption = true
	}

	public finishToAddNonceOption(): void {
		this._addNonceToOption = false
	}

	public async generateAddressConfig(): Promise<void> {
		this._addressConfig = await deployContract(this._deployer, AddressConfig)
	}

	public async generateAllocator(): Promise<void> {
		const func = async (): Promise<void> => {
			this._allocator = await deployContract(
				this._deployer,
				Allocator,
				[this._addressConfig.address],
				this.getTransactionOption()
			)

			await this._addressConfig.setAllocator(
				this._allocator.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateDev(): Promise<void> {
		const func = async (): Promise<void> => {
			this._dev = await deployContract(
				this._deployer,
				Dev,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setToken(
				this._dev.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateLockup(): Promise<void> {
		const func = async (): Promise<void> => {
			this._lockup = await deployContract(
				this._deployer,
				Lockup,
				[this._addressConfig.address],
				this.getTransactionOption(6000000)
			)
			await this._addressConfig.setLockup(
				this._lockup.address,
				this.getTransactionOption()
			)
			this._lockup.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generatePropertyFactory(): Promise<void> {
		const func = async (): Promise<void> => {
			this._propertyFactory = await deployContract(
				this._deployer,
				PropertyFactory,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setPropertyFactory(
				this._propertyFactory.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateVoteCounter(): Promise<void> {
		const func = async (): Promise<void> => {
			this._voteCounter = await deployContract(
				this._deployer,
				VoteCounter,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setVoteCounter(
				this._voteCounter.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateVoteCounterStorage(): Promise<void> {
		const func = async (): Promise<void> => {
			this._voteCounterStorage = await deployContract(
				this._deployer,
				VoteCounterStorage,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setVoteCounterStorage(
				this._voteCounterStorage.address,
				this.getTransactionOption()
			)
			await this._voteCounterStorage.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generateVoteTimes(): Promise<void> {
		const func = async (): Promise<void> => {
			this._voteTimes = await deployContract(
				this._deployer,
				VoteTimes,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setVoteTimes(
				this._voteTimes.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateVoteTimesStorage(): Promise<void> {
		const func = async (): Promise<void> => {
			this._voteTimesStorage = await deployContract(
				this._deployer,
				VoteTimesStorage,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setVoteTimesStorage(
				this._voteTimesStorage.address,
				this.getTransactionOption()
			)
			await this._voteTimesStorage.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generatePropertyGroup(): Promise<void> {
		const func = async (): Promise<void> => {
			this._propertyGroup = await deployContract(
				this._deployer,
				PropertyGroup,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setPropertyGroup(
				this._propertyGroup.address,
				this.getTransactionOption()
			)
			await this._propertyGroup.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generatePolicyFactory(): Promise<void> {
		const func = async (): Promise<void> => {
			this._policyFactory = await deployContract(
				this._deployer,
				PolicyFactory,
				[this._addressConfig.address],
				this.getTransactionOption(6000000)
			)
			await this._addressConfig.setPolicyFactory(
				this._policyFactory.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generatePolicySet(): Promise<void> {
		const func = async (): Promise<void> => {
			this._policySet = await deployContract(
				this._deployer,
				PolicySet,
				[this._addressConfig.address],
				this.getTransactionOption()
			)

			await this._addressConfig.setPolicySet(
				this._policySet.address,
				this.getTransactionOption()
			)
			await this._policySet.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generatePolicyGroup(): Promise<void> {
		const func = async (): Promise<void> => {
			this._policyGroup = await deployContract(
				this._deployer,
				PolicyGroup,
				[this._addressConfig.address],
				this.getTransactionOption()
			)

			await this._addressConfig.setPolicyGroup(
				this._policyGroup.address,
				this.getTransactionOption()
			)
			await this._policyGroup.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generateMarketFactory(): Promise<void> {
		const func = async (): Promise<void> => {
			this._marketFactory = await deployContract(
				this._deployer,
				MarketFactory,
				[this._addressConfig.address],
				this.getTransactionOption(5000000)
			)
			await this._addressConfig.setMarketFactory(
				this._marketFactory.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateMarketGroup(): Promise<void> {
		const func = async (): Promise<void> => {
			this._marketGroup = await deployContract(
				this._deployer,
				MarketGroup,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setMarketGroup(
				this._marketGroup.address,
				this.getTransactionOption()
			)
			await this._marketGroup.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generateMetricsFactory(): Promise<void> {
		const func = async (): Promise<void> => {
			this._metricsFactory = await deployContract(
				this._deployer,
				MetricsFactory,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setMetricsFactory(
				this._metricsFactory.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateMetricsGroup(): Promise<void> {
		const func = async (): Promise<void> => {
			this._metricsGroup = await deployContract(
				this._deployer,
				MetricsGroup,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setMetricsGroup(
				this._metricsGroup.address,
				this.getTransactionOption()
			)
			await this._metricsGroup.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	public async generateWithdraw(): Promise<void> {
		const func = async (): Promise<void> => {
			this._withdraw = await deployContract(
				this._deployer,
				Withdraw,
				[this._addressConfig.address],
				this.getTransactionOption()
			)
			await this._addressConfig.setWithdraw(
				this._withdraw.address,
				this.getTransactionOption()
			)
		}

		await this.retryNonceError(func)
	}

	public async generateWithdrawStorage(): Promise<void> {
		const func = async (): Promise<void> => {
			this._withdrawStorage = await deployContract(
				this._deployer,
				WithdrawStorage,
				[this._addressConfig.address],
				this.getTransactionOption(6000000)
			)
			await this._addressConfig.setWithdrawStorage(
				this._withdrawStorage.address,
				this.getTransactionOption()
			)
			await this._withdrawStorage.createStorage(this.getTransactionOption())
		}

		await this.retryNonceError(func)
	}

	private getTransactionOption(gasLimit = 0): Record<string, unknown> {
		let result = {gasLimit: 0, nonce: 0}
		if (gasLimit === 0) {
			delete result.gasLimit
		} else {
			result.gasLimit = gasLimit
		}

		if (this._addNonceToOption) {
			result.nonce = this._nonce.getNonce()
		} else {
			delete result.nonce
		}

		return result
	}

	private async retryNonceError(func: () => Promise<void>) {
		for (let i = 0; i < 3; i++) {
			try {
				// eslint-disable-next-line no-await-in-loop
				await func()
				return
			} catch (e) {
				if (e.name === 'TXRejectedError') {
					// eslint-disable-next-line no-await-in-loop
					await this.startToAddNonceOption()
					continue
				}

				throw e
			}
		}
	}
}

class PropertyProvider {
	private readonly _dev: DevProtocolInstance
	private readonly _properties: Map<string, Contract>
	constructor(dev: DevProtocolInstance) {
		this._dev = dev
		this._properties = new Map<string, Contract>()
	}

	public get properties(): Map<string, Contract> {
		return this._properties
	}

	public async create(
		name: string,
		symbol: string,
		author = ''
	): Promise<Contract> {
		const propertyAuthor = author === '' ? this._dev.deployer.address : author
		const tx = await this._dev.propertyFactory.create(
			name,
			symbol,
			propertyAuthor
		)
		const events = await getTransactionEvents(
			this._dev.provider,
			tx,
			this._dev.propertyFactory
		)
		const propertyAddress = events[events.length - 1].values._property
		const propertyInstance = new Contract(
			propertyAddress,
			Property.abi,
			this._dev.deployer
		)
		this._properties.set(propertyInstance.address, propertyInstance)
		return propertyInstance
	}

	public getByAddress(address: string): Contract | undefined {
		return this._properties.get(address)
	}

	public getOne(): Contract | undefined {
		// eslint-disable-next-line no-unreachable-loop
		for (let key of this._properties.keys()) {
			return this._properties.get(key)
		}
	}
}

class MarketProvider {
	private readonly _dev: DevProtocolInstance
	private readonly _markets: Map<string, Contract>
	constructor(dev: DevProtocolInstance) {
		this._dev = dev
		this._markets = new Map<string, Contract>()
	}

	public async create(contractJSON: ContractJSON): Promise<Contract> {
		const behavior = await deployContract(this._dev.deployer, contractJSON, [
			this._dev.addressConfig.address,
		])
		const tx = await this._dev.marketFactory.create(behavior.address)
		const events = await getTransactionEvents(
			this._dev.provider,
			tx,
			this._dev.marketFactory
		)
		const marketAddress = events[events.length - 1].values._market
		const marketInstance = new Contract(
			marketAddress,
			Market.abi,
			this._dev.deployer
		)
		this._markets.set(marketInstance.address, marketInstance)
		return marketInstance
	}

	public getByAddress(address: string): Contract | undefined {
		return this._markets.get(address)
	}
}

class PolicyProvider {
	private readonly _dev: DevProtocolInstance
	private readonly _policies: Map<string, Contract>
	constructor(dev: DevProtocolInstance) {
		this._dev = dev
		this._policies = new Map<string, Contract>()
	}

	public async create(contractJSON: ContractJSON): Promise<Contract> {
		const innerPolicyInstance = await deployContract(
			this._dev.deployer,
			contractJSON
		)
		const tx = await this._dev.policyFactory.create(innerPolicyInstance.address)
		const events = await getTransactionEvents(
			this._dev.provider,
			tx,
			this._dev.policyFactory
		)
		const policyAddress = events[events.length - 1].values._policy
		const policyInstance = new Contract(
			policyAddress,
			Policy.abi,
			this._dev.deployer
		)
		this._policies.set(policyInstance.address, policyInstance)
		return policyInstance
	}

	public getByAddress(address: string): Contract | undefined {
		return this._policies.get(address)
	}

	public getOne(): Contract | undefined {
		// eslint-disable-next-line no-unreachable-loop
		for (let key of this._policies.keys()) {
			return this._policies.get(key)
		}
	}
}

async function getTransactionEvents(
	provider: providers.Provider,
	tx: any,
	contract: Contract
) {
	await tx.wait()
	const receipt = await provider.getTransactionReceipt(tx.hash)
	const logs = receipt.logs ?? []
	return logs.map((log) => contract.interface.parseLog(log))
}
