const clevis = require("clevis")
const colors = require('colors')
const chai = require("chai")
const assert = chai.assert
const expect = chai.expect;
const should = chai.should();
const fs = require('fs')
const Web3 = require('web3')
const clevisConfig = JSON.parse(fs.readFileSync("clevis.json").toString().trim())
web3 = new Web3(new Web3.providers.HttpProvider(clevisConfig.provider))
function localContractAddress(contract){
  return fs.readFileSync(contract+"/"+contract+".address").toString().trim()
}
function printTxResult(result){
  console.log(tab,result.transactionHash.gray,(""+result.gasUsed).yellow)
}
function bigHeader(str){
  return "########### "+str+" "+Array(128-str.length).join("#")
}
function rand(min, max) {
  return Math.floor( Math.random() * (max - min) + min );
}
function loadAbi(contract){
  let abi = fs.readFileSync(contract+"/"+contract+".abi").toString().trim()
  fs.writeFileSync("app/src/"+contract+".abi.js","module.exports = "+abi);
}
const tab = "\t\t";


let COMMIT

module.exports = {
  compile:(contract)=>{
    describe('#compile() '+contract.magenta, function() {
      it('should compile '+contract.magenta+' contract to bytecode', async function() {
        this.timeout(90000)
        const result = await clevis("compile",contract)
        assert(Object.keys(result.contracts).length>0, "No compiled contacts found.")
        let count = 0
        for(let c in result.contracts){
          console.log("\t\t"+"contract "+c.blue+": ",result.contracts[c].bytecode.length)
          if(count++==0){
              assert(result.contracts[c].bytecode.length > 1, "No bytecode for contract "+c)
          }
        }
      });
    });
  },
  deploy:(contract,accountindex)=>{
    describe('#deploy() '+contract.magenta, function() {
      it('should deploy '+contract.magenta+' as account '+accountindex, async function() {
        this.timeout(360000)
        const result = await clevis("deploy",contract,accountindex)
        printTxResult(result)
        console.log(tab+"Address: "+result.contractAddress.blue)
        assert(result.contractAddress)
      });
    });
  },
  mint:(accountindex,image,toIndex)=>{
    describe('#testMint() ', function() {
      it('should mint a cryptog', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")
        const result = await clevis("contract","mint","Cryptogs",accountindex,web3.utils.fromAscii(image),accounts[toIndex])
        printTxResult(result)
        const tokensOfOwner = await clevis("contract","tokensOfOwner","Cryptogs",accounts[toIndex])
        const lastToken = tokensOfOwner[tokensOfOwner.length-1]
        const token = await clevis("contract","getToken","Cryptogs",lastToken)
        assert(token.owner==accounts[toIndex],"This should never be wrong!?!")
        const cleanImage = web3.utils.toAscii(token.image).replace(/[^a-zA-Z\d\s.]+/g,"")
        assert(cleanImage==image,"Image of minted token doesn't equal image we meant to mint.. hah.")
        console.log(tab,accounts[accountindex].blue+" minted Cryptog "+lastToken.magenta+" to account "+accounts[toIndex].cyan+" with image "+cleanImage.white)
      });
    });
  },
  airdrop:(accountindex,image,toAddress)=>{
    describe('#testMint() ', function() {
      it('should mint a cryptog', async function() {
        this.timeout(120000)
        const result = await clevis("contract","mint","Cryptogs",accountindex,web3.utils.fromAscii(image),toAddress)
        printTxResult(result)
      });
    });
  },
  submitStack:(accountindex)=>{
    describe('#submitStack() ', function() {
      it('should submit stack', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")
        const tokensOfOwner = await clevis("contract","tokensOfOwner","Cryptogs",accounts[accountindex])
        const token5 = tokensOfOwner[tokensOfOwner.length-1]
        const token4 = tokensOfOwner[tokensOfOwner.length-2]
        const token3 = tokensOfOwner[tokensOfOwner.length-3]
        const token2 = tokensOfOwner[tokensOfOwner.length-4]
        const token1 = tokensOfOwner[tokensOfOwner.length-5]
        const SlammerTimeAddress = localContractAddress("SlammerTime")
        const result = await clevis("contract","submitStack","Cryptogs",accountindex,SlammerTimeAddress,token1,token2,token3,token4,token5)
        printTxResult(result)
        const approveContract = await clevis("contract","tokenIndexToApproved","Cryptogs",token5)
        assert(approveContract == SlammerTimeAddress,"SlammerTime is NOT approved to move the token "+token5)
      });
    });
  },
  submitCounterStack:(accountindex)=>{
    describe('#submitCounterStack() ', function() {
      it('should submit counter stack', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")
        const tokensOfOwner = await clevis("contract","tokensOfOwner","Cryptogs",accounts[accountindex])
        const token5 = tokensOfOwner[tokensOfOwner.length-1]
        const token4 = tokensOfOwner[tokensOfOwner.length-2]
        const token3 = tokensOfOwner[tokensOfOwner.length-3]
        const token2 = tokensOfOwner[tokensOfOwner.length-4]
        const token1 = tokensOfOwner[tokensOfOwner.length-5]
        const SlammerTimeAddress = localContractAddress("SlammerTime")

        //we need to get the stack id for the last submit event
        ///÷clevis contract eventSubmitStack Cryptogs
        const SubmitStackEvents  = await clevis("contract","eventSubmitStack","Cryptogs")
        //console.log("SubmitStackEvents",SubmitStackEvents)
        const lastSubmitStackEvent = SubmitStackEvents[SubmitStackEvents.length-1]
        //console.log("lastSubmitStackEvent",lastSubmitStackEvent)
        const lastStackId = lastSubmitStackEvent.returnValues._stackid
        console.log(tab,"Last stack id:",lastStackId.cyan)

        const result = await clevis("contract","submitCounterStack","Cryptogs",accountindex,SlammerTimeAddress,lastStackId,token1,token2,token3,token4,token5)
        printTxResult(result)
        const approveContract = await clevis("contract","tokenIndexToApproved","Cryptogs",token5)
        assert(approveContract == SlammerTimeAddress,"SlammerTime is NOT approved to move the token "+token5)
      });
    });
  },
  acceptCounterStack:(accountindex)=>{
    describe('#acceptCounterStack() ', function() {
      it('should accept counter stack', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")
        const SlammerTimeAddress = localContractAddress("SlammerTime")

        const CounterStackEvents  = await clevis("contract","eventCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastCounterStackEvent = CounterStackEvents[CounterStackEvents.length-1]
        //console.log(lastCounterStackEvent)
        const lastStackId = lastCounterStackEvent.returnValues._stack
        console.log(tab,"Last stack id:",lastStackId.cyan)
        const lastCounterStackId = lastCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last counter stack id:",lastCounterStackId.cyan)

        const result = await clevis("contract","acceptCounterStack","Cryptogs",accountindex,SlammerTimeAddress,lastStackId,lastCounterStackId)
        printTxResult(result)
      });
    });
  },
  startCoinFlip:(accountindex)=>{
    describe('#startCoinFlip() ', function() {
      it('should start coin flip with commit', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")

        const AcceptCounterStackEvents  = await clevis("contract","eventAcceptCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastAcceptCounterStackEvent = AcceptCounterStackEvents[AcceptCounterStackEvents.length-1]
        //console.log(lastCounterStackEvent)
        const lastStackId = lastAcceptCounterStackEvent.returnValues._stack
        const lastCounterStackId = lastAcceptCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last stack id:",lastStackId.cyan)

        let web3 = new Web3()
        COMMIT = web3.utils.sha3(Math.random()+Date.now()+"CRYPTOGS4LIFE");
        console.log(tab,"Using Commit:",COMMIT.blue)
        let commitHash = web3.utils.sha3(COMMIT);
        console.log(tab,"Commit hash:",commitHash.magenta)

        const result = await clevis("contract","startCoinFlip","Cryptogs",accountindex,lastStackId,lastCounterStackId,commitHash)
        printTxResult(result)
      });
    });
  },
  endCoinFlip:(accountindex)=>{
    describe('#endCoinFlip() ', function() {
      it('should end coin flip with commit', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")

        const AcceptCounterStackEvents  = await clevis("contract","eventAcceptCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastAcceptCounterStackEvent = AcceptCounterStackEvents[AcceptCounterStackEvents.length-1]
        //console.log(lastCounterStackEvent)
        const lastStackId = lastAcceptCounterStackEvent.returnValues._stack
        const lastCounterStackId = lastAcceptCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last stack id:",lastStackId.cyan)


        const result = await clevis("contract","endCoinFlip","Cryptogs",accountindex,lastStackId,lastCounterStackId,COMMIT)
        printTxResult(result)

        const player1 = await clevis("contract","stackOwner","Cryptogs",lastStackId)
        console.log(tab,"player1",player1)
        const player2 = await clevis("contract","stackOwner","Cryptogs",lastCounterStackId)
        console.log(tab,"player2",player2)
        const lastActor = await clevis("contract","lastActor","Cryptogs",lastStackId)
        console.log(tab,"lastActor",lastActor)


      });
    });
  },
  raiseSlammer:(player1Index,player2Index)=>{
    describe('#raiseSlammer() ', function() {
      it('should raise slammer for next player', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")

        const AcceptCounterStackEvents  = await clevis("contract","eventAcceptCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastAcceptCounterStackEvent = AcceptCounterStackEvents[AcceptCounterStackEvents.length-1]
        //console.log(lastAcceptCounterStackEvent)
        const lastStackId = lastAcceptCounterStackEvent.returnValues._stack
        const lastCounterStackId = lastAcceptCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last stack id:",lastStackId.cyan)

        const mode = await clevis("contract","mode","Cryptogs",lastStackId)
        console.log(tab,"CURRENT MODE:",mode.green)
        if(mode==9){
          console.log("GAME OVER, SKIP")
        }else{
          const player1 = await clevis("contract","stackOwner","Cryptogs",lastStackId)
          console.log(tab,"player1",player1)
          const player2 = await clevis("contract","stackOwner","Cryptogs",lastCounterStackId)
          console.log(tab,"player2",player2)
          const lastActor = await clevis("contract","lastActor","Cryptogs",lastStackId)
          console.log(tab,"lastActor",lastActor)
          let web3 = new Web3()
          COMMIT = web3.utils.sha3(Math.random()+Date.now()+"CRYPTOGS4LIFE");
          console.log(tab,"Using Commit:",COMMIT.blue)
          let commitHash = web3.utils.sha3(COMMIT);
          console.log(tab,"Commit hash:",commitHash.magenta)


          let accountindex
          if(player1==lastActor){
            console.log(tab,"it's player 2's turn...".white)
            //it's player 2's turn
            accountindex = player2Index
          }else{
            console.log(tab,"it's player 1's turn...".white)
            //it's player 1's turn
            accountindex = player1Index
          }
          console.log(tab,accountindex,lastStackId,lastCounterStackId,commitHash)
          const result = await clevis("contract","raiseSlammer","Cryptogs",accountindex,lastStackId,lastCounterStackId,commitHash)
          printTxResult(result)
        }


      });
    });
  },
  throwSlammer:(player1Index,player2Index)=>{
    describe('#throwSlammer() ', function() {
      it('should throw slammer for current player', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")

        const AcceptCounterStackEvents  = await clevis("contract","eventAcceptCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastAcceptCounterStackEvent = AcceptCounterStackEvents[AcceptCounterStackEvents.length-1]
        //console.log(lastAcceptCounterStackEvent)
        const lastStackId = lastAcceptCounterStackEvent.returnValues._stack
        const lastCounterStackId = lastAcceptCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last stack id:",lastStackId.cyan)

        const mode = await clevis("contract","mode","Cryptogs",lastStackId)
        console.log(tab,"CURRENT MODE:",mode.green)
        if(mode==9){
          console.log("GAME OVER, SKIP")
        }else{
          const player1 = await clevis("contract","stackOwner","Cryptogs",lastStackId)
          console.log(tab,"player1",player1)
          const player2 = await clevis("contract","stackOwner","Cryptogs",lastCounterStackId)
          console.log(tab,"player2",player2)
          const lastActor = await clevis("contract","lastActor","Cryptogs",lastStackId)
          console.log(tab,"lastActor",lastActor)

          let accountindex
          if(player1==lastActor){
            console.log(tab,"it's player 2's turn...".white)
            //it's player 2's turn
            accountindex = player2Index
          }else{
            console.log(tab,"it's player 1's turn...".white)
            //it's player 1's turn
            accountindex = player1Index
          }
          console.log(tab,"THROW SLAMMER",accountindex,lastStackId,lastCounterStackId,COMMIT)

          //throwSlammer(bytes32 _stack, bytes32 _counterStack, bytes32 _reveal)
          const result = await clevis("contract","throwSlammer","Cryptogs",accountindex,lastStackId,lastCounterStackId,COMMIT)
          printTxResult(result)
        }
      });
    });
  },
  report:()=>{
    describe('#report() ', function() {
      it('should report the Flips from the last game', async function() {
        this.timeout(120000)
        const accounts = await clevis("accounts")

        const AcceptCounterStackEvents  = await clevis("contract","eventAcceptCounterStack","Cryptogs")
        //console.log(CounterStackEvents)
        const lastAcceptCounterStackEvent = AcceptCounterStackEvents[AcceptCounterStackEvents.length-1]
        //console.log(lastAcceptCounterStackEvent)
        const lastStackId = lastAcceptCounterStackEvent.returnValues._stack
        const lastCounterStackId = lastAcceptCounterStackEvent.returnValues._counterStack
        console.log(tab,"Last stack id:",lastStackId.cyan)

        const FlipEvents  = await clevis("contract","eventFlip","Cryptogs")
        for(let e in FlipEvents){
          if(FlipEvents[e].returnValues.stack==lastStackId){
            console.log(tab,"Cryptog ",(""+FlipEvents[e].returnValues.id).blue," was flipped by ",FlipEvents[e].returnValues.toWhom.cyan," at block ",(""+FlipEvents[e].returnValues.blockNumber).grey)
          }
        }

      });
    });
  },

  thisIsRad:(accountindex)=>{
    describe('#thisIsRad() ', function() {
      it('should call thisIsRad', async function() {
        this.timeout(120000)
        const result = await clevis("contract","thisIsRad","Cryptogs",accountindex,"http://cryptogs.io")
        printTxResult(result)

      });
    });
  },


  publish:()=>{
    describe('#publish() ', function() {
      it('should inject contract address and abi into web app', async function() {
        this.timeout(120000)
        const fs = require("fs")

        let address = fs.readFileSync("Cryptogs/Cryptogs.address").toString().trim()
        console.log(tab,"ADDRESS:",address.blue)
        assert(address,"No Address!?")
        fs.writeFileSync("app/src/cryptogs.address.js","module.exports = \""+address+"\"");

        let slammeraddress = fs.readFileSync("SlammerTime/SlammerTime.address").toString().trim()
        console.log(tab,"ADDRESS:",address.blue)
        assert(address,"No Address!?")
        fs.writeFileSync("app/src/slammertime.address.js","module.exports = \""+slammeraddress+"\"");

        let blockNumber = fs.readFileSync("Cryptogs/Cryptogs.blockNumber").toString().trim()
        console.log(tab,"blockNumber:",blockNumber.blue)
        assert(blockNumber,"No blockNumber!?")
        fs.writeFileSync("app/src/cryptogs.blockNumber.js","module.exports = \""+blockNumber+"\"");

        loadAbi("Cryptogs")
        loadAbi("SlammerTime")

      });
    });
  },
  redeploy:()=>{
    describe(bigHeader('DEPLOY'), function() {
      it('should deploy', async function() {
        this.timeout(6000000)
        const result = await clevis("test","deploy")
        assert(result==0,"deploy ERRORS")
      });
    });
    describe(bigHeader('TEST THIS IS RAD'), function() {
      it('should this is rad!', async function() {
        this.timeout(6000000)
        const result = await clevis("test","thisisrad")
        assert(result==0,"thisisrad ERRORS")
      });
    });
    describe(bigHeader('TEST MINTING'), function() {
      it('should mint, please work first try!', async function() {
        this.timeout(6000000)
        const result = await clevis("test","mint")
        assert(result==0,"mint ERRORS")
      });
    });
    describe(bigHeader('TEST SUBMITTING STACKS'), function() {
      it('should submit stacks', async function() {
        this.timeout(6000000)
        const result = await clevis("test","submitStacks")
        assert(result==0,"submitStacks ERRORS")
      });
    });
    describe(bigHeader('TEST COIN FLIP'), function() {
      it('should flip the coin', async function() {
        this.timeout(6000000)
        const result = await clevis("test","flipCoin")
        assert(result==0,"flipCoin ERRORS")
      });
    });
    describe(bigHeader('TEST SLAMMER THROW'), function() {
      it('should SLAMMA JIM JAM', async function() {
        this.timeout(6000000)
        const result = await clevis("test","throwSlammer")
        assert(result==0,"throwSlammer ERRORS")
      });
    });
    describe(bigHeader('PUBLISH'), function() {
      it('should publish conract address to app', async function() {
        this.timeout(6000000)
        const result = await clevis("test","publish")
        assert(result==0,"publish ERRORS")
      });
    });
  },
  full:()=>{
    describe(bigHeader('COMPILE'), function() {
      it('should compile', async function() {
        this.timeout(6000000)
        const result = await clevis("test","compile")
        assert(result==0,"compile ERRORS")
      });
    });
    describe('#redeploy()', function() {
      it('should redeploy', async function() {
        this.timeout(240000)
        module.exports.redeploy()
      });
    });
  },
}
