// app/layout.tsx
'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { ToastProvider } from "./Component/ToastProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    let title = "Jewelry.VN";
    switch (pathname) {
      case "/":
        title = "Trang Chủ | Jewelry.VN";
        break;
      case "/Login":
        title = "Đăng nhập/Đăng ký | Jewelry.VN";
        break;
      case "/USER/Home":
        title = "Trang Chủ | Jewelry.VN";
        break;
      case "/USER/Products":
        title = "BST Trang sức vàng 14K, 18K, Kim cương thiết kế 2025";
        break;
      case "/USER/favourite":
        title = "Wishlist | Natural Diamond";
        break;
      case "/USER/orders":
        title = "Đặt hàng | Natural Diamond";
        break;
      case "/USER/invoices":
        title = "Tra cứu đơn hàng | Natural Diamond";
        break;
      case "/ADMIN/home":
        title = "Trang chủ | Jewelry.VN";
        break;
      case "/ADMIN/products":
        title = "Quản lý sản phẩm | Jewelry.VN";
        break;
      case "/ADMIN/invoices":
        title = "Quản lý hóa đơn | Jewelry.VN";
        break;
      case "/ADMIN/users":
        title = "Quản lý khách hàng | Jewelry.VN";
        break;
      default:
        if (pathname.startsWith("/USER/categorie/")) {
          title = "BST Trang sức vàng 14K, 18K, Kim cương thiết kế 2025";
        } else if (pathname.startsWith("/USER/details/")) {
          title = "BST Nhẫn cưới vàng 14K, 18K, Kim cương thiết kế 2025";
        } else {
          title = "Trang quản trị Jewelry.VN";
        }
        break;
    }
    document.title = title;
  }, [pathname]);

  return (
    <html lang="vi">
      <body suppressHydrationWarning> {/* Fix lỗi hydration */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}