'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './styleHome.css';

interface Province {
  code: number;
  name: string;
}

export default function Home() {
  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/')
      .then((response) => response.json())
      .then((data: Province[]) => {
        setProvinces(data);
      })
      .catch((error) => console.error('Lỗi khi tải danh sách tỉnh thành:', error));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [showAd]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 15,
        duration: 0.5,
      },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#f8dff6] to-[#e3e3e3]">
      <Header />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ marginTop: '128px' }}
      >
        {showAd && (
          <motion.div
            className="modal-overlay"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            <motion.div className="modal-content">
              <motion.button
                className="close-btn"
                onClick={() => setShowAd(false)}
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
              <motion.div variants={childVariants}>
                <Image className="img-modal" src="/images/modal.png" alt="Quảng cáo" width={500} height={300} />
              </motion.div>
              <motion.div className="form-modal" variants={childVariants}>
                <input className="text-modal" type="text" placeholder="Họ và tên" />
                <input className="text-modal" type="text" placeholder="Số điện thoại" />
                <select className="text-modal">
                  <option value="">Chọn tỉnh thành</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <motion.button
                  className="btn-modal"
                  whileHover={{ scale: 1.05, backgroundColor: '#a64ca6', color: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                >
                  TƯ VẤN NGAY
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <Image src="/images/banner1.png" alt="Banner 1" width={1920} height={800} className="banner-image" />
        </motion.div>

        <motion.section
          className="fine-section"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={childVariants}>
            <h4 className="fine-title">Fine Jewelry</h4>
          </motion.div>
          <motion.div variants={childVariants}>
            <p className="fine-subtitle">Thế giới lấp lánh của quý cô hiện đại</p>
          </motion.div>
          <div className="fine-items">
            {[
              { src: '/images/news4.png', alt: 'fine 1', text: 'Nhẫn cầu hôn', href: '/user/products' },
              { src: '/images/fine2.png', alt: 'fine 2', text: 'Vòng tay - Lắc tay', href: '/user/products' },
              { src: '/images/fine3.png', alt: 'fine 3', text: 'Dây chuyền', href: '/user/products' },
              { src: '/images/fine4.png', alt: 'fine 4', text: 'Nhẫn thời trang', href: '/user/products' },
              { src: '/images/fine5.png', alt: 'fine 5', text: 'Bông tai', href: '/user/products' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="fine-item"
                variants={childVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 150 }}
              >
                <Image src={item.src} alt={item.alt} width={150} height={150} className="fine-image" />
                <p className="fine-text">
                  <Link href={item.href}>{item.text}</Link>
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <Image src="/images/banner2.png" alt="Banner 2" width={1920} height={80} className="banner-image" />
        </motion.div>

        <motion.section
          className="store-system-section"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="store-system-container">
            <motion.div className="store-system-image" variants={childVariants}>
              <Image src="/images/store-system.png" alt="Hệ thống cửa hàng" width={600} height={400} className="store-system-img" />
            </motion.div>
            <div className="store-system-text">
              <motion.div variants={childVariants}>
                <h4>Hệ thống cửa hàng</h4>
              </motion.div>
              <motion.div variants={childVariants}>
                <p>Thế giới trang sức cực không gian mua sắm tuyệt vời dành cho bạn ghé thăm.</p>
              </motion.div>
              <motion.div variants={childVariants}>
                <p>
                  Với hệ thống showroom và chính sách giao hàng nhanh toàn quốc hoàn toàn miễn phí, Tierra sẽ giúp quá trình mua hàng của bạn trở nên tiện lợi, nhanh chóng, tiết kiệm và an toàn hơn.
                </p>
              </motion.div>
              <motion.div variants={childVariants}>
                <p>Tìm cửa hàng gần bạn nhất.</p>
              </motion.div>
              <motion.div variants={childVariants}>
                <Link href="/stores" className="store-system-btn">
                  <motion.span
                    whileHover={{ scale: 1.05, backgroundColor: '#a64ca6', color: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ĐẶT LỊCH HẸN
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="reasons-section"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={childVariants}>
            <h4 className="title">Lựa chọn trang sức lý tưởng</h4>
          </motion.div>
          <div className="reasons-items">
            {[
              { src: '/images/reason1.png', alt: 'Reason 1', text: 'Thân thiện & Tình cảm' },
              { src: '/images/reason2.png', alt: 'Reason 2', text: 'Tinh tuyền tốt nhất' },
              { src: '/images/reason3.png', alt: 'Reason 3', text: 'Tạo tác từ trái tim' },
              { src: '/images/reason4.png', alt: 'Reason 4', text: 'Tư vấn 1:1 tận tâm' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="reason-item"
                variants={childVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 150 }}
              >
                <Image src={item.src} alt={item.alt} width={150} height={150} className="reason-image" />
                <p className="reason-text">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="news-section"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="news-container">
            <div className="news-featured">
              <motion.div className="news-featured-image" variants={childVariants}>
                <Image src="/images/news-featured.png" alt="News Featured" width={600} height={400} className="news-featured-img" />
              </motion.div>
              <div className="news-featured-text">
                <motion.div variants={childVariants}>
                  <p className="news-category">Tin nổi bật</p>
                </motion.div>
                <motion.div variants={childVariants}>
                  <h5>Jewelry Natural Diamond chào đón cửa hàng thứ 12 tại Hai Bà Trưng, Quận 1</h5>
                </motion.div>
                <motion.div variants={childVariants}>
                  <p>
                    Jewelry Natural Diamond nhen đỏ niềm vui khi chính thức chào đón cửa hàng thứ mười hai tại số 464 Hai Bà Trưng, phường Tân Định, Quận 1 vào ngày 11/01/2025.
                  </p>
                </motion.div>
              </div>
            </div>
            <div className="news-list">
              <motion.div variants={childVariants}>
                <h5>Tin mới nhất</h5>
              </motion.div>
              {[
                {
                  src: '/images/news1.png',
                  alt: 'News 1',
                  text: 'Kim cương Lab-grown là gì? Sự khác nhau giữa Kim cương tự nhiên và kim cương Lab-grown: Đâu là sự lựa chọn tốt nhất?',
                  date: '04/02/2025',
                },
                {
                  src: '/images/news2.png',
                  alt: 'News 2',
                  text: 'Hướng dẫn 4 cách đo size nhẫn chuẩn, không sai 1 li',
                  date: '24/03/2025',
                },
                {
                  src: '/images/news3.png',
                  alt: 'News 3',
                  text: 'Spark Of Heaven – Bộ sưu tập lấp lánh của hôn lễ mới từ Tierra Diamond',
                  date: '01/10/2024',
                },
                {
                  src: '/images/news4.png',
                  alt: 'News 4',
                  text: 'Thiết kế độc quyền Jewelry – Sở hữu chiếc nhẫn duy nhất do bạn thiết kế không phải là điều khó cho đội ngũ Jewelry.',
                  date: '01/04/2024',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="news-item"
                  variants={childVariants}
                  whileHover={{ scale: 1.02, backgroundColor: '#f8f8f8' }}
                  transition={{ type: 'spring', stiffness: 150 }}
                >
                  <div className="news-item-image">
                    <Image src={item.src} alt={item.alt} width={100} height={100} className="news-item-img" />
                  </div>
                  <div className="news-item-text">
                    <p>{item.text}</p>
                    <p className="news-date">{item.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.main>
      <Footer />
    </div>
  );
}