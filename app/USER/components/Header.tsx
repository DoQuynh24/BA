'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import axios from 'axios';
import LuckyWheel from "./LuckyWheel";
import io from 'socket.io-client';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  TextField,
  Button,
  MenuItem,
  Menu,
  Badge,
  InputAdornment,
  Divider,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  InputBase,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface UserInfo {
  full_name: string;
  phone_number: string;
  role: 'Khách hàng' | 'Admin';
  perID: number;
}

interface Category {
  categoryID: number;
  category_name: string;
}

interface Material {
  materialID: number;
  material_name: string;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: { materialID: number; material_name?: string; price: number }[];
  images: { imageURL: string; is_main: number }[];
}

interface Message {
  sender: 'user' | 'admin' | string;
  text?: string;
  image?: string;
}

interface ChatUser {
  name: string;
  messages: Message[];
}

const socket = io('http://localhost:4000');

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: '#fff',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  padding: '0 40px',
}));

const StyledHeaderBox = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(90deg, #f8dff6, #e3e3e3)',
  zIndex: theme.zIndex.appBar + 1,
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '350px',
    background: 'linear-gradient(90deg, #f8dff6, #e3e3e3)',
    padding: '20px',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: '#333',
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  padding: '3px 10px',
  borderRadius: '10px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#a64ca6',
    color: '#fff',
    transform: 'scale(1.025)',
  },
}));

const StyledChatBox = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: '80px',
  right: '20px',
  width: '350px',
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  zIndex: theme.zIndex.appBar + 1,
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
}));

const StyledChatHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(90deg, #a64ca6, #d6a8e3)',
  color: '#fff',
  padding: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '10px',
  background: '#f9f9f9',
}));

const StyledMessage = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<{ isUser: boolean }>(({ isUser, theme }) => ({
  margin: '5px 0',
  padding: '5px 10px',
  borderRadius: '10px',
  maxWidth: '90%',
  background: isUser ? '#a64ca6' : '#e0e0e0',
  color: isUser ? '#fff' : '#333',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  wordBreak: 'break-word',
}));

const StyledChatInput = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  borderTop: '1px solid #ccc',
  background: '#fff',
}));

