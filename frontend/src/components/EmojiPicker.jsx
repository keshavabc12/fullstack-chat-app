import { useState, useRef, useEffect } from "react";
import EmojiPickerReact from "emoji-picker-react";
import { Smile } from "lucide-react";

const EmojiPicker = ({ onEmojiSelect, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close picker when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 z-50" ref={pickerRef}>
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-xl p-2">
        <EmojiPickerReact
          onEmojiClick={handleEmojiClick}
          searchPlaceholder="Search emojis..."
          searchDisabled={false}
          skinTonesDisabled={false}
          height={400}
          width={350}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          theme="light"
          autoFocusSearch={false}
          lazyLoadEmojis={true}
          suggestedEmojisMode="recent"
          skinTonePickerLocation="SEARCH"
          emojiStyle="native"
        />
      </div>
      
      {/* Arrow pointing down */}
      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-base-300"></div>
    </div>
  );
};

export default EmojiPicker;
