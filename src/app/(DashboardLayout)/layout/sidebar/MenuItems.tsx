import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconMoodHappy,
  IconTypography,
  IconUser,
  IconGift, // Thay cho voucher
  IconChartBar, // Thay cho thống kê doanh thu
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  { 
    navlabel: true,
    subheader: "ALAN CORP",
    style: { fontSize: '12px', fontWeight: 'bold', color: '#5D87FF' },
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "SHOP HOA",
  },
  {
    id: uniqueId(),
    title: "Quản lý người dùng",
    icon: IconUser,
    href: "/utilities/customer",
  },
  {
    id: uniqueId(),
    title: "Quản lý đơn hàng",
    icon: IconCopy,
    href: "/utilities/shadow",
  },
  {
    id: uniqueId(),
    title: "Quản lý voucher",
    icon: IconGift, // Đổi icon voucher
    href: "/utilities/voucher",
  },
  {
    id: uniqueId(),
    title: "Thống kê doanh thu",
    icon: IconChartBar, // Đổi icon thống kê doanh thu
    href: "/utilities/thongke",
  },
  {
    navlabel: true,
    subheader: "STUDIO",
  },
  {
    navlabel: true,
    subheader: "AI CORP",
  },
  {
    id: uniqueId(),
    title: "Profile công ty",
    icon: IconTypography, // Đổi icon cho trang Profile công ty
    href: "/icons",
  },
  {
    id: uniqueId(),
    title: "Sample Page",
    icon: IconAperture,
    href: "/sample-page",
  },
];

export default Menuitems;


