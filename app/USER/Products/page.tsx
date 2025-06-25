"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./styleProduct.css";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import FilterTools from "../components/FilterTools";

const mockData = [
  {
    productID: 'NC19117',
    product_name: 'Nhẫn cưới CN6757',
    categoryID: 7,
    style: 'Cặp',
    stock: 0,
    images: [
      { imageURL: "/images/1742868577913.png", is_main: 1 },
      { imageURL: "/images/1742868577918.png", is_main: 0 },
      { imageURL: "/images/1742868577904.png", is_main: 0 },
      { imageURL: "/images/1742868577909.png", is_main: 0 },
    ],
  },
  {
    productID: 'NC48206',
    product_name: 'Nhẫn cưới BNC0001',
    categoryID: 7,
    style: 'Cặp',
    stock: 4
  },
  {
    productID: 'NC54401',
    product_name: 'Nhẫn cưới BNC1003',
    categoryID: 7,
    style: 'Cặp',
    stock: 6
  },
  {
    productID: 'NH43992',
    product_name: 'Nhẫn cầu hôn Tiny Lovely',
    categoryID: 1,
    style: 'Solitaire',
    stock: 4
  },
  {
    productID: 'NH59637',
    product_name: 'Nhẫn cưới CND6546',
    categoryID: 7,
    style: 'Cặp',
    stock: 3
  },
  {
    productID: 'NH66464',
    product_name: 'Nhẫn cầu hôn kim cương Cathedral',
    categoryID: 1,
    style: 'Solitaire',
    stock: 5
  },
  {
    productID: 'NH72371',
    product_name: 'Nhẫn cầu hôn Lavish Veil',
    categoryID: 1,
    style: 'Trellis,Solitaire',
    stock: 4
  },
  {
    productID: 'NH76685',
    product_name: 'Nhẫn cầu hôn Flaming Lines',
    categoryID: 1,
    style: 'Solitaire',
    stock: 6
  },
  {
    productID: 'NH82627',
    product_name: 'AAA',
    categoryID: 1,
    style: 'aaa',
    stock: 2
  },
  {
    productID: 'NH89313',
    product_name: 'Nhẫn cầu hôn Trellis Blossoms',
    categoryID: 1,
    style: 'Trellis,Solitaire',
    stock: 3
  },
  {
    productID: 'NN00384',
    product_name: 'Nhẫn cưới nữ BCF0012',
    categoryID: 9,
    style: 'Thiết kế Jewelry',
    stock: 5
  }
];


interface Province {
  code: number;
  name: string;
}

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

interface Category {
  categoryID: number;
  category_name: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

export default function Product() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [isAccordionVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userPerID, setUserPerID] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    setIsClient(true);

