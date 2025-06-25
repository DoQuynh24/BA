"use client";
import React, { ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import "./styleAdmin.css";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import { motion } from "framer-motion";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputBase,
  Fab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface LayoutProps {
  children: ReactNode;
}

interface Message {
  sender: "user" | "admin" | string;
  text?: string;
  image?: string; 
}

interface ChatUser {
  name: string;
  messages: Message[];
}

interface UserInfo {
  full_name: string;
  phone_number: string;
  role: "Khách hàng" | "Admin";
}

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

const StyledChatBox = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: "80px",
  right: "20px",
  width: "350px",
  height: "400px",
  display: "flex",
  flexDirection: "column",
  zIndex: theme.zIndex.appBar + 1,
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
}));

const StyledChatHeader = styled(Box)(({ theme }) => ({
  background: "linear-gradient(90deg, #a64ca6, #d6a8e3)",
  color: "#fff",
  padding: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

const StyledChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: "10px",
  background: "#f9f9f9",
}));

const StyledMessage = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isUser",
})<{ isUser: boolean }>(({ isUser, theme }) => ({
  margin: "5px 0",
  padding: "5px 10px",
  borderRadius: "10px",
  maxWidth: "90%",
  background: isUser ? "#a64ca6" : "#e0e0e0",
  color: isUser ? "#fff" : "#333",
  alignSelf: isUser ? "flex-end" : "flex-start",
  wordBreak: "break-word",
}));

const StyledChatInput = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: "10px",
  borderTop: "1px solid #ccc",
  background: "#fff",
}));

const StyledChatContacts = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: "10px",
  background: "#f9f9f9",
}));

