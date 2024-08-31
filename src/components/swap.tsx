import React, { useState, useEffect, useCallback } from 'react';
import './swap.css';
import WalletPicker from './WalletPicker';
import "./WalletPicker.css";
import { formatDisplay } from './utils/formatters';
import { Lucid, WalletApi as LucidWalletApi, TxComplete, C } from 'lucid-cardano';
import debounce from 'lodash/debounce';
import SwapIcon from './SwapIcon';
import TokenSelectModal from './TokenSelectModal';
import { TokenData } from './types';

//const backendUrl = 'https://swapapi.broclan.io';
const backendUrl = 'http://localhost:3000';
interface ExtendedWalletApi extends LucidWalletApi {
  cip106?: {
    getScript: () => Promise<string>;
    getScriptRequirements: () => Promise<object[]>;
    submitUnsignedTx: (tx: string) => Promise<string>;
  };
}




const ADA : TokenData = {
  "policyId": '',
  "ticker": "ADA",
  "hexName": "",
  "fullName" : "Cardano",
  "decimals": 6
}

const Swap = () => {
  const [sellAmount, setSellAmount] = useState<number | null>(null);
  const [buyAmount, setBuyAmount] = useState<number | null>(null);
  const [sellCurrency, setSellCurrency] = useState<TokenData>(ADA);
  
  const [buyCurrency, setBuyCurrency] = useState<TokenData>({"policyId":"a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235","hexName":"484f534b59","fullName":"HOSKY","ticker":"HOSKY","decimals":0});

  const [isModalOpen, setIsModalOpen] = useState<'sell' | 'buy' | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [walletApi, setWalletApi] = useState<ExtendedWalletApi | undefined>(undefined);
  // const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [slippage, setSlippage] = useState<number>(1);
  // const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  // const [currentMarketPrice, setCurrentMarketPrice] = useState<number | null>(null);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [activeInput, setActiveInput] = useState<'sell' | 'buy' | null>(null);




  // const fetchCurrentPrice = async () => {
  //   try {
  //     // Find the currency that is not ADA
  //     const nonAdaCurrency = sellCurrency.policyId === '' && sellCurrency.hexName === '' ? buyCurrency : sellCurrency;

  //     // Populate new constants with the policyId and hexName
  //     const nonAdaPolicyId = nonAdaCurrency.policyId;
  //     const nonAdaHexName =  nonAdaCurrency.hexName;
  //     const response = await fetch(`${backendUrl}/api/asset-price?policyId=${nonAdaPolicyId}&tokenName=${nonAdaHexName}`);
  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }
  //     const data = await response.json();
  //     setCurrentMarketPrice(data.price);
  //     setLimitPrice(data.price); // Set the limit price to the current market price initially
  //   } catch (error) {
  //     console.error('Error fetching current price:', error);
  //     setCurrentMarketPrice(null);
  //   }
  // };

  // const handleOrderTypeChange = (type: 'market' | 'limit') => {
  //   setOrderType(type);
  //   if (type === 'limit') {
  //     fetchCurrentPrice();
  //   }
  // };

  // const adjustLimitPrice = (adjustment: number) => {
  //   if (currentMarketPrice !== null ) {
  //     const newPrice = currentMarketPrice * (1 + adjustment);
  //     setLimitPrice(Number(newPrice));
  //   }
  // };






  const calculateAmount = useCallback(async () => {
    if (!activeInput || !sellCurrency || !buyCurrency) return;

    const amount = activeInput === 'sell' ? sellAmount : buyAmount;
    if (!amount) return;

    try {
      const queryParams = new URLSearchParams({
        [activeInput === 'sell' ? 'amountIn' : 'amountOut']: amount.toString(),
        assetAPolicyId: sellCurrency.policyId || '',
        assetATokenName: sellCurrency.hexName || '',
        assetBPolicyId: buyCurrency.policyId || '',
        assetBTokenName: buyCurrency.hexName || '',
      });

      const endpoint = activeInput === 'sell' ? 'calculateOut' : 'calculateIn';
      const response = await fetch(`${backendUrl}/api/${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (activeInput === 'sell') {
        setBuyAmount(Math.round(data.amountOut));
      } else {
        setSellAmount(Math.round(data.amountIn));
      }
    } catch (error) {
      console.error('Error calculating amount:', error);
      if (activeInput === 'sell') {
        setBuyAmount(null);
      } else {
        setSellAmount(null);
      }
    }
  }, [activeInput, sellAmount, buyAmount, sellCurrency, buyCurrency]);

  const debouncedCalculateAmount = useCallback(
    debounce(calculateAmount, 1000, { trailing: true }),
    [calculateAmount]
  );

  useEffect(() => {
    if (activeInput) {
      debouncedCalculateAmount();
    }
    return () => {
      debouncedCalculateAmount.cancel();
    };
  }, [sellAmount, buyAmount, sellCurrency, buyCurrency, activeInput, debouncedCalculateAmount]);

   
  const handleCurrencyChange = (newCurrency: TokenData, policy: string, type: 'sell' | 'buy') => {
    const newCurrencyInfo: TokenData = {
      ...newCurrency,
      policyId: policy
    };
  
    if (type === 'sell') {
      if (newCurrencyInfo.policyId === '') {
        // If selecting ADA on sell side, swap with buy side if it's also ADA
        if (buyCurrency.policyId === '') {
          setBuyCurrency(sellCurrency);
        }
        setSellCurrency(newCurrencyInfo);
      } else {
        // If selecting a token on sell side, set buy side to ADA
        setSellCurrency(newCurrencyInfo);
        setBuyCurrency(ADA);
      }
    } else { // type === 'buy'
      if (newCurrencyInfo.policyId === '') {
        // If selecting ADA on buy side, swap with sell side if it's also ADA
        if (sellCurrency.policyId === '') {
          setSellCurrency(buyCurrency);
        }
        setBuyCurrency(newCurrencyInfo);
      } else {
        // If selecting a token on buy side, set sell side to ADA
        setBuyCurrency(newCurrencyInfo);
        setSellCurrency(ADA);
      }
    }
    setIsModalOpen(null);
  };



  const swapCurrencies = () => {
    const tempCurrency = sellCurrency;
    setSellCurrency(buyCurrency);
    setBuyCurrency(tempCurrency);
    
    const tempAmount = sellAmount;
    setSellAmount(buyAmount);
    setBuyAmount(tempAmount);
    // Update market price and limit price when swapping currencies
    // if (orderType === 'limit' && currentMarketPrice !== null) {
    //   const newMarketPrice = 1 / currentMarketPrice;
    //   setCurrentMarketPrice(newMarketPrice);
    //   setLimitPrice(newMarketPrice);
    // }
  };

  const currencyInput = (type: 'sell' | 'buy') => {
    const amount = type === 'sell' ? sellAmount : buyAmount;
    const setAmount = type === 'sell' ? setSellAmount : setBuyAmount;
    const currency = type === 'sell' ? sellCurrency : buyCurrency;
    const currencyName = currency.policyId === '' ? 'lovelace' : currency.policyId + currency.hexName;
    const balance = userBalances[currencyName];
  
  
    return (
      <div className="currencyInput">
        <div className="inputLabel">{type === 'sell' ? 'You sell' : 'You buy'}</div>
        <div className="inputWrapper">
          <input
            type="text"
            placeholder="0"
            value={formatDisplay(amount, currency.decimals)}
            onChange={(event) => {
              setActiveInput(type);
              const cleanedValue = event.target.value.replace(/,/g, '');
              const floatValue = parseFloat(cleanedValue);
              const intValue = Math.round(floatValue * Math.pow(10, currency.decimals));
              if (!isNaN(intValue)) {
                setAmount(intValue);
              }
            }}
            onFocus={() => setActiveInput(type)}
          />
          <div onClick={() => setIsModalOpen(type)} className='currencyButton'>
            <img src={`${backendUrl}/assets/${currencyName}.png`} alt={currency.fullName} style={{width: '20px', height: '20px', marginRight: '5px'}} /> {currency.ticker} ▼
          </div>
        </div>
        <div className="inputDetails">
          <span>{currency.policyId === '' ? 'ADA' : currency.fullName}</span>
          {type === 'sell' && balance !== null && balance > 0 && (
            <div className="balanceSlider">
              <input
                type="range"
                min="0"
                max="100"
                value={sellAmount !== null ? (sellAmount / balance) * 100 : 0}
                onChange={(e) => {
                  const percentage = Number(e.target.value);
                  const newAmount = Math.floor((percentage / 100) * balance);
                  setAmount(newAmount);
                }}
                />
              <span>{sellAmount !== null ? ((sellAmount / balance) * 100).toFixed(2) : '0'}%</span>
            </div>
          )}
          {balance && <span>Balance: {formatDisplay(balance, currency.decimals)}</span>}
        </div>
      </div>
    );
  };

  const connectWallet = (wallet: string) => {
    console.log(wallet,  window.cardano[wallet]);
    const walletCips = window.cardano[wallet].supportedExtensions;
    
    window.cardano[wallet].enable(walletCips).then((api) => {
      setWallet(wallet);
      setWalletApi(api);
      getUserBalances(api);
      console.log(walletApi);
    });
  };

  

  const getUserBalances = async (walletApi) => {

    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWallet(walletApi);
    const utxos = await lucid.wallet.getUtxos();
    console.log(utxos); 
    const userBalances = utxos.reduce((acc, utxo) => {
      Object.entries(utxo.assets).forEach(([policyId, amount]) => {
        const key = policyId || 'lovelace';  // Use 'lovelace' for ADA
        acc[key] = (acc[key] || 0) + Number(amount);
      });
      return acc;
    }, {});
    setUserBalances(userBalances);
    console.log(userBalances);
  }

  const createSwap = async () => {

    if (!wallet || !walletApi) {
      console.warn('Wallet not connected');
      alert('Please connect your wallet before creating a swap.');
      return;
    }
    let script = null;
    let scriptRequirements = [];
    try {
      const lucid = await Lucid.new(undefined, 'Mainnet');
      lucid.selectWallet(walletApi);
      const address =await  lucid.wallet.address()
      const utxos = (await lucid.wallet.getUtxos()).map(utxo => ({
        ...utxo,
        assets: Object.fromEntries(
          Object.entries(utxo.assets).map(([key, value]) => [key, Number(value)])
        )
      }));

      if( wallet && walletApi?.cip106 ){
  
        
        script  = await walletApi.cip106.getScript();
        scriptRequirements = await walletApi.cip106.getScriptRequirements();
        }

      const response = await fetch(`${backendUrl}/api/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetInPolicyId: sellCurrency.policyId,
          assetInTokenName: sellCurrency.hexName,
          assetOutPolicyId: buyCurrency.policyId,
          assetOutTokenName: buyCurrency.hexName,
          utxos: utxos,
          amountIn: sellAmount?.toString() || '0',
          slippage: slippage.toString(),
          address: address,
          script,
          scriptRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create swap transaction');
      }

      const data = await response.json();
      console.log('Swap transaction created:', data);

      // Here you would ty
      const txCborBuffer = new Uint8Array(data.txCbor.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const transaction = new TxComplete(lucid, C.Transaction.from_bytes(txCborBuffer));
      if(walletApi.cip106){
        const txHash = await walletApi.cip106.submitUnsignedTx(data.txCbor);
        console.log('Transaction submitted:', txHash);
        
      }else{
        const signature = await walletApi.signTx(data.txCbor, false);
        const txSigned = await transaction.assemble([signature]).complete()
        const txHash = await walletApi.submitTx(txSigned.toString());
        console.log('Transaction submitted:', txHash);
      }
      alert('Swap transaction submitted successfully!');

    } catch (error) {
      console.error('Error creating swap:', error);
      alert('Error creating swap. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setWallet(undefined);
    setWalletApi(undefined);
  };

  const renderOrderTypeControls = () => {
    // if (orderType === 'market') 
    {
      return (
        <div className="slippageControl">
          <label>Slippage Tolerance:</label>
          <select 
            value={customSlippage ? 'custom' : slippage.toString()} 
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setCustomSlippage(slippage.toString());
              } else {
                setSlippage(Number(e.target.value));
                setCustomSlippage('');
              }
            }}
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1" selected>1%</option>
            <option value="3">3%</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="number"
            placeholder="Custom %"
            value={customSlippage}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 100) {
                setCustomSlippage(e.target.value);
                setSlippage(value);
              } else if (value > 100) {
                setCustomSlippage('100');
                setSlippage(100);
              } else if (value < 0 || e.target.value === '') {
                setCustomSlippage('');
                setSlippage(0);
              }
            }}
          />%
                </div>
      );
    }
    return null;
  };

  const renderLimitPriceControl = () => {
    // if (orderType === 'limit') {
    //   return (
    //     <div className="limitPriceControl">
    //       <label>Limit Price:</label>
    //       <input
    //         type="number"
    //         placeholder="Enter limit price"
    //         value={limitPrice?  Number(limitPrice).toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 40 }) : ''}
    //         onChange={(e) => {    setLimitPrice(Number(e.target.value))}}
    //       />
    //       <div className="priceAdjustButtons">
    //         <button onClick={() => adjustLimitPrice(-0.1)}>-10%</button>
    //         <button onClick={() => adjustLimitPrice(-0.05)}>-5%</button>
    //         <button onClick={() => adjustLimitPrice(-0.01)}>-1%</button>
    //         <button onClick={() => setLimitPrice(currentMarketPrice)}>Reset</button>
    //         <button onClick={() => adjustLimitPrice(0.01)}>+1%</button>
    //         <button onClick={() => adjustLimitPrice(0.05)}>+5%</button>
    //         <button onClick={() => adjustLimitPrice(0.1)}>+10%</button>
    //       </div>
    //     </div>
    //   );
    // }
    return null;
  };

  useEffect(() => {
    if (wallet && walletApi) {
      const intervalId = setInterval(() => {
        getUserBalances(walletApi);
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [wallet, walletApi]);

  return (
    <div className="swapContainer">
      {wallet ? 
        <div className="walletPickerButton" onClick={disconnectWallet} style={{ display: 'flex', alignItems: 'center' }}>
          <img className="walletPickerImage" src={window.cardano[wallet].icon} alt={wallet} style={{ marginRight: '8px' }} />
          {wallet}
        </div> :
        <button className="walletPickerButton" onClick={() => setWalletModalOpen(true)}>Select Wallet</button>
      }
      
      {/* <div className="orderTypeSelector">
        <button
          className={`orderTypeButton ${orderType === 'market' ? 'active' : ''}`}
          onClick={() => handleOrderTypeChange('market')}
        >
          Market
        </button>
        <button
          className={`orderTypeButton ${orderType === 'limit' ? 'active' : ''}`}
          onClick={() => handleOrderTypeChange('limit')}
        >
          Limit
        </button>
      </div> */}
      
      <div className="orderControls">
        {renderOrderTypeControls()}
        {renderLimitPriceControl()}
      </div>
      
      <div className="currencyInputsContainer">
        {currencyInput('sell')}
        <div className="swapIconWrapper" onClick={() => swapCurrencies()}>
          <SwapIcon className="swapIcon" />
        </div>
        {currencyInput('buy')}
      </div>

      <button className="swapButton" disabled={sellAmount === null || buyAmount === null || sellAmount === 0 || buyAmount === 0} onClick={() => createSwap()}>Swap</button>

      <TokenSelectModal
        isOpen={isModalOpen !== null}
        onClose={() => setIsModalOpen(null)}
        onSelectToken={(token, policy) => handleCurrencyChange(token , policy,  isModalOpen!)}
      />
      {walletModalOpen && WalletPicker({ setOpenModal: setWalletModalOpen, operation: connectWallet })}
    </div>
  );
};

export default Swap;