const Header: React.FC = () => {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    setIsClient(true);

    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      socket.emit('joinRoom', parsedUserInfo.full_name);

      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        setFavouriteProducts(JSON.parse(storedFavourites));
      }

      const userChatKey = `chat_${parsedUserInfo.perID}`;
      const storedChat = localStorage.getItem(userChatKey);
      if (storedChat) {
        try {
          const parsedChat: ChatUser = JSON.parse(storedChat);
          setCurrentChatUser(parsedChat);
        } catch (e) {
          console.error(`Error parsing chat from ${userChatKey}:`, e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && userInfo) {
      const userFavouritesKey = `favouriteProducts_${userInfo.perID}`;
      localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient, userInfo]);

  useEffect(() => {
    if (userInfo && currentChatUser) {
      const userChatKey = `chat_${userInfo.perID}`;
      localStorage.setItem(userChatKey, JSON.stringify(currentChatUser));
    }
  }, [currentChatUser, userInfo]);

  useEffect(() => {
    axios
      .get(`${API_URL}/categories`)
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch((error) => {
        console.error('Lỗi khi lấy danh mục:', error);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (data: { sender: string; text?: string; image?: string; userName: string }) => {
      if (userInfo && data.userName === userInfo.full_name && data.sender === 'admin') {
        const newMessage = data.image
          ? { sender: 'admin', image: data.image }
          : { sender: 'admin', text: data.text || '' };

        const updatedChat = currentChatUser
          ? {
              ...currentChatUser,
              messages: [...currentChatUser.messages, newMessage],
            }
          : {
              name: 'Admin',
              messages: [newMessage],
            };
        setCurrentChatUser(updatedChat);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [currentChatUser, userInfo]);

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      if (userInfo) {
        socket.emit('userLogout', userInfo.full_name);
        socket.disconnect(); // Đảm bảo ngắt kết nối socket
      }
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      setUserInfo(null);
      setFavouriteProducts([]);
      setCurrentChatUser(null);
      setIsUserPanelOpen(false);
      router.push('/Login');
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
       `${API_URL}/auth/change-password`,
        {
          phone_number: userInfo?.phone_number,
          old_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        alert('Thay đổi mật khẩu thành công!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thay đổi mật khẩu thất bại');
    }
  };

  const handleViewInvoices = () => {
    router.push('/USER/invoices');
  };

  const groupedCategories = () => {
    return { mainCategories: categories, subCategories: {} };
  };

  const { mainCategories, subCategories } = groupedCategories();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('query', searchQuery);
    } else {
      params.delete('query');
    }

    let newUrl = pathname;
    if (params.toString()) {
      newUrl = `${pathname}?${params.toString()}`;
    }

    router.replace(newUrl, { scroll: false });
  }, [searchQuery, pathname, router, searchParams]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenLuckyWheel = () => {
  if (!userInfo) {
    alert('Vui lòng đăng nhập để quay thưởng!');
    router.push('/Login');
    return;
  }
  setIsLuckyWheelOpen(true);
};

  const toggleChat = () => {
    if (!showChat && !currentChatUser && userInfo) {
      const userChatKey = `chat_${userInfo.perID}`;
      const storedChat = localStorage.getItem(userChatKey);
      let userChat: ChatUser;
      if (storedChat) {
        userChat = JSON.parse(storedChat);
      } else {
        userChat = {
          name: 'Admin',
          messages: [
            {
              sender: 'admin',
              text: `Xin chào ${userInfo.full_name}, bạn cần đội ngũ Jewelry tư vấn?`,
            },
          ],
        };
        localStorage.setItem(userChatKey, JSON.stringify(userChat));
      }
      setCurrentChatUser(userChat);
      socket.emit('joinRoom', userInfo.full_name);
    }
    setShowChat((prev) => !prev);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      sendImage(file);
    }
  };

  const sendImage = (file: File) => {
    if (!currentChatUser || !userInfo) return;

    setIsSending(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (!imageData) {
        console.error('Không đọc được dữ liệu ảnh!');
        setIsSending(false);
        return;
      }

      const messageData = {
        sender: 'user',
        image: imageData,
        userName: userInfo.full_name,
        room: userInfo.full_name,
        text: '',
      };
      socket.emit('sendMessage', messageData, (response: any) => {
        if (response?.status === 'ok') {
          console.log('Server received image message successfully:', response);
        } else {
          console.error('Server failed to receive image message:', response?.error || 'Unknown error');
        }
      });

      const updatedChat = {
        ...currentChatUser,
        messages: [...currentChatUser.messages, { sender: 'user', image: imageData }],
      };
      setCurrentChatUser(updatedChat);
      setSelectedImage(null);
      setIsSending(false);
    };
    reader.onerror = () => {
      console.error('Lỗi khi đọc file ảnh!');
      setIsSending(false);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (newMessage.trim() === '' || isSending || !currentChatUser || !userInfo) return;

    setIsSending(true);
    const messageData = {
      sender: 'user',
      text: newMessage,
      userName: userInfo.full_name,
      room: userInfo.full_name,
    };
    socket.emit('sendMessage', messageData);

    const updatedChat = {
      ...currentChatUser,
      messages: [...currentChatUser.messages, { sender: 'user', text: newMessage }],
    };
    setCurrentChatUser(updatedChat);
    setNewMessage('');
    setIsSending(false);
  };

  if (!isClient) {
    return null;
  }

  const topBarVariants = {
    hidden: { opacity: 0, y: -50, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  const navBarVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
        delay: 0.3,
        duration: 0.6,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    }),
  };

  const chatBoxVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      },
    },
    exit: { opacity: 0, x: 100, transition: { duration: 0.3 } },
  };

  return (
    <>
      <StyledHeaderBox>
        <motion.div variants={topBarVariants} initial="hidden" animate="visible">
          <StyledAppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.div variants={childVariants} custom={0}>
                  <Image src="/images/location.png" alt="location" width={25} height={25} />
                </motion.div>
                <motion.div variants={childVariants} custom={1}>
                  <Image src="/images/fb.png" alt="fb" width={30} height={30} />
                </motion.div>
                <motion.div variants={childVariants} custom={2}>
                  <Image src="/images/phone.png" alt="phone" width={30} height={30} />
                </motion.div>
                <motion.div variants={childVariants} custom={3}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    0364 554 001
                  </Typography>
                </motion.div>
              </Box>
              <motion.div variants={childVariants} custom={4}>
                <Link href="/USER/Home">
                  <Image src="/images/logo.png" alt="Logo" width={200} height={90} />
                </Link>
              </motion.div>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.div
                  variants={childVariants}
                  custom={5}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link href="/USER/favourite">
                    <Badge badgeContent={favouriteProducts.length} color="secondary">
                      <FavoriteIcon sx={{ color: '#a64ca6' }} />
                    </Badge>
                  </Link>
                </motion.div>
                <motion.div
                  variants={childVariants}
                  custom={6}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton onClick={handleViewInvoices}>
                    <ReceiptIcon sx={{ color: '#a64ca6' }} />
                  </IconButton>
                </motion.div>
                <motion.div
                  variants={childVariants}
                  custom={7}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton onClick={() => setIsUserPanelOpen(true)}>
                    <AccountCircleIcon sx={{ color: '#a64ca6' }} />
                  </IconButton>
                </motion.div>
              </Box>
            </Toolbar>
          </StyledAppBar>
        </motion.div>

        <motion.div variants={navBarVariants} initial="hidden" animate="visible">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px 50px', background: 'linear-gradient(90deg, #f8dff6, #e3e3e3)', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <motion.div variants={childVariants} custom={0}>
                <Link href="/USER/Products">
                  <StyledButton
                    sx={{
                      color: pathname === '/USER/Products' ? '#a64ca6' : '#333',
                      fontWeight: pathname === '/USER/Products' ? 'bold' : 500,
                    }}
                  >
                    Tất cả
                  </StyledButton>
                </Link>
              </motion.div>
              {mainCategories.map((categorie, index) => (
                <Box key={categorie.categoryID} sx={{ position: 'relative' }}>
                  <motion.div variants={childVariants} custom={index + 1}>
                    <StyledButton
                      onClick={() => router.push(`/USER/categorie/${categorie.categoryID}`)} // Điều hướng trực tiếp
                      sx={{
                        color: pathname === `/USER/categorie/${categorie.categoryID}` ? '#a64ca6' : '#333',
                        fontWeight: pathname === `/USER/categorie/${categorie.categoryID}` ? 'bold' : 500,
                      }}
                    >
                      {categorie.category_name}
                    </StyledButton>
                  </motion.div>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    sx={{ mt: '10px', width: '100%' }}
                  >
                    <Box sx={{ display: 'flex', gap: '30px', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#a64ca6', mb: 1 }}>
                          {categorie.category_name}
                        </Typography>
                        <MenuItem component={Link} href={`/USER/category/${categorie.categoryID}`}>
                          Tất cả {categorie.category_name}
                        </MenuItem>
                      </Box>
                      {materials.length > 0 && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#a64ca6', mb: 1 }}>
                            Chất liệu
                          </Typography>
                          {materials.map((material) => (
                            <MenuItem
                              key={material.materialID}
                              component={Link}
                              href={`/USER/categorie/${categorie.categoryID}?material=${material.materialID}`}
                            >
                              {material.material_name}
                            </MenuItem>
                          ))}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#a64ca6', mb: 1 }}>
                          Phong cách
                        </Typography>
                        {['Halo', 'Cặp', 'Solitaire', 'Cathedral', 'Trellis,Solitaire', 'Thiết kế Jewelry'].map((style) => (
                          <MenuItem
                            key={style}
                            component={Link}
                            href={`/USER/categorie/${categorie.categoryID}?style=${style.toLowerCase()}`}
                          >
                            {style}
                          </MenuItem>
                        ))}
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Image src="/images/header1.png" alt="Featured Rings" width={350} height={200} style={{ borderRadius: '5px' }} />
                      </Box>
                    </Box>
                  </Menu>
                </Box>
              ))}
              <motion.div variants={childVariants} custom={mainCategories.length + 1}>
                <Link href="/USER/aa">
                  <StyledButton
                    sx={{
                      color: pathname === '/USER/aa' ? '#a64ca6' : '#333',
                      fontWeight: pathname === '/USER/aa' ? 'bold' : 500,
                    }}
                  >
                    Khuyến mãi
                  </StyledButton>
                </Link>
              </motion.div>
              <motion.div variants={childVariants} custom={mainCategories.length + 2}>
                <Link href="/USER/aa">
                  <StyledButton
                    sx={{
                      color: pathname === '/USER/aa' ? '#a64ca6' : '#333',
                      fontWeight: pathname === '/USER/aa' ? 'bold' : 500,
                    }}
                  >
                    Tin tức
                  </StyledButton>
                </Link>
              </motion.div>
            </Box>
            <motion.div variants={childVariants} custom={mainCategories.length + 3}>
              <TextField
                placeholder="Tìm kiếm nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: '300px', ml: 5, '& .MuiInputBase-root': { height: '32px' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '14px' },
                }}
              />
            </motion.div>
          </Box>
        </motion.div>
      </StyledHeaderBox>

      <StyledDrawer anchor="right" open={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)}>
        <Box sx={{ padding: '20px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
              Tài Khoản Của Tôi
            </Typography>
            <IconButton onClick={() => setIsUserPanelOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Tài khoản"
            value={userInfo?.phone_number || 'Chưa đăng nhập'}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Tên hiển thị"
            value={userInfo?.full_name || 'Chưa đăng nhập'}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
          />
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
            Thay đổi mật khẩu
          </Typography>
          <TextField
            label="Mật khẩu hiện tại"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          {error && (
            <Typography variant="body2" sx={{ color: 'red', textAlign: 'center', mt: 1 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleChangePassword}>
              Lưu Thay Đổi
            </Button>
            <Button variant="contained" color="secondary" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Box>
        </Box>
      </StyledDrawer>
      
      <motion.div
        style={{ position: 'fixed', bottom: '100px', right: '30px', zIndex: 1000 , cursor: 'pointer' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
      <Image src="/images/lucky-wheel.png" alt="Lucky Wheel" width={55} height={50} onClick={handleOpenLuckyWheel} />
      </motion.div>
      <motion.div
        style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000}}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Fab sx={{ backgroundColor: '#a64ca6', color: '#fff', '&:hover': { backgroundColor: '#8e3e8e' } }} onClick={toggleChat}>
          <ChatIcon />
        </Fab>
      </motion.div>
      {isLuckyWheelOpen && userInfo && (
        <LuckyWheel
          onClose={() => setIsLuckyWheelOpen(false)}
          userID={userInfo.perID}
        />
      )}

      {showChat && (
        <motion.div initial="hidden" animate="visible" exit="exit" variants={chatBoxVariants}>
          <StyledChatBox>
            <StyledChatHeader>
              <Box>
                <Typography variant="h6">Jewelry</Typography>
                <Typography variant="caption">Natural Diamond Jewelry</Typography>
              </Box>
              <IconButton onClick={() => setShowChat(false)} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </StyledChatHeader>
            <StyledChatMessages>
              <List>
                {currentChatUser?.messages.map((msg, index) => (
                  <ListItem key={index} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <StyledMessage isUser={msg.sender === 'user'}>
                      {msg.image ? (
                        <img src={msg.image} alt="chat image" style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px' }} />
                      ) : (
                        <ListItemText primary={msg.text} />
                      )}
                    </StyledMessage>
                  </ListItem>
                ))}
              </List>
            </StyledChatMessages>
            <StyledChatInput>
              <label>
                <IconButton component="span" disabled={isSending}>
                  <AttachFileIcon />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
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
                sx={{ color: '#a64ca6', ml: 1 }}
              >
                <SendIcon />
              </IconButton>
            </StyledChatInput>
          </StyledChatBox>
        </motion.div>
      )}
    </>
  );
};

export default Header;