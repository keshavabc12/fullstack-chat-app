import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Image, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const { selectedUser, sendMessage } = useChatStore();
  const { authUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setTimeout(() => {
      const input = document.querySelector("input[type=\"text\"]");
      if (input) input.focus();
    }, 100);
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen(!isEmojiPickerOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !image) return;

    try {
      await sendMessage({ text: message.trim(), image });
      setMessage("");
      setImage("");
      setIsTyping(false);
      setIsEmojiPickerOpen(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="border-t border-base-300 p-4 relative">
      {isTyping && (
        <div className="text-sm text-base-content/70 mb-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <span>{selectedUser.fullName} is typing...</span>
        </div>
      )}

      {image && (
        <div className="mb-3 relative">
          <img
            src={image}
            alt="Preview"
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
          >
            
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost btn-sm btn-circle"
          title="Upload image"
        >
          <Image className="size-5" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder={`Message ${selectedUser.fullName}...`}
          className="flex-1 input input-bordered"
          disabled={!selectedUser}
        />

        <button
          type="button"
          onClick={toggleEmojiPicker}
          className={`btn btn-sm btn-circle ${isEmojiPickerOpen ? "btn-primary" : "btn-ghost"}`}
          title="Add emoji"
        >
          <Smile className="size-5" />
        </button>

        <button
          type="submit"
          disabled={(!message.trim() && !image) || !selectedUser}
          className="btn btn-primary btn-sm btn-circle"
        >
          <Send className="size-5" />
        </button>
      </form>

      <EmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelect={handleEmojiSelect}
      />
    </div>
  );
};

export default MessageInput;
