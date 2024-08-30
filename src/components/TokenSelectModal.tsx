import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TokenData } from './types'; // Assuming you have a types file
import { debounce } from 'lodash'; // You'll need to install lodash

const backendUrl = 'http://localhost:3000';

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenData, policyId: string) => void
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customToken, setCustomToken] = useState<TokenData>({
    policyId: '',
    hexName: '',
    ticker: '',
    fullName: '',
    decimals: null,
  });
  const itemsPerPage = 20;

  const fetchTokens = useCallback(() => {
    console.log('fetchTokens', search, page, hasMore, loading);
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      fetch(`${backendUrl}/api/verified-tokens?search=${search}&page=${page}&pagination=${itemsPerPage}`).then(res => res.json().then(data => {  
        if (data.tokens.length < itemsPerPage) {
        setHasMore(false);
      }
      setTokens([...tokens, ...data.tokens]);
      setPage(prevPage => prevPage + 1);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }));
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setLoading(false);
    }   
  }, [search, page, hasMore, tokens,loading]);

  useEffect(() => {
    console.log('useEffect', isOpen);
    if (isOpen) {
      setTokens([]);
      setPage(1);
      setShowCustomForm(false)
      setHasMore(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && tokens.length === 0) {
      fetchTokens();
    }
  }, [isOpen, tokens.length, fetchTokens]);

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setSearch(value);
      setPage(1);
      setTokens([]);
      setHasMore(true);
    }, 300),
    []
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && hasMore) {
      fetchTokens();
    }
  };

  const handleDecimalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const decimals = value === '' ? null : parseInt(value);
    setCustomToken({...customToken, decimals: decimals});
  };

  const handleCustomTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedToken = {
      ...customToken,
      decimals: customToken.decimals === null ? 0 : customToken.decimals
    };
    onSelectToken(submittedToken, submittedToken.policyId);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeButton" onClick={onClose}>x</button>
        <h2>Select Currency</h2>
        {!showCustomForm ? (
          <>
            <input
              type="text"
              placeholder="Search tokens"
              onChange={(e) => debouncedSetSearch(e.target.value)}
              className="searchInput"
            />
            <div className="tokenListContainer" onScroll={handleScroll}>
              {tokens.map((token) => (
                <button className="tokenButton" key={token.policyId + token.hexName} onClick={() => onSelectToken(token, token.policyId)}>
                  <img className="tokenImage" src={`${backendUrl}/assets/${token.policyId + token.hexName}.png`} alt={token.fullName} />
                  <div className="tokenInfo">
                    <span className="tokenTicker">{token.ticker}</span>
                    <span className="tokenFullName">{token.fullName}</span>
                  </div>
                </button>
              ))}
              {loading && <p className="loadingText">Loading...</p>}
            </div>
            <button className="customTokenButton" onClick={() => setShowCustomForm(true)}>
              Enter Custom Token
            </button>
          </>
        ) : (
          <form className="customTokenForm" onSubmit={handleCustomTokenSubmit}>
            <input
              type="text"
              placeholder="Policy ID"
              value={customToken.policyId}
              onChange={(e) => setCustomToken({...customToken, policyId: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Hex Name"
              value={customToken.hexName}
              onChange={(e) => setCustomToken({...customToken, hexName: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Ticker"
              value={customToken.ticker}
              onChange={(e) => setCustomToken({...customToken, ticker: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={customToken.fullName}
              onChange={(e) => setCustomToken({...customToken, fullName: e.target.value})}
              required
            />
            <div className="inputGroup">
              <input
                type="number"
                placeholder="Decimals"
                value={customToken.decimals === null ? '' : customToken.decimals}
                onChange={handleDecimalsChange}
                min="0"
                required
             />
            </div>
            <div className="customTokenFormButtons">
              <button type="submit">Add Custom Token</button>
              <button type="button" onClick={() => setShowCustomForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TokenSelectModal;
