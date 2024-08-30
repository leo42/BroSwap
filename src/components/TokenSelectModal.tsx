import React, { useState, useEffect } from 'react';
import { TokenData } from './types'; // Assuming you have a types file
import supportedTokens from './supportedTokens.json';

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenData, policy: string) => void
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
}) => {
  const [tokenList, setTokenList] = useState<Record<string, TokenData>>(
    Object.fromEntries(Object.entries(supportedTokens).slice(0, 10))
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const filterTokenList = (search: string) => {
    const filteredTokens = Object.entries(supportedTokens).filter(([policyId, token]) =>
      token.project.toLowerCase().includes(search.toLowerCase()) ||
      policyId.toLowerCase().includes(search.toLowerCase())
    );
    setTokenList(Object.fromEntries(filteredTokens));
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <h2>Select Currency</h2>
        <input
          type="text"
          placeholder="Search"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => filterTokenList(event.target.value)}
        />
        {Object.entries(tokenList).slice(0, 10).map(([policyId, token]) => (
          <button key={policyId} onClick={() => onSelectToken(token , policyId)}>
            <img src={`/assets/${token.project.replace(" ", "_")}_${policyId }.png`} alt={token.project} style={{width: '20px', height: '20px', marginRight: '5px'}} />
            {token.project}
          </button>
        ))}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default TokenSelectModal;
