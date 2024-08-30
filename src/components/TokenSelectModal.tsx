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

  const fetchTokens = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/verified-tokens?search=${search}&page=${page}&pagination=${itemsPerPage}`);
      const data = await response.json();
      if (data.tokens.length < itemsPerPage) {
        setHasMore(false);
      }
      setTokens(prevTokens => [...prevTokens, ...data.tokens]);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
    setLoading(false);
  }, [search, page, hasMore, loading]);

  useEffect(() => {
    if (isOpen) {
      setTokens([]);
      setPage(1);
      setHasMore(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, search, page, fetchTokens]);

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
      <div className="modalContent" onClick={(e) => e.stopPropagation()} onScroll={handleScroll}>
        <h2>Select Currency</h2>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => debouncedSetSearch(e.target.value)}
        />
        <div style={{maxHeight: '400px', overflowY: 'auto'}}>
          {tokens.map((token) => (
            <button key={token.policyId + token.hexName} onClick={() => onSelectToken(token, token.policyId)}>
              <img src={`${backendUrl}/assets/${token.policyId + token.hexName}.png`} alt={token.fullName} style={{width: '20px', height: '20px', marginRight: '5px'}} />
              {token.ticker}
            </button>
          ))}
          {loading && <p>Loading...</p>}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default TokenSelectModal;