const StyledContact = styled(Box)(({ theme }) => ({
  padding: "10px",
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#f8dff6",
  },
}));

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("/ADMIN/home");
  
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  useEffect(() => {
    setIsClient(true);
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      if (parsedUserInfo.role !== "Admin") {
        router.push("/Login");
      } else {
        socket.emit("joinAdmin");
        console.log("Admin joined adminRoom");
  
        const storedChats = localStorage.getItem("adminChats");
        if (storedChats) {
          try {
            const chats: ChatUser[] = JSON.parse(storedChats);
            setChatUsers(chats);
            chats.forEach((chat: ChatUser) => {
              socket.emit("joinRoom", chat.name);
              console.log(`Admin rejoined room: ${chat.name}`);
            });
            console.log("Restored adminChats:", chats);
          } catch (e) {
            console.error("Error parsing adminChats:", e);
            setChatUsers([]);
          }
        }
      }
    } else {
      router.push("/Login");
    }
  }, [router]);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  useEffect(() => {
    const handleReceiveMessage = (data: { sender: string; text?: string; image?: string; userName: string }) => {
      console.log("Admin received message:", data);
      if (data.sender === "user") {
        if (!data.image && !data.text) {
          console.error("Received message with no content (neither text nor image):", data);
          return;
        }
  
        const newMessage = data.image
          ? { sender: "user", image: data.image }
          : { sender: "user", text: data.text || "" };
  
        setChatUsers((prev) => {
          const existingUser = prev.find((u) => u.name === data.userName);
          let updatedChats: ChatUser[];
          if (existingUser) {
            updatedChats = prev.map((u) =>
              u.name === data.userName
                ? {
                    ...u,
                    messages: [...u.messages, newMessage],
                  }
                : u
            );
          } else {
            updatedChats = [
              ...prev,
              {
                name: data.userName,
                messages: [newMessage],
              },
            ];
            socket.emit("joinRoom", data.userName);
          }
          localStorage.setItem("adminChats", JSON.stringify(updatedChats));
          console.log("Saved adminChats:", updatedChats);
          return updatedChats;
        });
  
        if (currentChatUser && currentChatUser.name === data.userName) {
          setCurrentChatUser((prev) => {
            const updatedCurrentChat = {
              ...prev!,
              messages: [...prev!.messages, newMessage],
            };
            const updatedChats = chatUsers.map((u) =>
              u.name === data.userName ? updatedCurrentChat : u
            );
            localStorage.setItem("adminChats", JSON.stringify(updatedChats));
            return updatedCurrentChat;
          });
        }
      } else {
        console.log("Message not processed: sender is not 'user'");
      }
    };
  
    const handleUserLogout = (userName: string) => {
      setChatUsers((prev) => {
        const updatedChats = prev.filter((u) => u.name !== userName);
        localStorage.setItem("adminChats", JSON.stringify(updatedChats));
        console.log("Saved adminChats after logout:", updatedChats);
        return updatedChats;
      });
      if (currentChatUser && currentChatUser.name === userName) {
        setCurrentChatUser(null);
      }
    };
  
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userLogout", handleUserLogout);
  
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userLogout", handleUserLogout);
    };
  }, [currentChatUser, chatUsers]);

  const openChatWithUser = (user: ChatUser) => {
    setCurrentChatUser(user);
    socket.emit("joinRoom", user.name);
    setShowChat(true);
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      sendImage(file);
    }
  };
  
  const sendImage = (file: File) => {
    if (!currentChatUser) return;

    setIsSending(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (!imageData) {
        console.error("Không đọc được dữ liệu ảnh!");
        setIsSending(false);
        return;
      }

      const messageData = {
        sender: "admin",
        image: imageData,
        userName: currentChatUser.name,
        room: currentChatUser.name,
        text: "",
      };
      console.log("Admin sending image message:", messageData);
      socket.emit("sendMessage", messageData, (response: any) => {
        if (response?.status === "ok") {
          console.log("Server received image message successfully:", response);
        } else {
          console.error("Server failed to receive image message:", response?.error || "Unknown error");
        }
      });

      setChatUsers((prev) => {
        const updatedChats = prev.map((u) =>
          u.name === currentChatUser.name
            ? { ...u, messages: [...u.messages, { sender: "admin", image: imageData }] }
            : u
        );
        localStorage.setItem("adminChats", JSON.stringify(updatedChats));
        console.log("Saved adminChats:", updatedChats);
        return updatedChats;
      });
      setCurrentChatUser((prev) => ({
        ...prev!,
        messages: [...prev!.messages, { sender: "admin", image: imageData }],
      }));

      setSelectedImage(null);
      setIsSending(false);
    };
    reader.onerror = () => {
      console.error("Lỗi khi đọc file ảnh!");
      setIsSending(false);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (newMessage.trim() === "" || isSending || !currentChatUser) return;
  
    console.log("Admin sending message:", newMessage);
    setIsSending(true);
    const messageData = {
      sender: "admin",
      text: newMessage,
      userName: currentChatUser.name,
      room: currentChatUser.name,
    };
    socket.emit("sendMessage", messageData);
  
    setChatUsers((prev) => {
      const updatedChats = prev.map((u) =>
        u.name === currentChatUser.name
          ? { ...u, messages: [...u.messages, { sender: "admin", text: newMessage }] }
          : u
      );
      localStorage.setItem("adminChats", JSON.stringify(updatedChats));
      return updatedChats;
    });
    setCurrentChatUser((prev) => ({
      ...prev!,
      messages: [...prev!.messages, { sender: "admin", text: newMessage }],
    }));
  
    setNewMessage("");
    setIsSending(false);
  };

  const handleNavigation = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      console.log("Logging out, removing localStorage: userInfo, token");
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setUserInfo(null);
      setChatUsers([]);
      setCurrentChatUser(null);
      router.push("/Login");
    }
  };

  const getLastMessagePreview = (user: ChatUser) => {
    const lastMessage = user.messages[user.messages.length - 1];
    if (lastMessage.sender === "admin") {
      return `Bạn: ${lastMessage.text}`;
    }
    return lastMessage.text;
  };

  const navItems = [
    { path: "/ADMIN/home", label: "Tổng quan" },
    { path: "/ADMIN/products", label: "Sản phẩm" },
    { path: "/ADMIN/invoices", label: "Hóa đơn" },
    { path: "/ADMIN/users", label: "Khách hàng" },
    { path: "/ADMIN/notifications", label: "Thông báo" },
    { path: "/ADMIN/management", label: "Quản lý" },
  ];

  // Variants cho Framer Motion
  const chatBoxVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20,
      },
    },
    exit: { opacity: 0, x: 100, transition: { duration: 0.3 } },
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="brand">JEWELRY DASHBOARD</span>
          <span className="dashboard-date">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="header-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-tab ${activeTab === item.path ? "active" : ""}`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="header-right">
          <input type="text" value={userInfo?.full_name || "Chưa đăng nhập"} readOnly />
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="dashboard-content">{children}</div>

      <motion.div
        style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 1000 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Fab
          sx={{ backgroundColor: "#a64ca6", color: "#fff", "&:hover": { backgroundColor: "#8e3e8e" } }}
          onClick={() => setShowChat(!showChat)}
        >
          <ChatIcon />
        </Fab>
      </motion.div>

      {showChat && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={chatBoxVariants}
        >
          <StyledChatBox>
            <StyledChatHeader>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {currentChatUser && (
                  <IconButton
                    onClick={() => setCurrentChatUser(null)}
                    sx={{ color: "#fff" }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                )}
                <Box>
                  {currentChatUser ? (
                    <Typography variant="h6">{currentChatUser.name}</Typography>
                  ) : (
                    <>
                      <Typography variant="h6">Jewelry</Typography>
                      <Typography variant="caption">Natural Diamond Jewelry</Typography>
                    </>
                  )}
                </Box>
              </Box>
              <IconButton onClick={() => setShowChat(false)} sx={{ color: "#fff" }}>
                <CloseIcon />
              </IconButton>
            </StyledChatHeader>
            {currentChatUser ? (
              <StyledChatMessages>
                <List>
                  {currentChatUser.messages.map((msg, index) => (
                    <ListItem
                      key={index}
                      sx={{ display: "flex", justifyContent: msg.sender === "admin" ? "flex-end" : "flex-start" }}
                    >
                      <StyledMessage isUser={msg.sender === "admin"}>
                        {msg.image ? (
                          <img
                            src={msg.image}
                            alt="chat image"
                            style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
                          />
                        ) : (
                          <ListItemText primary={msg.text} />
                        )}
                      </StyledMessage>
                    </ListItem>
                  ))}
                </List>
              </StyledChatMessages>
            ) : (
              <StyledChatContacts>
                {chatUsers.map((user, index) => (
                  <StyledContact
                    key={index}
                    onClick={() => openChatWithUser(user)}
                  >
                    <Typography variant="subtitle1">{user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {getLastMessagePreview(user)}
                    </Typography>
                  </StyledContact>
                ))}
              </StyledChatContacts>
            )}
            {currentChatUser && (
              <StyledChatInput>
                <label>
                  <IconButton component="span" disabled={isSending}>
                    <AttachFileIcon />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: "none" }}
                      disabled={isSending}
                    />
                  </IconButton>
                </label>
                <InputBase
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  fullWidth
                  sx={{ ml: 1, mr: 1 }}
                  disabled={isSending}
                />
                <IconButton
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  sx={{ color: "#a64ca6", ml: 1 }}
                >
                  <SendIcon />
                </IconButton>
              </StyledChatInput>
            )}
          </StyledChatBox>
        </motion.div>
      )}
    </div>
  );
};

export default Layout;
