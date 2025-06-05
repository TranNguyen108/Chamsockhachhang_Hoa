import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
<LinkStyled
  href="/"
  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}
>
  <Image src="/images/logos/logo.png" alt="logo" height={70} width={70} priority />
</LinkStyled>


  );
};

export default Logo;
  