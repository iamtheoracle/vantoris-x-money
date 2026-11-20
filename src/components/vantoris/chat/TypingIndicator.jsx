import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray"
          style={{
            animation: 'typing-bounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}