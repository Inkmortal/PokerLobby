import React, { useState } from 'react';

interface BoardSelectorProps {
  street: 'flop' | 'turn' | 'river';
  existingCards: string[];
  onSelect: (cards: string[]) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const catppuccin = {
  base: '#1e1e2e',
  mantle: '#181825',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay1: '#7f849c',
  subtext0: '#a6adc8',
  text: '#cdd6f4',
  green: '#a6e3a1',
  blue: '#89b4fa',
  red: '#f38ba8',
  yellow: '#f9e2af',
  mauve: '#cba6f7',
  sapphire: '#74c7ec'
};

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = [
  { symbol: '♠', name: 'spades', color: '#000000', bgColor: '#e8e8e8' },  // Black on light gray
  { symbol: '♥', name: 'hearts', color: '#ff0000', bgColor: '#ffe0e0' }, // Red on light red
  { symbol: '♦', name: 'diamonds', color: '#0066ff', bgColor: '#e0e8ff' }, // Blue on light blue
  { symbol: '♣', name: 'clubs', color: '#00aa00', bgColor: '#e0ffe0' }  // Green on light green
];

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  street,
  existingCards,
  onSelect,
  onClose,
  position
}) => {
  const [selectedSuit, setSelectedSuit] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>(() => {
    // Initialize with existing cards for this street
    // Only take the cards up to the max for this street
    const maxCards = street === 'flop' ? 3 : 1;
    // Convert cards from symbol format to letter format if needed
    const convertCard = (card: string) => {
      if (!card || card.length === 0) return '';
      const rank = card[0];
      // If card already has letter format, return as is
      if (card.length === 2 && ['s', 'h', 'd', 'c'].includes(card[1].toLowerCase())) {
        return card;
      }
      // Convert from symbol format to letter format
      if (card.includes('♠')) return rank + 's';
      if (card.includes('♥')) return rank + 'h';
      if (card.includes('♦')) return rank + 'd';
      if (card.includes('♣')) return rank + 'c';
      return card;
    };
    const initialCards = existingCards.slice(0, maxCards).map(convertCard).filter(card => card.length > 0);
    return initialCards;
  });
  
  const maxCards = street === 'flop' ? 3 : 1;
  // For duplicate checking, use all existing cards except the ones we're editing
  // Convert to letter format for consistency
  const convertToLetterFormat = (card: string) => {
    if (!card || card.length === 0) return '';
    const rank = card[0];
    if (card.length === 2 && ['s', 'h', 'd', 'c'].includes(card[1].toLowerCase())) {
      return card;
    }
    if (card.includes('♠')) return rank + 's';
    if (card.includes('♥')) return rank + 'h';
    if (card.includes('♦')) return rank + 'd';
    if (card.includes('♣')) return rank + 'c';
    return card;
  };
  const otherUsedCards = existingCards.slice(maxCards).map(convertToLetterFormat).filter(c => c.length > 0);
  // Don't include selectedCards twice - they're already being checked separately
  const allUsedCards = [...otherUsedCards];
  
  const isCardUsed = (rank: string, suit: typeof SUITS[0]) => {
    const card = rank + suit.name[0].toLowerCase();
    return allUsedCards.includes(card);
  };
  
  const handleCardClick = (rank: string) => {
    const suit = SUITS[selectedSuit];
    const card = rank + suit.name[0].toLowerCase();
    
    // Check if this card is already selected
    const isAlreadySelected = selectedCards.includes(card);
    
    if (isAlreadySelected) {
      // Deselect if already selected
      setSelectedCards(prev => prev.filter(c => c !== card));
    } else if (!isCardUsed(rank, suit) && selectedCards.length < maxCards) {
      // Select if not used elsewhere and under limit
      setSelectedCards(prev => [...prev, card]);
    }
  };
  
  const handleConfirm = () => {
    // Always return the full number of cards for the street
    // Use empty strings for wildcards
    const cardsToReturn = [];
    for (let i = 0; i < maxCards; i++) {
      cardsToReturn[i] = selectedCards[i] || '';
    }
    onSelect(cardsToReturn);
    onClose();
  };
  
  const handleClear = () => {
    setSelectedCards([]);
  };
  
  const handleShuffle = () => {
    // Get all available cards (not used on ANY street OR currently selected)
    const availableCards: string[] = [];
    
    // Convert existingCards to letter format for comparison
    const convertToLetterFormatLocal = (card: string) => {
      if (!card || card.length === 0) return '';
      const rank = card[0];
      if (card.length === 2 && ['s', 'h', 'd', 'c'].includes(card[1].toLowerCase())) {
        return card;
      }
      if (card.includes('♠')) return rank + 's';
      if (card.includes('♥')) return rank + 'h';
      if (card.includes('♦')) return rank + 'd';
      if (card.includes('♣')) return rank + 'c';
      return card;
    };
    
    // Get all cards that are already used (other streets + current selections)
    const otherStreetCards = existingCards.slice(maxCards).map(convertToLetterFormatLocal).filter(c => c.length > 0);
    const currentlySelectedCards = selectedCards.filter(c => c && c.length > 0);
    const allUsedCardsForShuffle = [...otherStreetCards, ...currentlySelectedCards];
    
    // Build list of available cards
    SUITS.forEach(suit => {
      RANKS.forEach(rank => {
        const card = rank + suit.name[0].toLowerCase();
        if (!allUsedCardsForShuffle.includes(card)) {
          availableCards.push(card);
        }
      });
    });
    
    // Only shuffle the empty slots, keep existing selections
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    const newCards = [];
    let shuffleIndex = 0;
    
    for (let i = 0; i < maxCards; i++) {
      if (selectedCards[i] && selectedCards[i].length > 0) {
        // Keep existing selection
        newCards[i] = selectedCards[i];
      } else {
        // Fill empty slot with shuffled card
        if (shuffleIndex < shuffled.length) {
          newCards[i] = shuffled[shuffleIndex++];
        }
      }
    }
    
    setSelectedCards(newCards);
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        background: catppuccin.base,
        border: `2px solid ${catppuccin.surface1}`,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        minWidth: '320px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${catppuccin.surface1}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: catppuccin.text,
          textTransform: 'uppercase'
        }}>
          {street} Board
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: catppuccin.overlay1,
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: 0
          }}
        >
          ×
        </button>
      </div>
      
      {/* Selected Cards Display */}
      <div style={{
        padding: '0.75rem',
        background: catppuccin.mantle,
        borderBottom: `1px solid ${catppuccin.surface1}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '3px',
          justifyContent: 'center'
        }}>
          {Array.from({ length: maxCards }).map((_, i) => {
            const card = selectedCards[i];
            if (card) {
              // Parse card to get rank and suit (now in letter format like "9s", "Kh")
              const rank = card[0].toUpperCase();
              const suitChar = card.length > 1 ? card[1].toLowerCase() : '';
              
              // Determine suit and color
              let suitColor = '#000000';
              let bgColor = '#e8e8e8';
              let suitSymbol = '';
              
              if (suitChar === 'h') {
                suitColor = '#ff0000';
                bgColor = '#ffe0e0';
                suitSymbol = '♥';
              } else if (suitChar === 'd') {
                suitColor = '#0066ff';
                bgColor = '#e0e8ff';
                suitSymbol = '♦';
              } else if (suitChar === 'c') {
                suitColor = '#00aa00';
                bgColor = '#e0ffe0';
                suitSymbol = '♣';
              } else if (suitChar === 's') {
                suitColor = '#000000';
                bgColor = '#e8e8e8';
                suitSymbol = '♠';
              }
              
              return (
                <div
                  key={i}
                  onClick={() => {
                    // Remove card when clicked
                    setSelectedCards(prev => prev.filter(c => c !== card));
                  }}
                  style={{
                    background: bgColor,
                    border: `2px solid ${suitColor}`,
                    borderRadius: '3px',
                    padding: '0.5rem 0.6rem',
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: suitColor,
                    minWidth: '36px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Click to remove"
                >
                  {rank}{suitSymbol}
                </div>
              );
            } else {
              // Empty slot
              return (
                <div
                  key={i}
                  style={{
                    background: catppuccin.surface0,
                    border: `2px dashed ${catppuccin.surface2}`,
                    borderRadius: '3px',
                    padding: '0.5rem 0.6rem',
                    minWidth: '36px',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{
                    color: catppuccin.overlay0,
                    fontSize: '1rem'
                  }}>?</span>
                </div>
              );
            }
          })}
        </div>
        
        {/* Shuffle button */}
        <button
          onClick={handleShuffle}
          style={{
            background: catppuccin.surface0,
            border: `1px solid ${catppuccin.surface1}`,
            borderRadius: '4px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: catppuccin.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            marginLeft: '0.5rem'
          }}
          title="Shuffle random cards"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 2 4 4-4 4" />
            <path d="M2 6h1.9c1.5 0 2.9.7 3.8 2" />
            <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
            <path d="m18 14 4 4-4 4" />
          </svg>
        </button>
      </div>
      
      {/* Suit Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${catppuccin.surface1}`
      }}>
        {SUITS.map((suit, idx) => (
          <button
            key={suit.name}
            onClick={() => setSelectedSuit(idx)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: selectedSuit === idx ? catppuccin.surface0 : 'transparent',
              border: 'none',
              borderBottom: selectedSuit === idx ? `2px solid ${suit.color}` : 'none',
              color: suit.color,
              cursor: 'pointer',
              fontSize: '1.25rem',
              transition: 'all 0.2s'
            }}
          >
            {suit.symbol}
          </button>
        ))}
      </div>
      
      {/* Card Grid */}
      <div style={{
        padding: '0.75rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {RANKS.map(rank => {
          const suit = SUITS[selectedSuit];
          const card = rank + suit.name[0].toLowerCase();
          const isUsedElsewhere = allUsedCards.includes(card);
          const isSelected = selectedCards.includes(card);
          const isDisabled = isUsedElsewhere && !isSelected;
          
          return (
            <button
              key={rank}
              onClick={() => handleCardClick(rank)}
              disabled={isDisabled}
              style={{
                padding: '0.5rem',
                background: isSelected ? suit.bgColor : 
                           isDisabled ? catppuccin.surface2 : 
                           catppuccin.surface0,
                color: isSelected ? suit.color : 
                       isDisabled ? catppuccin.overlay1 : 
                       catppuccin.text,
                border: `2px solid ${isSelected ? suit.color : 
                        isDisabled ? catppuccin.surface1 :
                        catppuccin.surface1}`,
                borderRadius: '4px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: isSelected ? '700' : '600',
                transition: 'all 0.2s',
                opacity: isDisabled ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}
            >
              {rank}
              <span style={{ 
                fontSize: '0.75rem',
                color: isSelected ? suit.color : 
                       isDisabled ? catppuccin.overlay1 : 
                       suit.color
              }}>
                {suit.symbol}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Actions */}
      <div style={{
        padding: '0.75rem',
        borderTop: `1px solid ${catppuccin.surface1}`,
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleClear}
          style={{
            padding: '0.5rem 1rem',
            background: catppuccin.surface0,
            color: catppuccin.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}
        >
          Clear
        </button>
        <button
          onClick={handleConfirm}
          style={{
            padding: '0.5rem 1rem',
            background: catppuccin.blue,
            color: catppuccin.base,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};