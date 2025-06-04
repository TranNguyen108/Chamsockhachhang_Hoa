import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconMoodHappy,
  IconTypography,
  IconUser,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "ALAN CORP",
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
    href: "/utilities/typography",
  },
  {
    id: uniqueId(),
    title: "Quản lý đơn hàng",
    icon: IconCopy,
    href: "/utilities/shadow",
  },
  {
    id: uniqueId(),
    title: "Thống kê doanh thu",
    icon: IconTypography,
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
    title: "Icons",
    icon: IconMoodHappy,
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