    const storedUserInfo = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserPerID(parsedUserInfo.perID);

      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        setFavouriteProducts(JSON.parse(storedFavourites));
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && userPerID) {
      const userFavouritesKey = `favouriteProducts_${userPerID}`;
      localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient, userPerID]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Province[] = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh thành:", error);
        setProvinces([]);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${API_URL}/materials`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        const data = responseData.data || responseData || [];
        if (Array.isArray(data)) {
          setMaterials(data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy chất liệu:", error);
        setMaterials([]);
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        const data = responseData.data || responseData || [];
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

 useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const responseData = await response.json();
      const data = responseData.data || responseData || [];
      let formattedData: Product[] = [];
      if (Array.isArray(data) && data.length > 0) {
        formattedData = data.map((product: Product) => ({
          ...product,
          images: product.images.map((img: Image) => ({
            ...img,
            imageURL: img.imageURL
              ? img.imageURL.startsWith("/")
                ? `${process.env.NEXT_PUBLIC_API_URL}${img.imageURL}`
                : img.imageURL
              : "/images/addImage.png",
          })),
        }));
      } else {
        formattedData = mockData.map((product) => ({
          ...product,
          description: "Mô tả sản phẩm mẫu",
          materials: [{ materialID: 1, material_name: "Vàng 18K", price: 5000000 }],
          images: product.images || [{ imageURL: "/images/addImage.png", is_main: 1 }],
        }));
      }
      setProducts(formattedData);
      console.log(formattedData);
      setFilteredProducts(formattedData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
      const formattedMockData = mockData.map((product) => ({
        ...product,
        description: "Mô tả sản phẩm mẫu",
        materials: [{ materialID: 1, material_name: "Vàng 18K", price: 5000000 }],
        images: product.images || [{ imageURL: "/images/addImage.png", is_main: 1 }],
      }));
      setProducts(formattedMockData);
      setFilteredProducts(formattedMockData);
    }
  };
  fetchProducts();
}, [categories]);

  

  const handleFilter = () => {
    let filtered = [...products];

    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.product_name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedMaterial) {
      filtered = filtered.filter((product) =>
        product.materials.some((m) => m.materialID === selectedMaterial)
      );
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => {
        const price = calculateProductPrice(product.materials);
        return price >= min && (max ? price <= max : true);
      });
    }

    if (sortOrder) {
      filtered.sort((a, b) => {
        const priceA = calculateProductPrice(a.materials);
        const priceB = calculateProductPrice(b.materials);
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [query, selectedMaterial, priceRange, sortOrder, products]);

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const calculateProductPrice = (materials: Material[]) => {
    if (!materials || materials.length === 0) return 0;
    return Math.min(...materials.map((material) => material.price));
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

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 0.6,
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

  const paginationVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <Layout>
      <div id="content">
        <motion.div id="content-1" variants={bannerVariants} initial="hidden" animate="visible">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={4}
            pagination={{ clickable: true }}
            autoplay={{ delay: 2000 }}
            loop={true}
          >
            {[
              { src: "/images/1.png", alt: "1", text: "Best Selling" },
              { src: "/images/2.png", alt: "2", text: "New Collection" },
              { src: "/images/3.png", alt: "3", text: "Truyền thống" },
              { src: "/images/4.png", alt: "4", text: "Hiện đại" },
              { src: "/images/5.png", alt: "5", text: "Luxury" },
              { src: "/images/6.png", alt: "6", text: "Trendy" },
            ].map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="newP">
                  <Image src={slide.src} alt={slide.alt} width={230} height={200} />
                  <h4 className="text">{slide.text}</h4>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {isClient && (
          <FilterTools
            materials={materials}
            selectedMaterial={selectedMaterial}
            setSelectedMaterial={setSelectedMaterial}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        <motion.div className="all-products" variants={containerVariants} initial="hidden" animate="visible">
          {query && <p>Kết quả tìm kiếm cho: "{query}"</p>}
          <p className="product-count">{filteredProducts.length} sản phẩm</p>
          <motion.div id="content-2" className={viewMode} variants={containerVariants}>
            {currentProducts.length > 0 ? (
              currentProducts.map((product, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.0, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" }}
                >
                  <Link href={`/USER/details/${product.productID}`}>
                    <div className={`newP ${viewMode}`}>
                      <span
                        className="heart-icon1"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavourite(product);
                        }}
                      >
                        <Image
                          src={
                            isClient && favouriteProducts.some((fav) => fav.productID === product.productID)
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
                          product.images.find((img) => img.is_main === 1)?.imageURL ||
                          product.images[0]?.imageURL ||
                          "/images/addImage.png"
                        }
                        alt={product.product_name || "Hình ảnh sản phẩm"}
                        width={viewMode === "grid" ? 250 : 150}
                        height={viewMode === "grid" ? 250 : 150}
                      />
                      <div className="product-info">
                        <p className="product-name" style={{ textDecoration: "none" }}>
                          {product.product_name}
                        </p>
                        <p className="product-price">
                          {calculateProductPrice(product.materials).toLocaleString("vi-VN")} ₫
                        </p>
                        {viewMode === "list" && (
                          <p className="product-description">{product.description.slice(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.p variants={itemVariants}>
                {query
                  ? `Không tìm thấy sản phẩm nào khớp với từ khóa "${query}".`
                  : "Không có sản phẩm nào phù hợp với bộ lọc."}
              </motion.p>
            )}
          </motion.div>

          {totalPages > 1 && (
            <motion.div
              className="pagination"
              variants={paginationVariants}
              initial="hidden"
              animate="visible"
            >
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                  whileHover={{ scale: 1.15, backgroundColor: "#a64ca6", color: "white" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {index + 1}
                </motion.button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Sau
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div className="img-container" variants={bannerVariants} initial="hidden" animate="visible">
          <Image className="img-poster" src="/images/poster.png" alt="poster" width={500} height={150} />
        </motion.div>

        {isAccordionVisible && (
          <motion.div className="accordion" variants={containerVariants} initial="hidden" animate="visible">
            {[
              {
                title: "Kinh nghiệm chọn mua nhẫn cưới cho các cặp đôi",
                content: (
                  <>
                    <p>
                      Khi chọn mua nhẫn cưới, các cặp đôi cần lưu ý nhiều yếu tố để đảm bảo chọn được sản phẩm vừa ý,
                      bền bỉ và phù hợp với nhu cầu. Dưới đây là một số kinh nghiệm hữu ích:
                    </p>
                    <p>
                      Ngân sách là một trong những yếu tố quan trọng nhất. Các cặp đôi nên thống nhất một khoản chi phí
                      cụ thể trước khi đi mua nhẫn để tránh việc chi tiêu vượt quá khả năng tài chính.
                    </p>
                    <p>
                      Nhẫn cưới được sử dụng hàng ngày, thiết kế tiện dụng và chất liệu bền bỉ cần được ưu tiên. Những
                      chiếc nhẫn có kiểu dáng đơn giản, ít chi tiết cầu kỳ sẽ phù hợp hơn cho sinh hoạt và công việc
                      thường nhật, đặc biệt đối với những người thường xuyên làm việc tay chân. Chất liệu như vàng hoặc
                      bạch kim là lựa chọn lý tưởng vì không bị oxy hóa và giữ được độ sáng bóng qua thời gian.
                    </p>
                    <p>
                      Kích thước nhẫn cũng là yếu tố không thể bỏ qua. Việc thử nhẫn cẩn thận để đảm bảo vừa tay, không
                      quá chật hoặc rộng, sẽ giúp bạn thoải mái khi đeo.
                    </p>
                    <p>
                      Nếu chọn nhẫn cưới có đính kim cương, cần đặc biệt lưu ý đến chất lượng viên kim cương. Các cặp đôi
                      nên tìm hiểu về các tiêu chí 4C kim cương để đảm bảo viên chủ kim cương có chất lượng tốt. Ngoài
                      ra, nên kiểm tra xem viên kim cương được đính chắc chắn hay không, vì đây là yếu tố quyết định độ
                      bền của chiếc nhẫn khi đeo hàng ngày.
                    </p>
                    <p>
                      Nên tham khảo trước các mẫu nhẫn qua website của các thương hiệu trang sức để tiết kiệm thời gian
                      khi đến cửa hàng. Đồng thời, việc chuẩn bị sớm, từ 2-3 tháng trước ngày cưới, sẽ giúp bạn có thời
                      gian để đặt mẫu thiết kế riêng hoặc điều chỉnh kích thước nếu cần.
                    </p>
                  </>
                ),
              },
              {
                title: "Cách đo kích thước nhẫn cưới chính xác",
                content: (
                  <>
                    <p>
                      Hướng dẫn đo ni tay và so sánh kết quả với bảng size nhẫn chỉ bằng giấy, bút, thước chính xác
                      nhất.
                    </p>
                    <p>Bước 1: Dùng kéo cắt tờ giấy thành sợi dài khoảng 10 cm và rộng 1 cm.</p>
                    <p>Bước 2: Quấn mảnh giấy đã cắt quanh ngón tay cần đo.</p>
                    <p>Bước 3: Dùng bút đánh dấu điểm giao nhau của hai đầu mảnh giấy.</p>
                    <p>Bước 4: Tháo mảnh giấy ra và dùng thước đo chiều dài từ điểm đầu đến điểm đánh dấu.</p>
                    <p>Bước 5: Chia kết quả đo cho 3,14.</p>
                    <p>Bước 6: So sánh kết quả với bảng đo size nhẫn bên dưới để xác định size phù hợp.</p>
                    <Image className="size" src="/images/size.png" alt="size" width={300} height={400} />
                  </>
                ),
              },
              {
                title: "Dịch vụ và chính sách bảo hành dành cho nhẫn cưới",
                content: (
                  <>
                    <p>
                      Khách hàng sẽ không chỉ được trải nghiệm không gian tư vấn riêng tư, thoải mái mà còn dễ dàng chia
                      sẻ những mong muốn của mình thông qua chế độ tư vấn 1-1 tận tình từ đội ngũ tư vấn viên chuyên
                      nghiệp, giúp tìm ra giải pháp tối ưu cho mức ngân sách đề ra.
                    </p>
                    <p>Chính sách bảo hành tại Jewelry:</p>
                    <p>
                      Jewelry cung cấp dịch vụ thâu nới size nhẫn cộng/trừ 2 ni miễn phí nhằm đảm bảo sự vừa vặn khi đeo.
                      Với các thiết kế tiêu chuẩn, bạn có thể điều chỉnh kích thước nhẫn tăng hoặc giảm tối đa 2 ni, giúp
                      nhẫn phù hợp và thoải mái nhất khi đeo. Lưu ý rằng, một số mẫu thiết kế đặc biệt không thể thâu nới
                      do đặc điểm cấu trúc hoặc chi tiết trang trí tinh xảo nhưng đội ngũ Jewelry luôn sẵn sàng tư vấn
                      giải pháp tốt nhất cho từng trường hợp cụ thể.
                    </p>
                    <p>
                      Đối với nhẫn cưới có đá viên tấm kim cương hoặc CZ dưới 2mm ly bị rơi hoặc mất, Jewelry sẽ hỗ trợ
                      thay hoàn toàn miễn phí trong quá trình bảo hành. Jewelry cam kết luôn đảm bảo viên đá được thay thế
                      sẽ có kích thước, màu sắc và độ sáng tương đồng với viên đá ban đầu.
                    </p>
                    <p>
                      Chính sách đánh bóng, xi mạ và làm mới trọn đời miễn phí cho tất cả các sản phẩm nhẫn cưới. Với
                      chính sách này, khách hàng có thể hoàn toàn yên tâm rằng chiếc nhẫn của mình sẽ luôn được duy trì
                      trong trạng thái hoàn hảo nhất mà không bị giới hạn số lần bảo dưỡng. Bất kể khi nào cần, Jewelry sẽ
                      hỗ trợ đánh bóng lại bề mặt, xi mạ vàng hoặc rhodium theo nhu cầu của sản phẩm, giúp chiếc nhẫn luôn
                      sáng đẹp và bền bỉ như ngày đầu. Đây là cam kết trọn đời của chúng tôi nhằm tôn vinh giá trị và ý
                      nghĩa vĩnh cửu của mỗi chiếc nhẫn trong hành trình hạnh phúc của khách hàng.
                    </p>
                    <ul>
                      <li>
                        - Tất cả kim cương của Jewelry (kích thước từ 4.00 mm trở lên) đều được kiểm định và có giấy
                        chứng nhận từ GIA.
                      </li>
                      <li>- Đảm bảo hàm lượng vàng 14k, 18k trong mỗi sản phẩm luôn đạt chuẩn hoặc vượt giá trị công bố.</li>
                      <li>- Cấu trúc đai nhẫn Comfort Fit mang lại cảm giác êm ái, thoải mái khi đeo và dễ dàng tháo ra.</li>
                      <li>
                        - Công nghệ mạ với hai lớp Palladium (Pd) và Rhodium (Rh), loại vật liệu cao cấp có giá trị gấp 20
                        lần vàng. Tránh gây ra các vấn đề về dị ứng da, giúp tăng độ bóng và bền đẹp vượt trội cho nhẫn
                        cưới.
                      </li>
                      <li>
                        - Các thông số kĩ thuật của sản phẩm (cân nặng, hàm lượng vàng, số lượng & kích cỡ kim cương tấm,
                        tiêu chuẩn 4C, …) đều được thể hiện rõ ràng và minh bạch trên Giấy Đảm Bảo.
                      </li>
                      <li>
                        - Dịch vụ BẢO HÀNH & SỬA CHỮA MIỄN PHÍ TRỌN ĐỜI với thân nhẫn và kim cương tấm dưới 2.0mm.
                      </li>
                      <li>
                        - Áp dụng quy trình chế tác khép kín, minh bạch, góp phần nâng tầm thị trường trang sức tại Việt
                        Nam, đặc biệt trong lĩnh vực kim cương tự nhiên. Mỗi sản phẩm đều là sự kết hợp hoàn hảo giữa giá
                        trị tinh thần và vẻ đẹp trường tồn.
                      </li>
                    </ul>
                  </>
                ),
              },
            ].map((item, index) => (
              <motion.div key={index} className="accordion-item" variants={itemVariants}>
                <motion.div
                  className="accordion-title"
                  onClick={() => toggleAccordion(index)}
                  whileHover={{ backgroundColor: "#f5f5f5" }}
                >
                  <span>{item.title}</span>
                  {openAccordion === index ? (
                    <Image src="/images/up.png" alt="Arrow Up" width={20} height={20} />
                  ) : (
                    <span className="plus-icon">
                      <Image src="/images/down.png" alt="Arrow Down" width={20} height={20} />
                    </span>
                  )}
                </motion.div>
                <motion.div
                  className={`accordion-content ${openAccordion === index ? "open" : ""}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: openAccordion === index ? "auto" : 0,
                    opacity: openAccordion === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {item.content}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}