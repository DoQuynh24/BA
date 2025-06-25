"use client";
import React from "react"; 
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from '../../components/Header'; 
import Footer from '../../components/Footer'; 
import "./styleDetails.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { motion } from 'framer-motion'; 
import io from "socket.io-client";

const mockData: Product[] = [
  {
    productID: 'NC19117',
    product_name: 'Nhẫn cưới CN6757',
    categoryID: 7,
    style: 'Cặp',
    stock: 3,
    description: "Nhẫn cưới thiết kế tinh tế, phù hợp cho các cặp đôi hiện đại.",
    materials: [
      { materialID: 1, material_name: "Vàng 18K", price: 5000000 },
      { materialID: 2, material_name: "Bạch kim", price: 8000000 },
    ],
    images: [
      { imageURL: "/images/1742868577913.png", is_main: 1 },
      { imageURL: "/images/1742868577918.png", is_main: 0 },
      { imageURL: "/images/1742868577904.png", is_main: 0 },
      { imageURL: "/images/1742868577909.png", is_main: 0 },
    ],
  },
];


interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface Image {
  imageURL: string;
  is_main: number;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: Material[];
  images: Image[];
}

interface UserInfo {
  perID: number;
  full_name: string;
  phone_number: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

export default function Details() {
  const params = useParams();
  const router = useRouter();
  const productID = params?.productID;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    setIsClient(true);
    const storedFavourites = typeof window !== "undefined" ? localStorage.getItem("favouriteProducts") : null;
    if (storedFavourites) {
      setFavouriteProducts(JSON.parse(storedFavourites));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("favouriteProducts", JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient]);

  useEffect(() => {
    if (productID) {
      try {
        const foundProduct = mockData.find((p) => p.productID === productID);
        if (foundProduct) {
          const formattedData: Product = {
            ...foundProduct,
            images: foundProduct.images.map((img) => ({
              ...img,
              imageURL: img.imageURL || "/images/addImage.png",
            })),
          };
          setProduct(formattedData);
          const mainImage = formattedData.images.find((img) => img.is_main === 1) || formattedData.images[0];
          setSelectedImage(mainImage?.imageURL || "/images/addImage.png");

          if (formattedData.materials && formattedData.materials.length > 0) {
            const defaultMaterial = formattedData.materials.reduce((min: Material, material: Material) =>
              material.price < min.price ? material : min
            );
            setSelectedMaterial(defaultMaterial);
          }
        } else {
          console.error("Không tìm thấy sản phẩm:", productID);
          setProduct(null);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        setProduct(null);
      }
    }
  }, [productID]);

  useEffect(() => {
    if (product) {
      try {
        const related = mockData
          .filter((prod) => prod.categoryID === product.categoryID && prod.productID !== productID)
          .slice(0, 4)
          .map((prod) => ({
            ...prod,
            images: prod.images.map((img) => ({
              ...img,
              imageURL: img.imageURL || "/images/addImage.png",
            })),
          }));
        setRelatedProducts(related);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm liên quan:", error);
        setRelatedProducts([]);
      }
    }
  }, [product, productID]);

  const getCurrentPrice = () => {
    if (selectedMaterial) {
      return selectedMaterial.price;
    }
    if (product && product.materials && product.materials.length > 0) {
      return Math.min(...product.materials.map((material: Material) => material.price));
    }
    return 0;
  };

  const toggleFavourite = (product: Product) => {
  const isFavourited = favouriteProducts.some((fav) => fav.productID === product.productID);
  if (isFavourited) {
    setFavouriteProducts(favouriteProducts.filter((fav) => fav.productID !== product.productID));
  } else {
    setFavouriteProducts([...favouriteProducts, product]);
    alert("Đã thêm sản phẩm yêu thích vào giỏ hàng");
  }
};

  const handleConsult = () => {
  if (!product) return;

  const storedUserInfo = localStorage.getItem("userInfo");
  if (!storedUserInfo) {
    alert("Vui lòng đăng nhập để gửi yêu cầu tư vấn!");
    router.push("/Login");
    return;
  }

  const userInfo: UserInfo = JSON.parse(storedUserInfo);
  const userChatKey = `chat_${userInfo.perID}`;
  let currentChat = localStorage.getItem(userChatKey)
    ? JSON.parse(localStorage.getItem(userChatKey) || "{}")
    : { name: "Admin", messages: [] };

  const messageText = `Yêu cầu tư vấn sản phẩm:\n- Mã sản phẩm: ${product.productID}\n- Tên sản phẩm: ${product.product_name}\n- Chất liệu: ${selectedMaterial?.material_name || product.materials[0]?.material_name}\n- Giá: ₫${getCurrentPrice().toLocaleString("vi-VN")}\n- Liên hệ: ${userInfo.phone_number}`;

  const messageData = {
    sender: "user",
    text: messageText,
    userName: userInfo.full_name,
    room: userInfo.full_name,
  };
  socket.emit("sendMessage", messageData, (response: any) => {
    if (response?.status !== "ok") {
      console.error("Gửi tin nhắn thất bại:", response?.error || "Unknown error");
    }
  });

  currentChat.messages.push({ sender: "user", text: messageText });
  localStorage.setItem(userChatKey, JSON.stringify(currentChat));

  socket.emit("joinRoom", userInfo.full_name);
  alert("Yêu cầu tư vấn đã được gửi tới người bán!");
};

  const handleBuyNow = () => {
    if (!product) return;

    if (product.stock === 0) {
      alert("Sản phẩm đã hết hàng!");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (!storedUserInfo) {
      alert("Vui lòng đăng nhập để đặt hàng!");
      router.push("/Login");
      return;
    }

    const orderData = {
      productID: product.productID,
      product_name: product.product_name,
      price: getCurrentPrice().toString(),
      selectedMaterial: JSON.stringify(selectedMaterial || product.materials[0]),
      imageURL: selectedImage || product.images[0]?.imageURL,
    };

    const query = new URLSearchParams(orderData as any).toString();
    router.push(`/USER/orders?${query}`);
  };

  if (!product) {
    return <div>Đang tải sản phẩm...</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        duration: 0.5,
      },
    },
  };

  const bannerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
  };

