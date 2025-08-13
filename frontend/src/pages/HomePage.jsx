import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

const HomePage = () => {
  const { selectedUser, setSelectedUser, getUsers, getMessages, messages, subscribeToMessages, subscribeToGlobalMessages, unsubscribeFromMessages, unsubscribeFromGlobalMessages } = useChatStore();
  const { authUser } = useAuthStore();

  // ✅ Load previous chat data when component mounts
  useEffect(() => {
    if (authUser?._id) {
      // Load users for sidebar
      getUsers();
      
      // If there's a previously selected user, restore the conversation
      if (selectedUser?._id && messages.length === 0) {
        getMessages(selectedUser._id);
      }
    }
  }, [authUser?._id, selectedUser?._id, messages.length]); // ✅ Remove store functions from dependencies

  // ✅ Subscribe to global messages for real-time updates
  useEffect(() => {
    if (authUser?._id) {
      subscribeToGlobalMessages();
      
      return () => {
        unsubscribeFromGlobalMessages();
      };
    }
  }, [authUser?._id, subscribeToGlobalMessages, unsubscribeFromGlobalMessages]);

  // ✅ Subscribe to conversation-specific messages
  useEffect(() => {
    if (selectedUser?._id && authUser?._id) {
      subscribeToMessages();
      
      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [selectedUser?._id, authUser?._id, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
