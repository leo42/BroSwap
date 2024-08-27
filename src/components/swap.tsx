import React, { useState, useEffect } from 'react';
import './swap.css'; // Import the CSS file
import supportedTokens from './supportedTokens.json'; // Import the token list
import WalletPicker from './WalletPicker';
import "./WalletPicker.css";
import { formatDisplay } from './utils/formatters'; // Add this import
import {Lucid , WalletApi} from 'lucid-cardano';
import SwapIcon from './SwapIcon';

interface Token {
  name: string;
  icon: string;
  fullName: string;
  policy?: string;
  hexName?: string;
  decimals: number;
}

const Swap = () => {
  const [sellAmount, setSellAmount] = useState<number | null>(null);
  const [buyAmount, setBuyAmount] = useState<number | null>(null);
  const [sellCurrency, setSellCurrency] = useState<Token>({ 
    name: 'ADA', 
    icon: '🔷', 
    fullName: 'Cardano',
    policy: '',
    hexName: '',
    decimals: 6
  });
  const [buyCurrency, setBuyCurrency] = useState<Token>(    {
    "name": "HOSKY",
    "policy": "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235",
    "fullName": "HOSKY Token",
    "icon": "🐶",
    "hexName": "484f534b59",
    "decimals": 0
},);
  const [isModalOpen, setIsModalOpen] = useState<'sell' | 'buy' | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [tokenList, setTokenList] = useState(supportedTokens);
  const [wallet, setWallet] = useState<string | undefined>(undefined);
  const [walletApi, setWalletApi] = useState<WalletApi | undefined>(undefined);
  const [sellBalance, setSellBalance] = useState<number | null>(null);
  const [buyBalance, setBuyBalance] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [slippage, setSlippage] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [customSlippage, setCustomSlippage] = useState<string>('');

  useEffect(() => {
    if (walletApi && sellCurrency) {
      const fetchBalance = async () => {
        try {
          const walletCips = window.cardano[wallet].supportedExtensions;
          const walletApiInstance = await window.cardano[wallet].enable(walletCips);
          const hexEncodedBalance = await walletApi.getBalance();
          console.log('Hex encoded CBOR balance:', hexEncodedBalance);
          const lucid = await Lucid.new(undefined, 'Mainnet');
          lucid.selectWallet(walletApiInstance);
          console.log(await lucid.wallet.address());

          
          const utxos = await lucid.wallet.getUtxos();
          console.log(utxos); 
          let balance = 0n;
          for (const utxo of utxos) {
            if(sellCurrency.policy === '' && sellCurrency.hexName === ''){
              balance += utxo.assets['lovelace'];
            }else{
              balance += utxo.assets[sellCurrency.policy+sellCurrency.hexName] ? utxo.assets[sellCurrency.policy+sellCurrency.hexName] : 0n;
            }
          }
          setSellBalance(Number(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
          setSellBalance(null);
        }
      };

      fetchBalance();
    }
  }, [walletApi, sellCurrency, wallet]); // Added 'wallet' to the dependency array

  useEffect(() => {
    if (walletApi && buyCurrency) {
      const fetchBalance = async () => {
        try {
          const walletCips = window.cardano[wallet].supportedExtensions;
          const walletApiInstance = await window.cardano[wallet].enable(walletCips);
          const hexEncodedBalance = await walletApi.getBalance();
          console.log('Hex encoded CBOR balance:', hexEncodedBalance);
          const lucid = await Lucid.new(undefined, 'Mainnet');
          lucid.selectWallet(walletApiInstance);
          console.log(await lucid.wallet.address());

          const utxos = await lucid.wallet.getUtxos();
          console.log(utxos); 
          let balance = 0n;
          for (const utxo of utxos) {
            if(buyCurrency.policy === '' && buyCurrency.hexName === ''){
              balance += utxo.assets['lovelace'];
            }else{
              balance += utxo.assets[buyCurrency.policy+buyCurrency.hexName] ? utxo.assets[buyCurrency.policy+buyCurrency.hexName] : 0n;
            }
          }
          setBuyBalance(Number(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBuyBalance(null);
        }
      };

      fetchBalance();
    }
  }, [walletApi, buyCurrency, wallet]); // Added 'wallet' to the dependency array

        
 
      

  const handleCurrencyChange = (newCurrency: Token, type: 'sell' | 'buy') => {
    const ADA: Token = { 
      name: 'ADA', 
      icon: '🔷', 
      fullName: 'Cardano',
      policy: '',
      hexName: '',
      decimals: 6
    };

    if (type === 'sell') {
      if (newCurrency.name === 'ADA') {
        // If selecting ADA on sell side, swap with buy side if it's also ADA
        if (buyCurrency.name === 'ADA') {
          setBuyCurrency(sellCurrency);
        }
        setSellCurrency(newCurrency);
      } else {
        // If selecting a token on sell side, set buy side to ADA
        setSellCurrency(newCurrency);
        setBuyCurrency(ADA);
      }
    } else { // type === 'buy'
      if (newCurrency.name === 'ADA') {
        // If selecting ADA on buy side, swap with sell side if it's also ADA
        if (sellCurrency.name === 'ADA') {
          setSellCurrency(buyCurrency);
        }
        setBuyCurrency(newCurrency);
      } else {
        // If selecting a token on buy side, set sell side to ADA
        setBuyCurrency(newCurrency);
        setSellCurrency(ADA);
      }
    }
    setIsModalOpen(null);
  };


  // useEffect(() => {
  //   const calculateSellAmount = async () => {
  //     if (buyAmount && buyCurrency && sellCurrency) {
  //       try {
  //         const queryParams = new URLSearchParams({
  //           amountOut: buyAmount.toString(),
  //           assetAPolicyId: buyCurrency.policy || '',
  //           assetATokenName: buyCurrency.hexName || '',
  //           assetBPolicyId: sellCurrency.policy || '',
  //           assetBTokenName: sellCurrency.hexName || ''
  //         });

  //         const response = await fetch(`http://localhost:3000/api/calculateIn?${queryParams}`, {
  //           method: 'GET',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },  
  //         });

  //         if (!response.ok) {
  //           throw new Error('Network response was not ok');
  //         }

  //         const data = await response.json();
  //         setSellAmount(Math.round(data.amountIn)); // Store as integer

  //       } catch (error) {
  //         console.error('Error calculating sell amount:', error);
  //         setSellAmount(null);
  //       }
  //     } else {
  //       setSellAmount(null);
  //     }
  //   };

  //   calculateSellAmount();
  // }, [buyAmount, buyCurrency, sellCurrency]);

    
    
    
  useEffect(() => {
    const calculateBuyAmount = async () => {
      if (sellAmount && sellCurrency && buyCurrency) {
        try {
          const queryParams = new URLSearchParams({
            amountIn: sellAmount.toString(),
            assetAPolicyId: sellCurrency.policy || '',
            assetATokenName: sellCurrency.hexName || '',
            assetBPolicyId: buyCurrency.policy || '',
            assetBTokenName: buyCurrency.hexName || '',
          });

          const response = await fetch(`http://localhost:3000/api/calculateOut?${queryParams}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();
          setBuyAmount(Math.round(data.amountOut)); // Store as integer
        } catch (error) {
          console.error('Error calculating buy amount:', error);
          setBuyAmount(null);
        }
      } else {
        setBuyAmount(null);
      }
    };

    calculateBuyAmount();
  }, [sellAmount, sellCurrency, buyCurrency]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  

  useEffect(() => {
    setTokenList(supportedTokens);
  }, [isModalOpen]);

  const filterTokenList = (search: string) => {
    const filteredTokens = supportedTokens.filter((token) =>
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.fullName.toLowerCase().includes(search.toLowerCase())
    );
    setTokenList(filteredTokens);
  };

  const swapCurrencies = () => {
    const tempCurrency = sellCurrency;
    setSellCurrency(buyCurrency);
    setBuyCurrency(tempCurrency);
    
    const tempAmount = sellAmount;
    setSellAmount(buyAmount);
    setBuyAmount(tempAmount);
  };

  const modal = () => {
    return (
      <div className="modal" onClick={() => setIsModalOpen(null)}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <h2>Select Currency</h2>
          <input
            type="text"
            placeholder="Search"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => filterTokenList(event.target.value)}
          />
          {tokenList.map((token) => (
            <button key={token.name} onClick={() => handleCurrencyChange(token, isModalOpen!)}>
              {token.icon} {token.name} - {token.fullName}
            </button>
          ))}
          <button onClick={() => setIsModalOpen(null)}>Close</button>
        </div>
      </div>
    );
  };

  const currencyInput = (type: 'sell' | 'buy') => {
    const amount = type === 'sell' ? sellAmount : buyAmount;
    const setAmount = type === 'sell' ? setSellAmount : setBuyAmount;
    const currency = type === 'sell' ? sellCurrency : buyCurrency;
    const balance =  type === 'sell' ? sellBalance : buyBalance;  

    
    return (
      <div className="currencyInput">
        <div className="inputLabel">{type === 'sell' ? 'You sell' : 'You buy'}</div>
        <div className="inputWrapper">
          <input
            type="text"
            placeholder="0"
            value={formatDisplay(amount, currency.decimals)}
            onChange={(event) => {
              
              const cleanedValue = event.target.value.replace(/,/g, '');
              const floatValue = parseFloat(cleanedValue);
              const intValue = Math.round(floatValue * Math.pow(10, currency.decimals));
              if (!isNaN(intValue)) {
                setAmount(intValue);
              }
              
            }}
          />
          <div onClick={() => setIsModalOpen(type)} className='currencyButton'>
            {currency.icon} {currency.name} ▼
          </div>
        </div>
        <div className="inputDetails">
          <span>{currency.fullName}</span>
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
                  setSellAmount(newAmount);
                }}
                />
              <span>{sellAmount !== null ? ((sellAmount / balance) * 100).toFixed(2) : '0'}%</span>
            </div>
          )}
          {balance !== null && <span>Balance: {formatDisplay(balance, currency.decimals)}</span>}
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
      console.log(walletApi);
    });
  };

  const disconnectWallet = () => {
    setWallet(undefined);
    setWalletApi(undefined);
  };

  const renderOrderTypeControls = () => {
    if (orderType === 'market') {
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
    if (orderType === 'limit') {
      return (
        <div className="limitPriceControl">
          <label>Limit Price:</label>
          <input
            type="number"
            placeholder="Enter limit price"
            value={limitPrice || ''}
            onChange={(e) => setLimitPrice(Number(e.target.value))}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="swapContainer">
      {wallet ? 
        <div className="walletPickerButton" onClick={disconnectWallet} style={{ display: 'flex', alignItems: 'center' }}>
          <img className="walletPickerImage" src={window.cardano[wallet].icon} alt={wallet} style={{ marginRight: '8px' }} />
          {wallet}
        </div> :
        <button className="walletPickerButton" onClick={() => setWalletModalOpen(true)}>Select Wallet</button>
      }
      
      <div className="orderTypeSelector">
        <button
          className={`orderTypeButton ${orderType === 'market' ? 'active' : ''}`}
          onClick={() => setOrderType('market')}
        >
          Market
        </button>
        <button
          className={`orderTypeButton ${orderType === 'limit' ? 'active' : ''}`}
          onClick={() => setOrderType('limit')}
        >
          Limit
        </button>
      </div>
      
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

      <button className="swapButton">Swap</button>

      {isModalOpen && modal()}
      {walletModalOpen && WalletPicker({ setOpenModal: setWalletModalOpen, operation: connectWallet })}
    </div>
  );
};

export default Swap;