  const otherVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <Layout>
      <div id="content">
        <motion.div
          id="details"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div id="details-left">
            <Swiper
              modules={[Mousewheel]}
              direction="vertical"
              slidesPerView={2}
              mousewheel={true}
              className="swiper-container"
            >
              {product.images.map((img, index) => (
                <SwiperSlide key={index} onClick={() => setSelectedImage(img.imageURL)}>
                  <div className="thumb">
                    <Image
                      src={img.imageURL}
                      alt={`thumb-${index}`}
                      width={160}
                      height={150}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <motion.div id="details-center" variants={itemVariants}>
            <Image className="selected" src={selectedImage} alt="selected" width={450} height={450} />
          </motion.div>

          <motion.div id="details-right" variants={itemVariants}>
            <p className="name-product">{product.product_name}</p>
            <span className="price">{getCurrentPrice().toLocaleString("vi-VN")} ₫</span>
            {/* <p className="original-price">{(getCurrentPrice() * 1.05).toLocaleString("vi-VN")} ₫</p> */}

            <div className="detail-row">
              <span>Mã sản phẩm</span>
              <span>{product.productID}</span>
            </div>
            <div className="detail-row">
              <span>Kiểu dáng</span>
              <span>{product.style}</span>
            </div>
            <div className="detail-row">
              <span>Số lượng</span>
              <span>{product.stock}</span>
            </div>
            <div className="detail-row">
              <span>Chất liệu</span>
              <div className="material-container">
                {product.materials.map((material: Material, index: number) => (
                  <span
                    key={index}
                    className={`material-box ${selectedMaterial?.materialID === material.materialID ? "selected" : ""}`}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    {material.material_name}
                  </span>
                ))}
              </div>
            </div>
            <div id="description-container">
              <p className="description">{product.description}</p>
            </div>
            <div className="button-container">
              <motion.button
                className="consult"
                onClick={handleConsult}
                variants={itemVariants}
                whileHover={{ scale: 1.05}}
                whileTap={{ scale: 0.9 }}
              >
                TƯ VẤN
              </motion.button>
              <motion.button
                className="buy-now"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                variants={itemVariants}
                whileHover={{ scale: 1.05, backgroundColor: product.stock === 0 ? '#ccc' : '#a64ca6' }}
                whileTap={{ scale: 0.9 }}
              >
                {product.stock === 0 ? "HẾT HÀNG" : "MUA NGAY"}
              </motion.button>
            </div>
            <p>
              📞<u>0364 554 001</u>
            </p>
            <div className="detail-row">
              <span style={{ fontSize: "13px", color: "gray", fontStyle: "italic" }}>
                (*) Giá niêm yết trên đây là GIÁ THAM KHẢO dành cho vỏ nhẫn kim cương thiên nhiên với các thông số tiêu
                chuẩn. Giá chưa bao gồm giá viên chủ kim cương nếu có và có thể thay đổi trên thực tế tùy thuộc vào thông
                số cụ thể theo ni tay và yêu cầu riêng của từng khách hàng.
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          id="other-1"
          variants={otherVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-other">Chính sách của Jewelry</p>
          <div id="other-detail">
            <Image src="/images/other1.png" alt="other1" width={260} height={220} />
            <Image src="/images/other2.png" alt="other2" width={260} height={220} />
            <Image src="/images/other3.png" alt="other3" width={260} height={220} />
          </div>
        </motion.div>

        <motion.div
          id="other-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-other">Có thể bạn quan tâm</p>
          <div id="content-2" className="grid">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((prod, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.0, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
                >
                  <Link href={`/USER/details/${prod.productID}`}>
                    <div className="new">
                      <span
                        className="heart-icon1"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavourite(prod);
                        }}
                      >
                        <Image
                          src={
                            isClient && favouriteProducts.some((fav) => fav.productID === prod.productID)
                              ? "/images/heart-filled.png"
                              : "/images/heart.png"
                          }
                          alt="heart"
                          width={23}
                          height={23}
                        />
                      </span>
                      <Image
                        src={
                          prod.images.find((img) => img.is_main === 1)?.imageURL ||
                          prod.images[0]?.imageURL ||
                          "/images/addImage.png"
                        }
                        alt={prod.product_name || "Hình ảnh sản phẩm"}
                        width={250}
                        height={250}
                      />
                      <div className="product-info">
                        <p className="product-name">{prod.product_name}</p>
                        <p className="product-price">
                          {(prod.materials && prod.materials.length > 0
                            ? Math.min(...prod.materials.map((material: Material) => material.price))
                            : 0
                          ).toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.p variants={itemVariants}>Không có sản phẩm liên quan.</motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}