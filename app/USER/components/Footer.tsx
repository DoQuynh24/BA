'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';


const StyledFooter = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(90deg, #f8dff6, #e3e3e3)',
  padding: '40px 0',
  marginTop: '50px',
  color: '#666',
}));

const Footer: React.FC = () => {
  return (
    <StyledFooter>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <List sx={{ display: 'flex', justifyContent: 'center', gap: '20px', mb: 4 }}>
          {['Facebook', 'Instagram', 'Tiktok', 'X', 'Spotify', 'Threads', 'Zalo'].map((platform) => (
            <ListItem key={platform}>
              <Link href="#" passHref>
                <Typography sx={{ color: '#a64ca6', textTransform: 'uppercase', '&:hover': { color: '#704323' } }}>
                  {platform}
                </Typography>
              </Link>
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              CÔNG TY
            </Typography>
            <List>
              <ListItem>
                <Link href="#" passHref>
                  <ListItemText primary="Giới thiệu về chúng tôi" sx={{ '&:hover': { color: '#a64ca6' } }} />
                </Link>
              </ListItem>
              <ListItem>
                <ListItemText primary="268Đ, Quận Cầu Giấy, Hà Nội, Vietnam" />
              </ListItem>
              <ListItem>
                <ListItemText primary="0364554001 - Thứ 2 - Chủ nhật: 9:00 - 18:00" />
              </ListItem>
              <ListItem>
                <ListItemText primary="sullybagVN.vn@gmail.com" />
              </ListItem>
            </List>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              THEO DÕI CHÚNG TÔI
            </Typography>
            <List>
              {['Facebook', 'Instagram', 'Tiktok', 'X', 'Spotify', 'Threads', 'Zalo'].map((platform) => (
                <ListItem key={platform}>
                  <Link href="#" passHref>
                    <ListItemText primary={platform} sx={{ '&:hover': { color: '#a64ca6' } }} />
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              CHÍNH SÁCH
            </Typography>
            <List>
              <ListItem>
                <Link href="#" passHref>
                  <ListItemText primary="Chính sách bảo mật" sx={{ '&:hover': { color: '#a64ca6' } }} />
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#" passHref>
                  <ListItemText primary="Điều kiện mua hàng" sx={{ '&:hover': { color: '#a64ca6' } }} />
                </Link>
              </ListItem>
              <ListItem>
                <Link href="#" passHref>
                  <ListItemText primary="Cài đặt Cookie" sx={{ '&:hover': { color: '#a64ca6' } }} />
                </Link>
              </ListItem>
            </List>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              KẾT NỐI VỚI JEWELRY
            </Typography>
            <Image src="/images/logo.png" alt="logo" width={170} height={100} />
            <Box sx={{ display: 'flex', gap: '16px', justifyContent: 'center', mt: 2 }}>
              <motion.div whileHover={{ scale: 1.1 }}>
                <IconButton href="https://www.facebook.com/ddquynh.24">
                  <FacebookIcon sx={{ color: '#a64ca6' }} />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }}>
                <IconButton href="#">
                  <InstagramIcon sx={{ color: '#a64ca6' }} />
                </IconButton>
              </motion.div>
              
            </Box>
          </Box>
        </Box>
      </Box>
    </StyledFooter>
  );
};

export default Footer;