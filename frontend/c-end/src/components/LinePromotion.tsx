import React, { useState, useRef } from 'react';
import { MessageCircle, ExternalLink, Gift, Move } from 'lucide-react';

interface LinePromotionProps {
  url?: string;
  displayText?: string;
  description?: string;
}

const LinePromotion: React.FC<LinePromotionProps> = ({ 
  url = 'https://line.me/R/ti/p/@example',
  displayText = 'LINEで更に詳しい分析を受け取ろう！',
  description = 'LINEの公式アカウントを友達追加すると、リアルタイム株価アラート、限定の投資レポート、専門アナリストによる詳細分析をお届けします。'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const promotionRef = useRef<HTMLDivElement>(null);

  const handleLineClick = () => {
    window.open(url, '_blank');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div 
      ref={promotionRef}
      className={`bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-4 text-white relative ${
        isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-grab'
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start space-x-3">
        <div className="drag-handle absolute top-2 right-2 opacity-50 hover:opacity-100 cursor-grab">
          <Move className="w-4 h-4" />
        </div>
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-2 flex items-center space-x-2">
            <Gift className="w-5 h-5" />
            <span>{displayText}</span>
          </h4>
          <p className="text-green-100 text-sm mb-3">
            {description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              📊 リアルタイム株価通知
            </span>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              📈 限定投資レポート
            </span>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              💡 専門家の分析
            </span>
          </div>
          <button
            onClick={handleLineClick}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center space-x-2 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>LINE友達追加</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinePromotion;