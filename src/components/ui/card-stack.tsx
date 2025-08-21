"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IconEye } from "@tabler/icons-react";

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
  created_at?: string;
  ticket?: any;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  onViewTicket,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
  onViewTicket?: (ticket: any) => void;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  const handleCardClick = () => {
    setCards((prevCards: Card[]) => {
      const newArray = [...prevCards]; // create a copy of the array
      newArray.unshift(newArray.pop()!); // move the last element to the front
      return newArray;
    });
  };

  return (
    <div className="relative w-full h-full max-w-[400px] max-h-[160px] mx-auto">
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className="absolute w-full h-full rounded-xl p-3 shadow-sm border border-[#cecece99] dark:border-[#343434] bg-sidebar dark:bg-[#252525] text-card-foreground flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, //  decrease z-index for the cards that are behind
            }}
            onClick={handleCardClick}
            whileHover={{ 
              scale: index === 0 ? 1.02 : 1 - index * SCALE_FACTOR + 0.02,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-primary px-2 py-1 rounded-md">
                  {card.designation}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{card.created_at ? new Date(card.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono">{card.created_at ? new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-[#cecece99] dark:bg-[#8989894d]"></div>
              <div className="font-normal text-sm text-muted-foreground flex-1 line-clamp-2">
                {card.content}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                    {card.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {card.name}
                  </p>
                </div>
                {onViewTicket && card.ticket && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTicket(card.ticket);
                    }}
                    className="text-xs h-6 px-2 rounded-md shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] transition-colors"
                  >
                    <span className="inline-flex items-center">
                      <IconEye className="h-3.5 w-3.5 mr-1" />
                      <span>View Info</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}; 