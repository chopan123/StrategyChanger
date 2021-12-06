import {
  useWeb3React
} from "@web3-react/core"
import {
  injected
} from "../components/wallet/Connectors"
import {
  useState,
  useEffect
} from 'react'
import {
  getContract
} from "../utils"
import Web3 from 'web3'

export default function Home() {
  const {
    active,
    account,
    library,
    connector,
    activate,
    deactivate,
    chainId
  } = useWeb3React()
  const fromWei = Web3.utils.fromWei

  const [web3, setWeb3] = useState()
  const [qiAvaxBalance, setQiAvaxBalance] = useState("")
  const [yieldYakAaveBalance, setYieldYakAaveBalance] = useState("")
  const [avaxBalance, setAvaxBalance] = useState("")
  const [investingAmount, setInvestingAmount] = useState()
  const [qiAvaxContract, setQiAvaxContract] = useState()
  const [yieldYakAaveContract, setYieldYakAaveContract] = useState()
  const [currentTransaction, setCurrentTransaction] = useState()
  const [inputError, setInputError] = useState("")
  const [waitingForTx, setWaitingForTx] = useState("")
  const [installMetamask, setInstallMetamask] = useState(false)

  const gas = 1e6
  const gasPrice = Web3.utils.toWei("25", "gwei")

  function percent(base, percentage) {
    return base.mul(percentage).div(100)
  }

  async function depositAvaxOnBenqi(depositAmount) {
    if (account == undefined) return
    console.log("Contract: ", qiAvaxContract)
    setWaitingForTx("please confirm transaction on metamask")
    try {
      const mint = await qiAvaxContract.methods.mint().send({
        from: account,
        gasPrice: gasPrice,
        value: depositAmount,
        gas: gas
      })
      console.log("Mint:", mint)
      setCurrentTransaction(mint)

    } catch (e) {}
    setWaitingForTx("")
  }

  async function withdrawAvaxFromBenqi() {
    if (account == undefined || qiAvaxBalance == "") return
    setWaitingForTx("please confirm transaction on metamask")
    console.log("Contract: ", qiAvaxContract)
    const withdrawalAmount = qiAvaxBalance
    const withdrawalAmountAvax = await qiAvaxContract.methods.balanceOfUnderlying(account).call()
    console.log("WithrawalAmount in Avax:", Web3.utils.fromWei(withdrawalAmountAvax))
    try {
      const redeem = await qiAvaxContract.methods.redeem(qiAvaxBalance).send({
        from: account,
        gasPrice: gasPrice,
        gas: gas
      })
      console.log("Redeem:", redeem)
      setCurrentTransaction(redeem)
      return withdrawalAmountAvax
    } catch (e) {}
    setWaitingForTx("")
  }

  async function depositOnYieldYak(depositAmount) {
    if (account == undefined || avaxBalance == "") return
    console.log("pangolinRouter Contract: ", yieldYakAaveContract)
    setWaitingForTx("please confirm transaction on metamask")
    // const amount = web3.utils.toWei("0.01", "ether")
    try {
      const deposit = await yieldYakAaveContract.methods.deposit().send({
        from: account,
        gasPrice: gasPrice,
        gas: gas,
        value: depositAmount
      })
      console.log("Deposit:", deposit)
      setCurrentTransaction(deposit)
    } catch (e) {}
    setWaitingForTx("")

  }

  async function withdrawFromYieldYak() {
    if (account == undefined || avaxBalance == "" || yieldYakAaveBalance == "") return
    console.log("pangolinRouter Contract: ", yieldYakAaveContract)
    setWaitingForTx("please confirm transaction on metamask")

    const withdrawalAmount = yieldYakAaveBalance
    const withdrawalAmountAvax = await yieldYakAaveContract.methods.getDepositTokensForShares(withdrawalAmount).call()

    try {

      const deposit = await yieldYakAaveContract.methods.withdraw(yieldYakAaveBalance).send({
        from: account,
        gasPrice: gasPrice,
        gas: gas
      })
      console.log("Deposit:", deposit)
      setCurrentTransaction(deposit)
      return withdrawalAmountAvax
    } catch (e) {}
    setWaitingForTx("")
  }

  function handleAmountInput(event) {
    console.log("amount to be invested:", !isNaN(event.target.value))
    const amount = event.target.value
    if (amount == "" || isNaN(amount)) {
      setInputError("Invalid Number")
      return
    }
    setInputError("")
    setInvestingAmount(web3.utils.toWei(amount, "ether"))
  }

  async function connect() {
    try {
      await activate(injected)
    } catch (ex) {
      console.log(ex)
    }
  }

  async function disconnect() {
    try {
      deactivate()
    } catch (ex) {
      console.log(ex)
    }
  }

  // Getting yieldYakAaveContract contract Object
  useEffect(() => {
    if (chainId == undefined || web3 == undefined) return
    const addresses = require('../config/addresses.json')
    const yieldYakAaveAddress = addresses.filter(e => e.netId == chainId)[0].yieldYakAave.address
    const yieldYakAaveABI = require('../config/abi/AaveStrategyAvaxV1.json')
    setYieldYakAaveContract(new web3.eth.Contract(yieldYakAaveABI, yieldYakAaveAddress))
  }, [chainId, web3, currentTransaction])

  // Getting Benqi contract object
  useEffect(() => {
    if (chainId == undefined || web3 == undefined) return
    const addresses = require('../config/addresses.json')
    const qiAvaxAddress = addresses.filter(e => e.netId == chainId)[0].qiAvax.address
    const qiAvaxABI = require('../config/abi/qiAvax.json')
    setQiAvaxContract(new web3.eth.Contract(qiAvaxABI, qiAvaxAddress))
  }, [chainId, currentTransaction, web3])

  // Getting qiAvax balanceOf
  useEffect(() => {
    if (qiAvaxContract == undefined) return
    qiAvaxContract.methods.balanceOf(account).call().then(
      balance => {
        console.log(balance)
        setQiAvaxBalance(balance.toString())
      }
    )
  }, [qiAvaxContract, account, currentTransaction])
  // Avax Balance
  useEffect(() => {
    if (web3 == undefined || account == undefined) return
    web3.eth.getBalance(account.toString()).then(balance =>
      setAvaxBalance(balance))
  }, [web3, account, currentTransaction])

  // YY Balance
  useEffect(() => {
    if (web3 == undefined || account == undefined || yieldYakAaveContract == undefined) return
    yieldYakAaveContract.methods.balanceOf(account).call().then(balance => setYieldYakAaveBalance(balance))
  }, [web3, account, yieldYakAaveContract, currentTransaction])

  // Get the amount user will invest
  useEffect(() => {
    if (web3 == undefined || account == undefined || yieldYakAaveContract == undefined) return
    yieldYakAaveContract.methods.balanceOf(account).call().then(balance => setYieldYakAaveBalance(balance))
  }, [web3, account, yieldYakAaveContract, currentTransaction])


  useEffect(() => {
    try {
      setWeb3(new Web3(window.web3.currentProvider, null, {
        transactionConfirmationBlocks: 1
      }))
    } catch(e) {
      setInstallMetamask(true)
    }

  }, [])


  return ( <
    div className = "flex flex-col items-center justify-center" > {
      !active &&
      <
      button onClick = {
        connect
      }
      className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Connect to MetaMask < /button>
    }
    {installMetamask && (<a href="https://metamask.io/download" rel="noreferrer"> Install Metamask </a>)}
     <
    p > {
      active ? < span > < /span> : <span>Wallet not connected, please hit Connect button</span >
    } <
    /p> {
      active &&
        <
        button onClick = {
          disconnect
        }
      className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Disconnect < /button>
    } <
    form >
    <
    label >
    How much do you want to invest ?
      <
      input type = "text"
    name = "name"
    onChange = {
      handleAmountInput
    }
    /> <
    /label> {
      inputError
    } <
    /form> {
      (qiAvaxBalance == "" || qiAvaxBalance == "0") && ( <
        p >
        <
        button onClick = {
          () => depositAvaxOnBenqi(investingAmount)
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Conservative Strategy(Benqi) < /button> <
        span > 10 % APY < /span> <
        /p>
      )
    } {
      (qiAvaxBalance !== "" && qiAvaxBalance !== "0") && ( <
        p >
        <
        button onClick = {
          withdrawAvaxFromBenqi
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Withdraw Avax from Benqi < /button> <
        button onClick = {
          () => {
            withdrawAvaxFromBenqi().then(amount => {
              console.log("amount withdrawn: ", amount)
              depositOnYieldYak(amount)
            })

          }
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Change to Risky Strategy < /button> <
        /p>
      )
    } {
      (yieldYakAaveBalance == "" || yieldYakAaveBalance == "0") && ( <
        p >
        <
        button onClick = {
          () => depositOnYieldYak(investingAmount)
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Risky Strategy(YieldYak + Aave) < /button> <
        span > 20 % APY < /span> <
        /p>
      )
    } {
      (yieldYakAaveBalance !== "" && yieldYakAaveBalance !== "0") && ( <
        p >
        <
        button onClick = {
          withdrawFromYieldYak
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Withdraw Risky Strategy < /button> <
        button onClick = {
          () => {
            withdrawFromYieldYak().then(amount => {
              console.log("amount withdrawn: ", amount)
              depositAvaxOnBenqi(amount)
            })
          }
        }
        className = "py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800" > Change to Conservative Strategy < /button> <
        /p>
      )
    } {
      waitingForTx !== "" && ( <
        p > Waiting
        for transaction to be confirmed < /p>
      )
    } <
    /div>

  )
}
