'use client';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { Box, Typography, Divider, Stack, Paper } from '@mui/material';

const CompanyProfile = () => {
  return (
    <PageContainer title="Profile công ty" description="Thông tin tổng quan về công ty">
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Typography variant="h3" fontWeight={700} mb={2} color="primary.main">ALÂN CORP</Typography>
        <Divider sx={{ mb: 3 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box flex={1}>
            <Typography variant="h5" fontWeight={600} mb={1}>Giới thiệu</Typography>
            <Typography mb={2}>
              ALÂN CORP là công ty chuyên cung cấp dịch vụ hoa tươi, studio chụp ảnh, tổ chức sự kiện và các giải pháp sáng tạo cho khách hàng cá nhân và doanh nghiệp. Chúng tôi cam kết mang đến sản phẩm và dịch vụ chất lượng cao, sáng tạo và tận tâm.
            </Typography>
            <Typography variant="h6" fontWeight={600} mb={1}>Lĩnh vực hoạt động</Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Dịch vụ hoa tươi, điện hoa</li>
              <li>Studio chụp ảnh cưới, ảnh nghệ thuật</li>
              <li>Tổ chức sự kiện, trang trí tiệc</li>
              <li>Thiết kế và in ấn thiệp, quà tặng</li>
            </ul>
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600} mb={1}>Thông tin liên hệ</Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography><b>Địa chỉ:</b> 123 Đường Hoa Hồng, Quận 1, TP.HCM</Typography>
              <Typography><b>Điện thoại:</b> 0909 123 456</Typography>
              <Typography><b>Email:</b> contact@alancorp.vn</Typography>
              <Typography><b>Website:</b> www.alancorp.vn</Typography>
            </Paper>
            <Typography variant="h6" fontWeight={600} mb={1}>Tầm nhìn & Sứ mệnh</Typography>
            <Typography mb={2}>
              <b>Tầm nhìn:</b> Trở thành thương hiệu hàng đầu trong lĩnh vực hoa tươi, studio và tổ chức sự kiện tại Việt Nam.<br />
              <b>Sứ mệnh:</b> Mang lại trải nghiệm dịch vụ tốt nhất, sáng tạo nhất cho khách hàng.
            </Typography>
          </Box>
        </Stack>
      </Box>
    </PageContainer>
  );
};

export default CompanyProfile;
