import React, { useState, useEffect } from 'react';
import './swap.css'; // Import the CSS file
import supportedTokens from './supportedTokens.json'; // Import the token list
import WalletPicker from './WalletPicker';
import "./WalletPicker.css";
import { formatDisplay } from './utils/formatters'; // Add this import
import {Lucid , WalletApi} from 'lucid-cardano';

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

        
 
      

  const handleCurrencyChange = (newCurrency, type: 'sell' | 'buy') => {
    if (type === 'sell') {
      setSellCurrency(newCurrency);
    } else {
      setBuyCurrency(newCurrency);
    }
    setIsModalOpen(null);
  };

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
    const temp = sellCurrency;
    setSellCurrency(buyCurrency);
    setBuyCurrency(temp);
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

  return (
    <div className="swapContainer">
      {wallet ? 
        <div className="walletPickerButton" onClick={disconnectWallet} style={{ display: 'flex', alignItems: 'center' }}>
          <img className="walletPickerImage" src={window.cardano[wallet].icon} alt={wallet} style={{ marginRight: '8px' }} />
          {wallet}
        </div> :
        <button className="walletPickerButton" onClick={() => setWalletModalOpen(true)}>Select Wallet</button>
      }
     '25% 50% MAX' 
      {currencyInput('sell')}
      <div className="swapArrow" onClick={() => swapCurrencies()}>↓</div>
      {currencyInput('buy')}

      <button className="swapButton">Swap</button>

      {isModalOpen && modal()}
      {walletModalOpen && WalletPicker({ setOpenModal: setWalletModalOpen, operation: connectWallet })}
    </div>
  );
};

export default Swap;