const assert= require('assert');
const ganache = require('ganache-cli');
const Web3= require('web3');
const web3= new Web3(ganache.provider());
const {interface, bytecode}= require('../compile');

let accounts;
let lottery;

beforeEach(async() =>{
   accounts= await web3.eth.getAccounts();

   lottery= await new web3.eth.Contract(JSON.parse(interface))
   .deploy({data: bytecode})
   .send({from: accounts[0], gas: '1000000'});
});

describe('Lottery Contract', ()=>{
	it('Contract is deployed', () =>{
		assert.ok(lottery.options.address);
	});

	it('Allows 1 account to enter',async() => {
		await lottery.methods.enter().send({
			from:accounts[0],
			value:web3.utils.toWei('0.02', 'ether')
		});
		const players=await lottery.methods.getPlayers().call({
			from:accounts[0]
		});
		assert.equal(1, players.length);
		assert.equal(accounts[0], players[0]);
	});

	it('Allows multiple accounts to enter',async() =>{
		await lottery.methods.enter().send({
			from:accounts[0],
			value:web3.utils.toWei('0.02','ether')
		});
		await lottery.methods.enter().send({
			from:accounts[1],
			value:web3.utils.toWei('0.02','ether')
		});
		await lottery.methods.enter().send({
			from:accounts[2],
			value:web3.utils.toWei('0.02','ether')
		});
		const players=await lottery.methods.getPlayers().call({
			from:accounts[0]
		});
		assert.equal(3, players.length);
		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);

	});

	it('Minimum amount should be entered to enter the lottery', async() =>{
		try{
			await lottery.methods.enter().send({
				from: accounts[0],
				value: '10'
			});
			assert(false);
	    }catch(err){
	    	assert(err);
	    }
	});

	it('Only manager can pickWinner', async() =>{
		try{
			await lottery.methods.pickWinner().send({
				from:accounts[1]
			});
            assert(false);
		}catch(err){
			assert(err);
		}
	});

	it('Send money to winner and players array is reset', async() =>{
		await lottery.methods.enter().send({
			from:accounts[0],
			value: web3.utils.toWei('2', 'ether')
		});

		const initialBalance=await web3.eth.getBalance(accounts[0]);

		await lottery.methods.pickWinner().send({
			from:accounts[0]
		});

		const finalBalance= await web3.eth.getBalance(accounts[0]);

		const difference= finalBalance- initialBalance;

		assert(difference>web3.utils.toWei('0.18','ether'));
		const playerArray= await lottery.methods.getPlayers().call;

		assert.equal(0,playerArray.length);

	});
});