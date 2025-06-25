import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { connectSocket } from "../socket";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (authUser?._id) {
      const newSocket = connectSocket(authUser._id);
      setSocket(newSocket);

      return () => {
        newSocket.disconnect(); // ✅ Clean up
      };
    }
  }, [authUser]);



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
