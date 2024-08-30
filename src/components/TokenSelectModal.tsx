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
  }, [search, page, hasMore, tokens,loading]); // Add dependency array here

  useEffect(() => {
    console.log('useEffect', isOpen);
    if (isOpen) {
      setTokens([]);
      setPage(1);
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

  if (!isOpen) return null;
  return (
        <div className="modal" onClick={onClose}>
        
      <div className="modalContent" onClick={(e) => e.stopPropagation()} >
      <button className="closeButton" onClick={onClose}>x</button>
        <h2>Select Currency</h2>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => debouncedSetSearch(e.target.value)}
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
          {loading && <p>Loading...</p>}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
