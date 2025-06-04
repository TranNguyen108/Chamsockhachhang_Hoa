import React from 'react';
import { Box, AppBar, Toolbar, styled, IconButton, Button } from '@mui/material';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { IconMenu } from '@tabler/icons-react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

interface ItemType {
  toggleMobileSidebar:  (event: React.MouseEvent<HTMLElement>) => void;
}

const Header = ({toggleMobileSidebar}: ItemType) => {
  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/authentication/login');
  };
  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={toggleMobileSidebar}
          sx={{
            display: {
              lg: "none",
              xs: "inline",
            },
          }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>
        <Box flexGrow={1} />
        <Button color="primary" variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
